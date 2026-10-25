import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { runMigrations } from '../db/migrations.js';
import { seedDatabase } from '../db/seed.js';

let authToken = '';
let testFormId = '';
let testSlug = '';
let fieldMap: Record<string, string> = {};

beforeAll(async () => {
  await runMigrations();
  await seedDatabase();
});

describe('Dynamic Form Builder Backend Tests', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.engine).toBeDefined();
  });

  describe('Authentication', () => {
    it('POST /api/auth/login should fail with invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should succeed with default credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'admin123456',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it('GET /api/auth/me should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@example.com');
    });

    it('GET /api/forms should be protected and reject without token', async () => {
      const res = await request(app).get('/api/forms');
      expect(res.status).toBe(401);
    });
  });

  describe('Form Management & Builder API', () => {
    it('POST /api/forms should create a new dynamic form with fields', async () => {
      const newFormData = {
        name: 'Automated Test Registration',
        title: 'Event Attendee Registration',
        description: 'Please register your details for the summit',
        status: 'published',
        slug: 'test-event-summit',
        settings: {
          successMessage: 'Thank you for registering!',
          allowMultipleSubmissions: true,
        },
        theme: {
          primaryColor: '#6366f1',
          layout: 'card',
        },
        fields: [
          {
            id: 'f-name',
            field_type: 'short_text',
            label: 'Attendee Name',
            required: true,
            validation: { minChars: 2 },
          },
          {
            id: 'f-email',
            field_type: 'email',
            label: 'Attendee Email',
            required: true,
          },
          {
            id: 'f-type',
            field_type: 'multiple_choice',
            label: 'Pass Type',
            required: true,
            options: [
              { id: 'opt-vip', label: 'VIP Pass', value: 'vip' },
              { id: 'opt-reg', label: 'Standard Pass', value: 'standard' },
            ],
          },
          {
            id: 'f-experience',
            field_type: 'rating',
            label: 'Interest Level',
            required: false,
            settings: { ratingMax: 5 },
          },
        ],
      };

      const res = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newFormData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.form.id).toBeDefined();
      expect(res.body.form.fields.length).toBe(4);

      testFormId = res.body.form.id;
      testSlug = res.body.form.slug;
      res.body.form.fields.forEach((f: any) => {
        fieldMap[f.label] = f.id;
      });
    });

    it('GET /api/forms/:id should retrieve the form with all fields', async () => {
      const res = await request(app)
        .get(`/api/forms/${testFormId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.form.id).toBe(testFormId);
      expect(res.body.form.fields.length).toBe(4);
    });

    it('POST /api/forms/:id/duplicate should duplicate the form', async () => {
      const res = await request(app)
        .post(`/api/forms/${testFormId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.formId).toBeDefined();
      expect(res.body.formId).not.toBe(testFormId);
    });
  });

  describe('Public Form Access & Submission', () => {
    it('GET /api/public/forms/:slug should return public form schema', async () => {
      const res = await request(app).get(`/api/public/forms/${testSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.form.slug).toBe(testSlug);
      expect(res.body.form.fields.length).toBe(4);
    });

    it('POST /api/public/submit should fail validation when required field is missing', async () => {
      const res = await request(app).post('/api/public/submit').send({
        formId: testFormId,
        answers: {
          [fieldMap['Attendee Email']]: 'attendee@example.com',
          // missing 'Attendee Name' and 'Pass Type'
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.validationErrors).toBeDefined();
      expect(res.body.validationErrors.length).toBeGreaterThan(0);
    });

    it('POST /api/public/submit should successfully submit valid response', async () => {
      const res = await request(app).post('/api/public/submit').send({
        formId: testFormId,
        answers: {
          [fieldMap['Attendee Name']]: 'Alice Johnson',
          [fieldMap['Attendee Email']]: 'alice@example.com',
          [fieldMap['Pass Type']]: 'vip',
          [fieldMap['Interest Level']]: 5,
        },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.responseId).toBeDefined();
    });
  });

  describe('Response Management & Analytics', () => {
    it('GET /api/responses should list submitted responses', async () => {
      const res = await request(app)
        .get(`/api/responses?formId=${testFormId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.responses.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/responses/export/:formId with format=csv should return CSV content', async () => {
      const res = await request(app)
        .get(`/api/responses/export/${testFormId}?format=csv`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('Attendee Name');
      expect(res.text).toContain('Alice Johnson');
    });

    it('GET /api/analytics/dashboard should return platform metrics', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.totalForms).toBeGreaterThan(0);
      expect(res.body.timeline).toBeDefined();
    });

    it('GET /api/analytics/form/:formId should return dynamic field charts', async () => {
      const res = await request(app)
        .get(`/api/analytics/form/${testFormId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.analytics.fields.length).toBeGreaterThan(0);
    });
  });
});
