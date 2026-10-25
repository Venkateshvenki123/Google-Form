import { Request, Response } from 'express';
import { db } from '../config/database.js';

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    // 1. Total forms, published, draft
    const formsStatsRes = await db.query(`
      SELECT 
        COUNT(*) as total_forms,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_forms,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_forms
      FROM forms
    `);

    // 2. Response counts (total, today, this week, this month)
    let responsesStatsRes;
    if (db.isPostgres()) {
      responsesStatsRes = await db.query(`
        SELECT 
          COUNT(*) as total_responses,
          SUM(CASE WHEN submitted_at >= CURRENT_DATE THEN 1 ELSE 0 END) as responses_today,
          SUM(CASE WHEN submitted_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as responses_this_week,
          SUM(CASE WHEN submitted_at >= date_trunc('month', CURRENT_DATE) THEN 1 ELSE 0 END) as responses_this_month
        FROM form_responses
      `);
    } else {
      responsesStatsRes = await db.query(`
        SELECT 
          COUNT(*) as total_responses,
          SUM(CASE WHEN submitted_at >= datetime('now', 'start of day') THEN 1 ELSE 0 END) as responses_today,
          SUM(CASE WHEN submitted_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as responses_this_week,
          SUM(CASE WHEN submitted_at >= datetime('now', 'start of month') THEN 1 ELSE 0 END) as responses_this_month
        FROM form_responses
      `);
    }

    // 3. Recent Forms (5)
    const recentFormsRes = await db.query(`
      SELECT f.id, f.name, f.slug, f.status, f.created_at, f.updated_at,
             (SELECT COUNT(*) FROM form_responses r WHERE r.form_id = f.id) as response_count
      FROM forms f
      ORDER BY f.updated_at DESC
      LIMIT 5
    `);

    // 4. Recent Responses (5)
    const recentResponsesRes = await db.query(`
      SELECT r.id, r.form_id, r.submitted_at, r.respondent_email, f.name as form_name, f.title as form_title
      FROM form_responses r
      JOIN forms f ON f.id = r.form_id
      ORDER BY r.submitted_at DESC
      LIMIT 5
    `);

    // 5. Activity Timeline for the last 14 days
    const allResponses = await db.query('SELECT submitted_at FROM form_responses ORDER BY submitted_at ASC');
    const dayMap: Record<string, number> = {};

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }

    allResponses.rows.forEach(r => {
      if (r.submitted_at) {
        const key = new Date(r.submitted_at).toISOString().slice(0, 10);
        if (dayMap[key] !== undefined) {
          dayMap[key]++;
        }
      }
    });

    const timelineData = Object.entries(dayMap).map(([date, count]) => ({
      date,
      displayDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      submissions: count,
    }));

    const formRow = formsStatsRes.rows[0] || {};
    const respRow = responsesStatsRes.rows[0] || {};

    res.json({
      success: true,
      stats: {
        totalForms: parseInt(formRow.total_forms || '0', 10),
        publishedForms: parseInt(formRow.published_forms || '0', 10),
        draftForms: parseInt(formRow.draft_forms || '0', 10),
        totalResponses: parseInt(respRow.total_responses || '0', 10),
        responsesToday: parseInt(respRow.responses_today || '0', 10),
        responsesThisWeek: parseInt(respRow.responses_this_week || '0', 10),
        responsesThisMonth: parseInt(respRow.responses_this_month || '0', 10),
      },
      recentForms: recentFormsRes.rows,
      recentResponses: recentResponsesRes.rows,
      timeline: timelineData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getFormAnalytics(req: Request, res: Response): Promise<void> {
  const { formId } = req.params;

  try {
    const formRes = await db.query('SELECT * FROM forms WHERE id = $1 LIMIT 1', [formId]);
    if (formRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Form not found.' });
      return;
    }

    const form = formRes.rows[0];

    // Fetch fields
    const fieldsRes = await db.query(
      'SELECT id, field_type, label, options, settings, position FROM form_fields WHERE form_id = $1 ORDER BY position ASC',
      [formId]
    );

    // Fetch all response records
    const responsesRes = await db.query(
      'SELECT id, submitted_at, respondent_email FROM form_responses WHERE form_id = $1 ORDER BY submitted_at ASC',
      [formId]
    );

    const totalResponses = responsesRes.rows.length;

    // Timeline calculation
    const dayMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = now.getTime() - 7 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    responsesRes.rows.forEach(r => {
      const time = new Date(r.submitted_at).getTime();
      const dateKey = new Date(r.submitted_at).toISOString().slice(0, 10);
      if (dayMap[dateKey] !== undefined) dayMap[dateKey]++;
      if (time >= startOfDay) todayCount++;
      if (time >= startOfWeek) thisWeekCount++;
      if (time >= startOfMonth) thisMonthCount++;
    });

    const timeline = Object.entries(dayMap).map(([date, count]) => ({
      date,
      displayDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      submissions: count,
    }));

    // Fetch values for field analytics
    const valuesRes = await db.query(
      `SELECT rv.field_id, rv.value 
       FROM form_response_values rv
       JOIN form_responses r ON r.id = rv.response_id
       WHERE r.form_id = $1`,
      [formId]
    );

    // Group values by field
    const valuesByField: Record<string, any[]> = {};
    valuesRes.rows.forEach(r => {
      if (!valuesByField[r.field_id]) {
        valuesByField[r.field_id] = [];
      }
      valuesByField[r.field_id].push(r.value);
    });

    // Compute dynamic analytics per field
    const fieldAnalytics: any[] = [];

    for (const field of fieldsRes.rows) {
      if (field.field_type === 'section') continue;

      const rawValues = valuesByField[field.id] || [];
      const answeredCount = rawValues.filter(v => v !== null && v !== undefined && v !== '').length;

      const baseInfo = {
        fieldId: field.id,
        label: field.label,
        fieldType: field.field_type,
        totalAnswers: answeredCount,
        responseRate: totalResponses > 0 ? Math.round((answeredCount / totalResponses) * 100) : 0,
      };

      if (['multiple_choice', 'dropdown', 'yes_no'].includes(field.field_type)) {
        // Choice Distribution
        const counts: Record<string, number> = {};
        const optionsList = field.options || [];

        // Seed with 0 for all declared options
        if (field.field_type === 'yes_no') {
          counts['Yes'] = 0;
          counts['No'] = 0;
        } else {
          optionsList.forEach((opt: any) => {
            counts[opt.label || opt.value] = 0;
          });
        }

        rawValues.forEach(val => {
          if (field.field_type === 'yes_no') {
            const key = val === true || val === 'true' || val === 1 ? 'Yes' : 'No';
            counts[key] = (counts[key] || 0) + 1;
          } else {
            const optMatch = optionsList.find((o: any) => o.value === val || o.label === val);
            const label = optMatch ? optMatch.label : String(val);
            counts[label] = (counts[label] || 0) + 1;
          }
        });

        const chartData = Object.entries(counts).map(([name, count]) => ({
          name,
          count,
          percentage: answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0,
        }));

        fieldAnalytics.push({
          ...baseInfo,
          chartType: 'pie',
          data: chartData,
        });

      } else if (field.field_type === 'checkbox') {
        // Checkboxes (multi-select distribution)
        const counts: Record<string, number> = {};
        const optionsList = field.options || [];
        optionsList.forEach((opt: any) => {
          counts[opt.label || opt.value] = 0;
        });

        rawValues.forEach(val => {
          const arr = Array.isArray(val) ? val : [val];
          arr.forEach(item => {
            const optMatch = optionsList.find((o: any) => o.value === item || o.label === item);
            const label = optMatch ? optMatch.label : String(item);
            counts[label] = (counts[label] || 0) + 1;
          });
        });

        const chartData = Object.entries(counts).map(([name, count]) => ({
          name,
          count,
          percentage: answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0,
        }));

        fieldAnalytics.push({
          ...baseInfo,
          chartType: 'bar',
          data: chartData,
        });

      } else if (field.field_type === 'rating' || field.field_type === 'linear_scale') {
        // Rating & Scale stats (counts, average)
        const minVal = field.settings?.scaleMin || 1;
        const maxVal = field.settings?.scaleMax || (field.field_type === 'rating' ? (field.settings?.ratingMax || 5) : 5);
        const distribution: Record<number, number> = {};

        for (let s = minVal; s <= maxVal; s++) {
          distribution[s] = 0;
        }

        let totalScore = 0;
        let scoreCount = 0;

        rawValues.forEach(val => {
          const num = Number(val);
          if (!isNaN(num) && num >= minVal && num <= maxVal) {
            distribution[num] = (distribution[num] || 0) + 1;
            totalScore += num;
            scoreCount++;
          }
        });

        const averageScore = scoreCount > 0 ? Number((totalScore / scoreCount).toFixed(1)) : 0;
        const chartData = Object.entries(distribution).map(([score, count]) => ({
          score: `${score}`,
          count,
        }));

        fieldAnalytics.push({
          ...baseInfo,
          chartType: 'rating_scale',
          average: averageScore,
          min: minVal,
          max: maxVal,
          data: chartData,
        });

      } else if (['short_text', 'long_text', 'email', 'phone', 'url'].includes(field.field_type)) {
        // Text summary: latest responses preview
        fieldAnalytics.push({
          ...baseInfo,
          chartType: 'text_feed',
          recentAnswers: rawValues.slice(-10).reverse().filter(Boolean),
        });
      }
    }

    res.json({
      success: true,
      analytics: {
        formId: form.id,
        formName: form.name,
        formTitle: form.title,
        totalResponses,
        responsesToday: todayCount,
        responsesThisWeek: thisWeekCount,
        responsesThisMonth: thisMonthCount,
        timeline,
        fields: fieldAnalytics,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
