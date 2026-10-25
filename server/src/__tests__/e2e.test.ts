import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { runMigrations } from '../db/migrations.js';
import { seedDatabase } from '../db/seed.js';

let token = '';
let formId = '';
let formSlug = '';
let nameFieldId = '';
let emailFieldId = '';
let roleFieldId = '';
let ratingFieldId = '';
let responseId = '';

beforeAll(async () => {
  await runMigrations();
  await seedDatabase();
});

describe('Full End-to-End Dynamic Lifecycle Test', () => {
  it('Step 1: Admin logs in securely', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'admin123456',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('Step 2: Admin creates dynamic custom form', async () => {
    const res = await request(app)
      .post('/api/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Enterprise Beta Pilot Registration',
        title: 'Join Our Enterprise Beta',
        description: 'Sign up for priority access to our cloud platform',
        status: 'draft',
        settings: {
          successMessage: 'Welcome to the beta program!',
          allowMultipleSubmissions: false,
          submissionLimit: 50,
        },
        theme: {
          primaryColor: '#059669',
          borderRadius: 'rounded-2xl',
        },
        fields: [
          {
            field_type: 'short_text',
            label: 'Organization Lead Name',
            required: true,
            validation: { minChars: 3 },
          },
          {
            field_type: 'email',
            label: 'Work Email',
            required: true,
          },
          {
            field_type: 'multiple_choice',
            label: 'Company Size',
            required: true,
            options: [
              { id: '1', label: '1 - 10 employees', value: 'small' },
              { id: '2', label: '11 - 50 employees', value: 'medium' },
              { id: '3', label: '50+ employees', value: 'enterprise' },
            ],
          },
          {
            field_type: 'rating',
            label: 'Urgency / Timeline',
            required: true,
            settings: { ratingMax: 5 },
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.form.id).toBeDefined();
    formId = res.body.form.id;
    formSlug = res.body.form.slug;

    const fields = res.body.form.fields;
    nameFieldId = fields.find((f: any) => f.label === 'Organization Lead Name').id;
    emailFieldId = fields.find((f: any) => f.label === 'Work Email').id;
    roleFieldId = fields.find((f: any) => f.label === 'Company Size').id;
    ratingFieldId = fields.find((f: any) => f.label === 'Urgency / Timeline').id;
  });

  it('Step 3: Public cannot submit while form is draft', async () => {
    const res = await request(app).get(`/api/public/forms/${formSlug}`);
    expect(res.status).toBe(403);
  });

  it('Step 4: Admin publishes form', async () => {
    const res = await request(app)
      .patch(`/api/forms/${formId}/toggle-publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
  });

  it('Step 5: Public respondent loads form schema', async () => {
    const res = await request(app).get(`/api/public/forms/${formSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.form.title).toBe('Join Our Enterprise Beta');
    expect(res.body.form.fields.length).toBe(4);
  });

  it('Step 6: Public respondent submits valid answers', async () => {
    const res = await request(app).post('/api/public/submit').send({
      formId,
      answers: {
        [nameFieldId]: 'Samantha Vance',
        [emailFieldId]: 'samantha@globaltech.corp',
        [roleFieldId]: 'enterprise',
        [ratingFieldId]: 5,
      },
      metadata: { browser: 'Chrome 122' },
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.responseId).toBeDefined();
    responseId = res.body.responseId;
  });

  it('Step 7: Admin views submitted response in table', async () => {
    const res = await request(app)
      .get(`/api/responses?formId=${formId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.responses.length).toBe(1);
    expect(res.body.responses[0].respondent_email).toBe('samantha@globaltech.corp');
  });

  it('Step 8: Admin views dynamic response details', async () => {
    const res = await request(app)
      .get(`/api/responses/${responseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.response.id).toBe(responseId);
    expect(res.body.response.answers.length).toBe(4);

    const nameAnswer = res.body.response.answers.find((a: any) => a.fieldId === nameFieldId);
    expect(nameAnswer.value).toBe('Samantha Vance');
  });

  it('Step 9: Admin exports responses to CSV and Excel', async () => {
    // CSV export
    const csvRes = await request(app)
      .get(`/api/responses/export/${formId}?format=csv`)
      .set('Authorization', `Bearer ${token}`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.text).toContain('Organization Lead Name');
    expect(csvRes.text).toContain('Samantha Vance');
    expect(csvRes.text).toContain('enterprise');

    // Excel export
    const xlsxRes = await request(app)
      .get(`/api/responses/export/${formId}?format=xlsx`)
      .set('Authorization', `Bearer ${token}`);
    expect(xlsxRes.status).toBe(200);
    expect(xlsxRes.header['content-type']).toContain('spreadsheet');
  });

  it('Step 10: Admin checks dynamic field analytics', async () => {
    const res = await request(app)
      .get(`/api/analytics/form/${formId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.analytics.totalResponses).toBe(1);
    expect(res.body.analytics.fields.length).toBeGreaterThan(0);
  });

  it('Step 11: Admin deletes response cleanly', async () => {
    const res = await request(app)
      .delete(`/api/responses/${responseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
