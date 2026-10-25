import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { slugify } from '../utils/slugify.js';

export async function listForms(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT f.id, f.name, f.slug, f.title, f.description, f.status, f.settings, f.theme, f.created_at, f.updated_at,
             (SELECT COUNT(*) FROM form_responses r WHERE r.form_id = f.id) as response_count,
             (SELECT COUNT(*) FROM form_fields ff WHERE ff.form_id = f.id) as field_count
      FROM forms f
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND f.status = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(f.name) LIKE $${params.length} OR LOWER(f.title) LIKE $${params.length} OR LOWER(f.slug) LIKE $${params.length})`;
    }

    sql += ` ORDER BY f.updated_at DESC`;

    const result = await db.query(sql, params);
    res.json({ success: true, forms: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getFormById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const formResult = await db.query(
      `SELECT f.*, 
              (SELECT COUNT(*) FROM form_responses r WHERE r.form_id = f.id) as response_count
       FROM forms f 
       WHERE f.id = $1 LIMIT 1`,
      [id]
    );

    if (formResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    const form = formResult.rows[0];

    const fieldsResult = await db.query(
      `SELECT * FROM form_fields WHERE form_id = $1 ORDER BY position ASC`,
      [id]
    );

    res.json({
      success: true,
      form: {
        ...form,
        fields: fieldsResult.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPublicFormBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;

  try {
    const formResult = await db.query(
      `SELECT f.id, f.name, f.slug, f.title, f.description, f.status, f.settings, f.theme, f.created_at,
              (SELECT COUNT(*) FROM form_responses r WHERE r.form_id = f.id) as response_count
       FROM forms f 
       WHERE f.slug = $1 LIMIT 1`,
      [slug]
    );

    if (formResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found or has been removed.' });
      return;
    }

    const form = formResult.rows[0];

    // Check status
    if (form.status !== 'published') {
      res.status(403).json({
        success: false,
        error: 'This form is currently not published or is closed for submissions.',
        status: form.status,
      });
      return;
    }

    // Check availability dates & limits
    const settings = form.settings || {};
    const now = new Date();

    if (settings.startDate && new Date(settings.startDate) > now) {
      res.status(403).json({
        success: false,
        error: `This form will open for submissions on ${new Date(settings.startDate).toLocaleString()}.`,
      });
      return;
    }

    if (settings.endDate && new Date(settings.endDate) < now) {
      res.status(403).json({
        success: false,
        error: 'This form has closed and is no longer accepting responses.',
      });
      return;
    }

    if (settings.submissionLimit && Number(settings.submissionLimit) > 0) {
      const responseCount = parseInt(form.response_count || '0', 10);
      if (responseCount >= Number(settings.submissionLimit)) {
        res.status(403).json({
          success: false,
          error: 'This form has reached its maximum response capacity and is now closed.',
        });
        return;
      }
    }

    const fieldsResult = await db.query(
      `SELECT id, form_id, field_type, label, description, placeholder, required, options, validation, position, settings
       FROM form_fields 
       WHERE form_id = $1 
       ORDER BY position ASC`,
      [form.id]
    );

    res.json({
      success: true,
      form: {
        ...form,
        fields: fieldsResult.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createForm(req: Request, res: Response): Promise<void> {
  const { name, title, description, status, settings, theme, fields } = req.body;

  const formName = name?.trim() || 'Untitled Form';
  const formTitle = title?.trim() || formName;
  let customSlug = req.body.slug ? slugify(req.body.slug) : slugify(formName);

  if (!customSlug) {
    customSlug = `form-${Date.now().toString(36)}`;
  }

  try {
    // Ensure slug uniqueness
    const slugCheck = await db.query('SELECT id FROM forms WHERE slug = $1 LIMIT 1', [customSlug]);
    if (slugCheck.rows.length > 0) {
      customSlug = `${customSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const formId = uuidv4();
    const defaultSettings = {
      successMessage: 'Your response has been recorded successfully.',
      redirectUrl: '',
      allowMultipleSubmissions: true,
      requireLogin: false,
      enableCaptcha: false,
      submissionLimit: null,
      storeResponses: true,
      emailNotification: {
        adminNotify: false,
        adminEmail: '',
        userNotify: false,
      },
      ...settings,
    };

    const defaultTheme = {
      primaryColor: '#4f46e5',
      buttonColor: '#4f46e5',
      backgroundColor: '#f8fafc',
      font: 'Inter',
      borderRadius: 'rounded-xl',
      formWidth: 'max-w-3xl',
      layout: 'card',
      logoUrl: '',
      bannerUrl: '',
      ...theme,
    };

    await db.query(
      `INSERT INTO forms (id, name, slug, title, description, status, settings, theme)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        formId,
        formName,
        customSlug,
        formTitle,
        description || '',
        status || 'draft',
        defaultSettings,
        defaultTheme,
      ]
    );

    // If initial fields provided, insert them
    if (Array.isArray(fields) && fields.length > 0) {
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const fieldId = uuidv4();
        await db.query(
          `INSERT INTO form_fields (id, form_id, field_type, label, description, placeholder, required, options, validation, position, settings)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            fieldId,
            formId,
            f.field_type || 'short_text',
            f.label || `Question ${i + 1}`,
            f.description || '',
            f.placeholder || '',
            Boolean(f.required),
            f.options || [],
            f.validation || {},
            i,
            f.settings || {},
          ]
        );
      }
    } else {
      // Default question: Short Answer
      const q1Id = uuidv4();
      await db.query(
        `INSERT INTO form_fields (id, form_id, field_type, label, description, placeholder, required, options, validation, position, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          q1Id,
          formId,
          'short_text',
          'Untitled Question',
          '',
          '',
          false,
          [],
          {},
          0,
          {},
        ]
      );
    }

    const createdForm = await db.query('SELECT * FROM forms WHERE id = $1', [formId]);
    const createdFields = await db.query('SELECT * FROM form_fields WHERE form_id = $1 ORDER BY position ASC', [formId]);

    res.status(201).json({
      success: true,
      message: 'Form created successfully.',
      form: {
        ...createdForm.rows[0],
        fields: createdFields.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateForm(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, title, description, status, slug, settings, theme, fields } = req.body;

  try {
    const existing = await db.query('SELECT id, slug FROM forms WHERE id = $1 LIMIT 1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    // Slug check if changing
    let newSlug = existing.rows[0].slug;
    if (slug && slug !== existing.rows[0].slug) {
      newSlug = slugify(slug);
      const conflict = await db.query('SELECT id FROM forms WHERE slug = $1 AND id != $2 LIMIT 1', [newSlug, id]);
      if (conflict.rows.length > 0) {
        res.status(400).json({ success: false, error: 'The requested URL slug is already taken by another form.' });
        return;
      }
    }

    await db.query(
      `UPDATE forms 
       SET name = COALESCE($1, name),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           status = COALESCE($4, status),
           slug = COALESCE($5, slug),
           settings = COALESCE($6, settings),
           theme = COALESCE($7, theme),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [name, title, description, status, newSlug, settings, theme, id]
    );

    // Sync fields if provided
    if (Array.isArray(fields)) {
      // 1. Get current field IDs for this form
      const currentFieldsRes = await db.query('SELECT id FROM form_fields WHERE form_id = $1', [id]);
      const currentFieldIds = new Set(currentFieldsRes.rows.map(r => r.id));

      const incomingFieldIds = new Set(fields.map(f => f.id).filter(Boolean));

      // 2. Delete fields no longer present in incoming list
      for (const curId of currentFieldIds) {
        if (!incomingFieldIds.has(curId)) {
          await db.query('DELETE FROM form_fields WHERE id = $1', [curId]);
        }
      }

      // 3. Upsert incoming fields
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const fieldId = f.id || uuidv4();

        if (currentFieldIds.has(fieldId)) {
          // Update
          await db.query(
            `UPDATE form_fields
             SET field_type = $1,
                 label = $2,
                 description = $3,
                 placeholder = $4,
                 required = $5,
                 options = $6,
                 validation = $7,
                 position = $8,
                 settings = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 AND form_id = $11`,
            [
              f.field_type,
              f.label,
              f.description || '',
              f.placeholder || '',
              Boolean(f.required),
              f.options || [],
              f.validation || {},
              i,
              f.settings || {},
              fieldId,
              id,
            ]
          );
        } else {
          // Insert
          await db.query(
            `INSERT INTO form_fields (id, form_id, field_type, label, description, placeholder, required, options, validation, position, settings)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              fieldId,
              id,
              f.field_type,
              f.label,
              f.description || '',
              f.placeholder || '',
              Boolean(f.required),
              f.options || [],
              f.validation || {},
              i,
              f.settings || {},
            ]
          );
        }
      }
    }

    const updatedForm = await db.query('SELECT * FROM forms WHERE id = $1', [id]);
    const updatedFields = await db.query('SELECT * FROM form_fields WHERE form_id = $1 ORDER BY position ASC', [id]);

    res.json({
      success: true,
      message: 'Form saved successfully.',
      form: {
        ...updatedForm.rows[0],
        fields: updatedFields.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function duplicateForm(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const origRes = await db.query('SELECT * FROM forms WHERE id = $1 LIMIT 1', [id]);
    if (origRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Original form not found.' });
      return;
    }

    const orig = origRes.rows[0];
    const newFormId = uuidv4();
    const newName = `${orig.name} (Copy)`;
    let newSlug = `${orig.slug}-copy`;

    const slugCheck = await db.query('SELECT id FROM forms WHERE slug = $1 LIMIT 1', [newSlug]);
    if (slugCheck.rows.length > 0) {
      newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    await db.query(
      `INSERT INTO forms (id, name, slug, title, description, status, settings, theme)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        newFormId,
        newName,
        newSlug,
        orig.title,
        orig.description,
        'draft', // new copy starts as draft
        orig.settings,
        orig.theme,
      ]
    );

    // Duplicate all fields
    const fieldsRes = await db.query('SELECT * FROM form_fields WHERE form_id = $1 ORDER BY position ASC', [id]);
    for (const f of fieldsRes.rows) {
      await db.query(
        `INSERT INTO form_fields (id, form_id, field_type, label, description, placeholder, required, options, validation, position, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          uuidv4(),
          newFormId,
          f.field_type,
          f.label,
          f.description,
          f.placeholder,
          f.required,
          f.options,
          f.validation,
          f.position,
          f.settings,
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Form duplicated successfully.',
      formId: newFormId,
      slug: newSlug,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteForm(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT id, name FROM forms WHERE id = $1 LIMIT 1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    // ON DELETE CASCADE takes care of form_fields and form_responses
    await db.query('DELETE FROM forms WHERE id = $1', [id]);

    res.json({ success: true, message: `Form "${existing.rows[0].name}" deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function togglePublishForm(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const existing = await db.query('SELECT id, status FROM forms WHERE id = $1 LIMIT 1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    const currentStatus = existing.rows[0].status;
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';

    await db.query('UPDATE forms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nextStatus, id]);

    res.json({
      success: true,
      status: nextStatus,
      message: `Form is now ${nextStatus}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function checkSlugAvailability(req: Request, res: Response): Promise<void> {
  const { slug, formId } = req.query;
  if (!slug || typeof slug !== 'string') {
    res.status(400).json({ available: false, error: 'Slug parameter is required.' });
    return;
  }

  const clean = slugify(slug);
  try {
    let sql = 'SELECT id FROM forms WHERE slug = $1';
    const params = [clean];

    if (formId && typeof formId === 'string') {
      sql += ' AND id != $2';
      params.push(formId);
    }

    const resDb = await db.query(sql, params);
    res.json({
      available: resDb.rows.length === 0,
      slug: clean,
    });
  } catch (err: any) {
    res.status(500).json({ available: false, error: err.message });
  }
}
