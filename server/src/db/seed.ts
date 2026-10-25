import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/index.js';

export async function seedDatabase(): Promise<void> {
  console.log('🌱 Checking seed data...');

  // 1. Seed Admin User
  const existingAdmin = await db.query(
    'SELECT id FROM admin_users WHERE email = $1 LIMIT 1',
    [config.adminDefault.email]
  );

  let adminId = existingAdmin.rows[0]?.id;
  if (!adminId) {
    adminId = uuidv4();
    const hash = await bcrypt.hash(config.adminDefault.password, 10);
    await db.query(
      `INSERT INTO admin_users (id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, config.adminDefault.email, hash, config.adminDefault.name, 'admin']
    );
    console.log(`✅ Default admin created: ${config.adminDefault.email} / ${config.adminDefault.password}`);
  }

  // 2. Seed System Settings
  const existingSettings = await db.query(
    'SELECT key FROM system_settings WHERE key = $1 LIMIT 1',
    ['general']
  );
  if (existingSettings.rows.length === 0) {
    await db.query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2)`,
      [
        'general',
        {
          siteName: 'FormCraft Pro',
          adminEmail: config.adminDefault.email,
          logoUrl: '',
          defaultTheme: {
            primaryColor: '#4f46e5',
            buttonColor: '#4f46e5',
            backgroundColor: '#f8fafc',
            font: 'Inter',
            borderRadius: 'rounded-xl',
            formWidth: 'max-w-3xl',
            layout: 'single',
          },
          security: {
            rateLimitEnabled: true,
            maxSubmissionsPerMinute: 10,
            enableSpamHoneypot: true,
            enableCaptcha: false,
          },
          email: {
            sendAdminNotifications: true,
            sendUserConfirmations: false,
          }
        }
      ]
    );
  }

  // 3. Seed Sample Forms if forms table is empty
  const formsCount = await db.query('SELECT COUNT(*) as count FROM forms');
  const count = parseInt(formsCount.rows[0]?.count || '0', 10);

  if (count === 0) {
    console.log('📝 Seeding dynamic demo forms and initial response dataset...');

    // Demo Form 1: Job Application
    const jobFormId = uuidv4();
    await db.query(
      `INSERT INTO forms (id, name, slug, title, description, status, settings, theme)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        jobFormId,
        'Job Application Form',
        'job-application',
        'Senior Software Engineer Application',
        'Thank you for your interest in joining our engineering team. Please complete the application below with your accurate details.',
        'published',
        {
          successMessage: 'Thank you for applying! Our talent acquisition team will review your application and respond within 3-5 business days.',
          redirectUrl: '',
          allowMultipleSubmissions: true,
          requireLogin: false,
          enableCaptcha: false,
          submissionLimit: 100,
          storeResponses: true,
          emailNotification: {
            adminNotify: true,
            adminEmail: config.adminDefault.email,
            userNotify: true,
            userSubject: 'Application Received - Engineering Role',
            userMessage: 'Hi {{respondent_name}},\n\nWe received your application submitted on {{submission_date}}. Our team is reviewing your profile.\n\nBest regards,\nHiring Team'
          }
        },
        {
          primaryColor: '#4f46e5',
          buttonColor: '#4f46e5',
          backgroundColor: '#f8fafc',
          font: 'Inter',
          borderRadius: 'rounded-2xl',
          formWidth: 'max-w-3xl',
          layout: 'card',
          logoUrl: '',
          bannerUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
        }
      ]
    );

    // Dynamic Fields for Job Application
    const f1Id = uuidv4();
    const f2Id = uuidv4();
    const f3Id = uuidv4();
    const f4Id = uuidv4();
    const f5Id = uuidv4();
    const f6Id = uuidv4();
    const f7Id = uuidv4();
    const f8Id = uuidv4();
    const f9Id = uuidv4();
    const f10Id = uuidv4();
    const f11Id = uuidv4();

    const fields = [
      { id: f1Id, form_id: jobFormId, type: 'short_text', label: 'Full Legal Name', desc: 'First and last name as shown on legal ID', ph: 'Jane Doe', req: true, pos: 0, opts: [], val: { minChars: 2, maxChars: 100 }, set: {} },
      { id: f2Id, form_id: jobFormId, type: 'email', label: 'Email Address', desc: 'We will use this address for interview scheduling', ph: 'jane@example.com', req: true, pos: 1, opts: [], val: {}, set: {} },
      { id: f3Id, form_id: jobFormId, type: 'phone', label: 'Contact Phone Number', desc: 'Include country code if applicable', ph: '+1 (555) 000-0000', req: true, pos: 2, opts: [], val: {}, set: {} },
      { id: f4Id, form_id: jobFormId, type: 'url', label: 'LinkedIn / GitHub / Portfolio Link', desc: 'Direct URL to your public profile', ph: 'https://linkedin.com/in/username', req: false, pos: 3, opts: [], val: {}, set: {} },
      {
        id: f5Id, form_id: jobFormId, type: 'dropdown', label: 'Specialization / Role Applying For', desc: 'Select the primary position you are interested in', ph: 'Choose a role...', req: true, pos: 4,
        opts: [
          { id: 'role-1', label: 'Frontend Engineer (React/TypeScript)', value: 'frontend' },
          { id: 'role-2', label: 'Backend Engineer (Node/PostgreSQL)', value: 'backend' },
          { id: 'role-3', label: 'Full Stack Cloud Architect', value: 'fullstack' },
          { id: 'role-4', label: 'DevOps / Platform Engineer', value: 'devops' }
        ],
        val: {}, set: {}
      },
      {
        id: f6Id, form_id: jobFormId, type: 'checkbox', label: 'Core Technical Competencies', desc: 'Check all technologies you have working experience with', ph: '', req: true, pos: 5,
        opts: [
          { id: 'tech-1', label: 'React / Next.js', value: 'react' },
          { id: 'tech-2', label: 'Node.js / Express', value: 'nodejs' },
          { id: 'tech-3', label: 'TypeScript', value: 'typescript' },
          { id: 'tech-4', label: 'PostgreSQL / SQL', value: 'postgres' },
          { id: 'tech-5', label: 'Docker / Kubernetes', value: 'docker' },
          { id: 'tech-6', label: 'GraphQL / REST APIs', value: 'apis' }
        ],
        val: {}, set: {}
      },
      {
        id: f7Id, form_id: jobFormId, type: 'multiple_choice', label: 'Current Employment Status', desc: 'Help us understand your availability', ph: '', req: true, pos: 6,
        opts: [
          { id: 'emp-1', label: 'Available Immediately (Ready to join)', value: 'immediate' },
          { id: 'emp-2', label: 'Employed (Serving 30-day notice)', value: 'serving_notice' },
          { id: 'emp-3', label: 'Employed (Looking for new opportunities)', value: 'employed' },
          { id: 'emp-4', label: 'Freelancer / Contractor', value: 'freelancer' }
        ],
        val: {}, set: {}
      },
      { id: f8Id, form_id: jobFormId, type: 'linear_scale', label: 'Years of Full-Time Experience', desc: 'Rate your total professional software development tenure', ph: '', req: true, pos: 7, opts: [], val: {}, set: { scaleMin: 1, scaleMax: 10, scaleMinLabel: '1 Year', scaleMaxLabel: '10+ Years' } },
      { id: f9Id, form_id: jobFormId, type: 'yes_no', label: 'Are you authorized to work in the country of this role?', desc: 'Sponsorship requirements may vary', ph: '', req: true, pos: 8, opts: [], val: {}, set: {} },
      { id: f10Id, form_id: jobFormId, type: 'number', label: 'Expected Annual Compensation (USD $)', desc: 'Enter numeric base salary expectation', ph: '120000', req: false, pos: 9, opts: [], val: { minValue: 30000, maxValue: 500000 }, set: {} },
      { id: f11Id, form_id: jobFormId, type: 'long_text', label: 'Personal Summary & Project Highlights', desc: 'Share an impactful technical achievement or project you led', ph: 'Describe your role, challenge faced, and outcome achieved...', req: true, pos: 10, opts: [], val: { minChars: 10, maxChars: 2000 }, set: {} },
    ];

    for (const f of fields) {
      await db.query(
        `INSERT INTO form_fields (id, form_id, field_type, label, description, placeholder, required, options, validation, position, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [f.id, f.form_id, f.type, f.label, f.desc, f.ph, f.req, f.opts, f.val, f.pos, f.set]
      );
    }

    // Seed 4 sample responses for Job Application
    const sampleSubmissions = [
      {
        email: 'alex.miller@example.com',
        answers: {
          [f1Id]: 'Alex Miller',
          [f2Id]: 'alex.miller@example.com',
          [f3Id]: '+1 (415) 890-1234',
          [f4Id]: 'https://github.com/alexmiller',
          [f5Id]: 'fullstack',
          [f6Id]: ['react', 'nodejs', 'typescript', 'postgres'],
          [f7Id]: 'immediate',
          [f8Id]: 6,
          [f9Id]: true,
          [f10Id]: 135000,
          [f11Id]: 'Led architecture of a high-throughput microservices pipeline handling 50M events daily, reducing database load by 40% using Redis caching and optimized PostgreSQL indexing.'
        }
      },
      {
        email: 'priya.sharma@example.com',
        answers: {
          [f1Id]: 'Priya Sharma',
          [f2Id]: 'priya.sharma@example.com',
          [f3Id]: '+1 (650) 432-8765',
          [f4Id]: 'https://linkedin.com/in/priyasharma-dev',
          [f5Id]: 'frontend',
          [f6Id]: ['react', 'typescript'],
          [f7Id]: 'serving_notice',
          [f8Id]: 4,
          [f9Id]: true,
          [f10Id]: 115000,
          [f11Id]: 'Designed and implemented accessible design systems with 100% WCAG AA compliance used across 4 enterprise applications.'
        }
      },
      {
        email: 'david.chen@example.com',
        answers: {
          [f1Id]: 'David Chen',
          [f2Id]: 'david.chen@example.com',
          [f3Id]: '+1 (206) 777-9012',
          [f4Id]: 'https://github.com/dchen-systems',
          [f5Id]: 'backend',
          [f6Id]: ['nodejs', 'postgres', 'docker', 'apis'],
          [f7Id]: 'employed',
          [f8Id]: 8,
          [f9Id]: true,
          [f10Id]: 155000,
          [f11Id]: 'Migrated legacy monolith to containerized Kubernetes deployment, automated CI/CD reducing release cycle from 2 weeks to 15 minutes.'
        }
      },
      {
        email: 'sara.novak@example.com',
        answers: {
          [f1Id]: 'Sara Novak',
          [f2Id]: 'sara.novak@example.com',
          [f3Id]: '+1 (512) 345-6789',
          [f4Id]: 'https://github.com/saranovak',
          [f5Id]: 'devops',
          [f6Id]: ['docker', 'postgres'],
          [f7Id]: 'freelancer',
          [f8Id]: 5,
          [f9Id]: true,
          [f10Id]: 128000,
          [f11Id]: 'Specialized in automated cloud infrastructure management with Terraform and real-time observability telemetry.'
        }
      }
    ];

    for (const sub of sampleSubmissions) {
      const respId = uuidv4();
      await db.query(
        `INSERT INTO form_responses (id, form_id, submitted_at, respondent_email, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          respId,
          jobFormId,
          new Date(Date.now() - Math.floor(Math.random() * 86400000 * 5)),
          sub.email,
          { ip: '192.168.1.10' + Math.floor(Math.random() * 90), userAgent: 'Mozilla/5.0 Chrome/120.0' }
        ]
      );

      for (const [fieldId, val] of Object.entries(sub.answers)) {
        await db.query(
          `INSERT INTO form_response_values (id, response_id, field_id, value)
           VALUES ($1, $2, $3, $4)`,
          [uuidv4(), respId, fieldId, val]
        );
      }
    }

    // Demo Form 2: Customer Satisfaction & Rating
    const feedbackFormId = uuidv4();
    await db.query(
      `INSERT INTO forms (id, name, slug, title, description, status, settings, theme)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        feedbackFormId,
        'Customer Satisfaction Survey',
        'customer-feedback',
        'We Value Your Experience',
        'Please take 2 minutes to let us know how we did and how we can improve our service.',
        'published',
        {
          successMessage: 'Thank you for your valuable feedback! Your insights help us continually enhance our product.',
          redirectUrl: '',
          allowMultipleSubmissions: true,
          requireLogin: false,
          enableCaptcha: false,
          submissionLimit: 500,
          storeResponses: true,
          emailNotification: { adminNotify: true, adminEmail: config.adminDefault.email, userNotify: false }
        },
        {
          primaryColor: '#059669',
          buttonColor: '#059669',
          backgroundColor: '#f0fdf4',
          font: 'Inter',
          borderRadius: 'rounded-xl',
          formWidth: 'max-w-2xl',
          layout: 'card',
          bannerUrl: 'https://images.unsplash.com/photo-1556742049-0a67e557224d?auto=format&fit=crop&w=1200&q=80'
        }
      ]
    );

    const r1Id = uuidv4();
    const r2Id = uuidv4();
    const r3Id = uuidv4();
    const r4Id = uuidv4();
    const r5Id = uuidv4();

    const feedbackFields = [
      { id: r1Id, form_id: feedbackFormId, type: 'rating', label: 'Overall Experience Rating', desc: 'How satisfied are you with our solution?', ph: '', req: true, pos: 0, opts: [], val: {}, set: { ratingMax: 5 } },
      { id: r2Id, form_id: feedbackFormId, type: 'linear_scale', label: 'Ease of Use & Intuitiveness', desc: 'From 1 (Very Difficult) to 10 (Extremely Intuitive)', ph: '', req: true, pos: 1, opts: [], val: {}, set: { scaleMin: 1, scaleMax: 10, scaleMinLabel: 'Very Difficult', scaleMaxLabel: 'Extremely Intuitive' } },
      {
        id: r3Id, form_id: feedbackFormId, type: 'multiple_choice', label: 'Primary Feature You Use Most', desc: 'Select the module that delivers the most value to you', ph: '', req: true, pos: 2,
        opts: [
          { id: 'f-1', label: 'Dynamic Form Creation Canvas', value: 'builder' },
          { id: 'f-2', label: 'Real-Time Analytics & Reporting', value: 'analytics' },
          { id: 'f-3', label: 'Export to CSV / Excel', value: 'exports' },
          { id: 'f-4', label: 'File Upload & Response Management', value: 'storage' }
        ],
        val: {}, set: {}
      },
      { id: r4Id, form_id: feedbackFormId, type: 'yes_no', label: 'Would you recommend our tool to colleagues or partners?', desc: 'Net promoter indicator', ph: '', req: true, pos: 3, opts: [], val: {}, set: {} },
      { id: r5Id, form_id: feedbackFormId, type: 'long_text', label: 'Suggestions for New Features or Enhancements', desc: 'Any thoughts or feedback for our engineering roadmap?', ph: 'I would love to see...', req: false, pos: 4, opts: [], val: {}, set: {} },
    ];

    for (const f of feedbackFields) {
      await db.query(
        `INSERT INTO form_fields (id, form_id, field_type, label, description, placeholder, required, options, validation, position, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [f.id, f.form_id, f.type, f.label, f.desc, f.ph, f.req, f.opts, f.val, f.pos, f.set]
      );
    }

    // Seed 5 feedback responses
    const ratingSubmissions = [
      { r1: 5, r2: 9, r3: 'builder', r4: true, r5: 'The Google Forms feel with customizable branding is incredible!' },
      { r1: 4, r2: 8, r3: 'analytics', r4: true, r5: 'Very smooth UI and quick charts.' },
      { r1: 5, r2: 10, r3: 'builder', r4: true, r5: 'Loved the drag-and-drop experience and easy embedding.' },
      { r1: 4, r2: 7, r3: 'exports', r4: true, r5: 'Great Excel exports with dynamic field headers.' },
      { r1: 5, r2: 9, r3: 'storage', r4: true, r5: 'File upload validation worked flawlessly.' }
    ];

    for (const sub of ratingSubmissions) {
      const respId = uuidv4();
      await db.query(
        `INSERT INTO form_responses (id, form_id, submitted_at, respondent_email, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [respId, feedbackFormId, new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)), '', { ip: '127.0.0.1' }]
      );
      await db.query(`INSERT INTO form_response_values (id, response_id, field_id, value) VALUES ($1, $2, $3, $4)`, [uuidv4(), respId, r1Id, sub.r1]);
      await db.query(`INSERT INTO form_response_values (id, response_id, field_id, value) VALUES ($1, $2, $3, $4)`, [uuidv4(), respId, r2Id, sub.r2]);
      await db.query(`INSERT INTO form_response_values (id, response_id, field_id, value) VALUES ($1, $2, $3, $4)`, [uuidv4(), respId, r3Id, sub.r3]);
      await db.query(`INSERT INTO form_response_values (id, response_id, field_id, value) VALUES ($1, $2, $3, $4)`, [uuidv4(), respId, r4Id, sub.r4]);
      await db.query(`INSERT INTO form_response_values (id, response_id, field_id, value) VALUES ($1, $2, $3, $4)`, [uuidv4(), respId, r5Id, sub.r5]);
    }

    console.log('✅ Demo forms and initial response dataset seeded successfully.');
  }
}
