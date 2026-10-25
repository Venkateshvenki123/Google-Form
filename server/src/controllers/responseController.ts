import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { validateFormSubmission } from '../services/validationService.js';
import { sendEmailNotification } from '../services/emailService.js';
import { generateExportData, generateCsv, generateExcelBuffer } from '../services/exportService.js';

export async function submitResponse(req: Request, res: Response): Promise<void> {
  const { formId, slug, answers, metadata } = req.body;

  try {
    // 1. Fetch form
    let formQuery = 'SELECT * FROM forms WHERE id = $1 LIMIT 1';
    let formParams = [formId];

    if (!formId && slug) {
      formQuery = 'SELECT * FROM forms WHERE slug = $1 LIMIT 1';
      formParams = [slug];
    }

    const formRes = await db.query(formQuery, formParams);
    if (formRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    const form = formRes.rows[0];

    // 2. Check if published
    if (form.status !== 'published') {
      res.status(403).json({ success: false, error: 'This form is currently closed or not published.' });
      return;
    }

    const settings = form.settings || {};
    const now = new Date();

    // 3. Check dates
    if (settings.startDate && new Date(settings.startDate) > now) {
      res.status(403).json({
        success: false,
        error: `Submissions open on ${new Date(settings.startDate).toLocaleString()}.`,
      });
      return;
    }

    if (settings.endDate && new Date(settings.endDate) < now) {
      res.status(403).json({
        success: false,
        error: 'This form has reached its end date and is no longer accepting submissions.',
      });
      return;
    }

    // 4. Check submission limit
    if (settings.submissionLimit && Number(settings.submissionLimit) > 0) {
      const countRes = await db.query(
        'SELECT COUNT(*) as count FROM form_responses WHERE form_id = $1',
        [form.id]
      );
      const currentCount = parseInt(countRes.rows[0]?.count || '0', 10);
      if (currentCount >= Number(settings.submissionLimit)) {
        res.status(403).json({
          success: false,
          error: 'This form has reached its maximum response capacity.',
        });
        return;
      }
    }

    // 5. Fetch fields and validate
    const fieldsRes = await db.query(
      'SELECT id, field_type, label, required, options, validation FROM form_fields WHERE form_id = $1 ORDER BY position ASC',
      [form.id]
    );

    const fields = fieldsRes.rows;
    const submittedAnswers = answers || {};

    const validation = validateFormSubmission(fields, submittedAnswers);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Validation failed on one or more fields.',
        validationErrors: validation.errors,
      });
      return;
    }

    // 6. Detect respondent email & respondent name dynamically
    let respondentEmail = '';
    let respondentName = 'Anonymous';

    for (const f of fields) {
      if (f.field_type === 'email' && submittedAnswers[f.id]) {
        respondentEmail = String(submittedAnswers[f.id]).trim();
      }
      if (
        (f.field_type === 'short_text' || f.label.toLowerCase().includes('name')) &&
        submittedAnswers[f.id] &&
        respondentName === 'Anonymous'
      ) {
        respondentName = String(submittedAnswers[f.id]).trim();
      }
    }

    // 7. Save Response
    const responseId = uuidv4();
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientUserAgent = req.headers['user-agent'] || 'Unknown';

    const enrichedMetadata = {
      ip: String(clientIp),
      userAgent: clientUserAgent,
      submittedAt: new Date().toISOString(),
      ...(metadata || {}),
    };

    await db.query(
      `INSERT INTO form_responses (id, form_id, submitted_at, respondent_email, metadata)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)`,
      [responseId, form.id, respondentEmail, enrichedMetadata]
    );

    // 8. Save Response Values dynamically
    for (const f of fields) {
      if (f.field_type === 'section') continue;

      const rawVal = submittedAnswers[f.id];
      if (rawVal !== undefined && rawVal !== null) {
        await db.query(
          `INSERT INTO form_response_values (id, response_id, field_id, value)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), responseId, f.id, rawVal]
        );
      }
    }

    // 9. Email Notifications
    const emailSettings = settings.emailNotification || {};
    const formattedDate = new Date().toLocaleString();

    // Admin Notification
    if (emailSettings.adminNotify && emailSettings.adminEmail) {
      sendEmailNotification({
        to: emailSettings.adminEmail,
        subject: `New submission received for {{form_name}}`,
        template: `Hello,\n\nA new response has been submitted for "{{form_name}}" by {{respondent_name}} on {{submission_date}}.\n\nSubmission ID: ${responseId}\nRespondent Email: ${respondentEmail || 'Not specified'}\n\nView details in your FormCraft Admin Panel.`,
        variables: {
          form_name: form.title || form.name,
          respondent_name: respondentName,
          submission_date: formattedDate,
        },
      }).catch(err => console.error('Admin email error:', err));
    }

    // Respondent Confirmation
    if (emailSettings.userNotify && respondentEmail) {
      const userTemplate =
        emailSettings.userMessage ||
        `Hi {{respondent_name}},\n\nThank you for submitting "{{form_name}}" on {{submission_date}}. We have received your answers.\n\nBest regards,\nFormCraft`;

      sendEmailNotification({
        to: respondentEmail,
        subject: emailSettings.userSubject || `Confirmation: {{form_name}} submission received`,
        template: userTemplate,
        variables: {
          form_name: form.title || form.name,
          respondent_name: respondentName,
          submission_date: formattedDate,
        },
      }).catch(err => console.error('User confirmation email error:', err));
    }

    res.status(201).json({
      success: true,
      message: settings.successMessage || 'Your response has been recorded successfully.',
      redirectUrl: settings.redirectUrl || '',
      responseId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function listResponses(req: Request, res: Response): Promise<void> {
  const { formId, search, page = '1', limit = '20', startDate, endDate } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
  const offset = (pageNum - 1) * limitNum;

  try {
    let sql = `
      SELECT r.id, r.form_id, r.submitted_at, r.respondent_email, r.metadata,
             f.name as form_name, f.title as form_title
      FROM form_responses r
      JOIN forms f ON f.id = r.form_id
      WHERE 1=1
    `;
    let countSql = `
      SELECT COUNT(*) as total
      FROM form_responses r
      JOIN forms f ON f.id = r.form_id
      WHERE 1=1
    `;
    const params: any[] = [];
    const countParams: any[] = [];

    if (formId && formId !== 'all') {
      params.push(formId);
      countParams.push(formId);
      sql += ` AND r.form_id = $${params.length}`;
      countSql += ` AND r.form_id = $${countParams.length}`;
    }

    if (startDate) {
      params.push(startDate);
      countParams.push(startDate);
      sql += ` AND r.submitted_at >= $${params.length}`;
      countSql += ` AND r.submitted_at >= $${countParams.length}`;
    }

    if (endDate) {
      params.push(endDate);
      countParams.push(endDate);
      sql += ` AND r.submitted_at <= $${params.length}`;
      countSql += ` AND r.submitted_at <= $${countParams.length}`;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      countParams.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(r.respondent_email) LIKE $${params.length} OR LOWER(r.id) LIKE $${params.length} OR LOWER(f.name) LIKE $${params.length})`;
      countSql += ` AND (LOWER(r.respondent_email) LIKE $${countParams.length} OR LOWER(r.id) LIKE $${countParams.length} OR LOWER(f.name) LIKE $${countParams.length})`;
    }

    sql += ` ORDER BY r.submitted_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [rowsRes, countRes] = await Promise.all([
      db.query(sql, params),
      db.query(countSql, countParams),
    ]);

    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    res.json({
      success: true,
      responses: rowsRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getResponseDetails(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const respRes = await db.query(
      `SELECT r.*, f.name as form_name, f.title as form_title
       FROM form_responses r
       JOIN forms f ON f.id = r.form_id
       WHERE r.id = $1 LIMIT 1`,
      [id]
    );

    if (respRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Response not found.' });
      return;
    }

    const responseData = respRes.rows[0];

    // Get all form fields to maintain correct order and labels
    const fieldsRes = await db.query(
      `SELECT id, field_type, label, description, options, position, settings
       FROM form_fields
       WHERE form_id = $1
       ORDER BY position ASC`,
      [responseData.form_id]
    );

    // Get all answer values
    const valuesRes = await db.query(
      `SELECT field_id, value FROM form_response_values WHERE response_id = $1`,
      [id]
    );

    const valuesMap: Record<string, any> = {};
    valuesRes.rows.forEach(row => {
      valuesMap[row.field_id] = row.value;
    });

    // Merge answers into structured items
    const answers = fieldsRes.rows
      .filter(f => f.field_type !== 'section')
      .map(field => {
        return {
          fieldId: field.id,
          label: field.label,
          fieldType: field.field_type,
          options: field.options,
          position: field.position,
          value: valuesMap[field.id] ?? null,
        };
      });

    res.json({
      success: true,
      response: {
        id: responseData.id,
        formId: responseData.form_id,
        formName: responseData.form_name,
        formTitle: responseData.form_title,
        submittedAt: responseData.submitted_at,
        respondentEmail: responseData.respondent_email,
        metadata: responseData.metadata,
        answers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteResponse(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const check = await db.query('SELECT id FROM form_responses WHERE id = $1 LIMIT 1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Response not found.' });
      return;
    }

    await db.query('DELETE FROM form_responses WHERE id = $1', [id]);
    res.json({ success: true, message: 'Response deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteAllResponsesForForm(req: Request, res: Response): Promise<void> {
  const { formId } = req.params;

  try {
    const formCheck = await db.query('SELECT id, name FROM forms WHERE id = $1 LIMIT 1', [formId]);
    if (formCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    await db.query('DELETE FROM form_responses WHERE form_id = $1', [formId]);
    res.json({ success: true, message: `All responses for "${formCheck.rows[0].name}" have been deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function exportResponses(req: Request, res: Response): Promise<void> {
  const { formId } = req.params;
  const { format = 'csv' } = req.query;

  try {
    const formRes = await db.query('SELECT id, name, slug FROM forms WHERE id = $1 LIMIT 1', [formId]);
    if (formRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    const form = formRes.rows[0];

    // Fetch fields
    const fieldsRes = await db.query(
      'SELECT id, label, field_type FROM form_fields WHERE form_id = $1 ORDER BY position ASC',
      [formId]
    );

    const fields = fieldsRes.rows.map(f => ({
      id: f.id,
      label: f.label,
      fieldType: f.field_type,
    }));

    // Fetch all responses
    const responsesRes = await db.query(
      'SELECT id, submitted_at, respondent_email, metadata FROM form_responses WHERE form_id = $1 ORDER BY submitted_at DESC',
      [formId]
    );

    // Fetch all values
    const valuesRes = await db.query(
      `SELECT rv.response_id, rv.field_id, rv.value 
       FROM form_response_values rv
       JOIN form_responses r ON r.id = rv.response_id
       WHERE r.form_id = $1`,
      [formId]
    );

    const valuesByResponse: Record<string, Record<string, any>> = {};
    valuesRes.rows.forEach(r => {
      if (!valuesByResponse[r.response_id]) {
        valuesByResponse[r.response_id] = {};
      }
      valuesByResponse[r.response_id][r.field_id] = r.value;
    });

    const exportRows = responsesRes.rows.map(resp => ({
      responseId: resp.id,
      submittedAt: resp.submitted_at,
      respondentEmail: resp.respondent_email,
      answers: valuesByResponse[resp.id] || {},
      metadata: resp.metadata,
    }));

    const { headers, rows } = generateExportData(fields, exportRows);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filenameBase = `${form.slug}-responses-${timestamp}`;

    if (String(format).toLowerCase() === 'xlsx' || String(format).toLowerCase() === 'excel') {
      const buffer = generateExcelBuffer(headers, rows, form.name);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
      res.send(buffer);
    } else {
      const csv = generateCsv(headers, rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      res.send(csv);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
