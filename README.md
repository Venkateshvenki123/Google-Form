# FormCraft Pro - Dynamic Google Forms-Style Builder & Admin Platform

FormCraft Pro is an enterprise-grade, production-ready dynamic form builder website and administration suite. It allows administrators to create, customize, publish, manage, embed, and analyze unlimited forms and collect unlimited responses **without modifying code or altering database schemas**.

---

## 🌟 Key Features

### 1. Dynamic Form Builder Canvas
- **Google Forms-style 3-Column Studio Layout**:
  - **Left**: Drag-and-drop / click Question Types palette categorized into Basic, Choice, Date/Time, and Advanced.
  - **Center**: Live interactive Canvas with inline editing of Title, Description, Questions, and Options. Includes reordering (up/down handles), duplicate, delete, and required indicators.
  - **Right**: Question Configuration Inspector for fine-tuning validation rules, choices, placeholders, rating stars, and scales.
- **17 Supported Field Types**:
  - **Basic**: Short Answer, Paragraph / Long Answer, Email, Phone Number, Number, Website / URL.
  - **Choice**: Multiple Choice (Radio), Checkboxes (Multi-Select), Dropdown, Yes/No toggle.
  - **Date & Time**: Date picker, Time picker, Combined Date & Time.
  - **Files**: Secure File Upload (configurable size limits, allowed extensions e.g. PDF, DOCX, PNG).
  - **Advanced**: Star Rating (interactive 1–5 stars), Linear Scale (with low/high descriptive labels), Section Header / Divider, and Hidden Fields.

### 2. Form Design & Branding Customization
- Custom accent colors and button colors with interactive palette presets.
- Typography font switching (Inter, Plus Jakarta Sans, Roboto, System UI).
- Corner radius styles (square, standard, modern soft).
- Layout styles (Card style, Single flat, Minimalist) and container widths (Compact, Standard, Wide).
- Header banner images and logo branding support.

### 3. Submission Management & Dynamic Responses
- **Dynamic Field Storage**: Uses a flexible, normalized EAV relational architecture (`forms`, `form_fields`, `form_responses`, `form_response_values`). No database table changes needed for new forms or fields.
- **Dynamic Response Inspector**: Modal displays submitted answers mapped cleanly to the form's actual fields with file download links, rating stars, and pills.
- **Response Exporting**: One-click dynamic export to **CSV** and **Excel (.xlsx)** with auto-generated columns matching form fields.
- Filter responses by specific form, search by email or submission ID, date range filters, and paginated records.
- Individual response deletion and bulk clear for specific forms.

### 4. Interactive Analytics & Telemetry
- Dashboard aggregate metrics: Total Forms, Published, Drafts, Total Responses, Today, This Week, and This Month.
- 14-day interactive submission timeline chart.
- Dynamic per-field charts adapting to field types:
  - **Pie / Donut charts** for Single Choice & Dropdowns.
  - **Bar charts** for Checkbox multi-select frequencies.
  - **Score distribution bars & star averages** for Ratings and Linear Scales.
  - **Recent text feed** for open-ended feedback.

### 5. Form Availability, Security & Embeds
- **Availability Control**: Set start dates, end dates, and maximum submission limits (auto-disables form when capacity is reached).
- **Embeddable**: Responsive `<iframe ...>` code generator to embed forms on external websites, WordPress, Webflow, or Shopify.
- **Email Notifications**: Automatic notification emails to the admin and optional confirmation emails to respondents with template variables (`{{form_name}}`, `{{respondent_name}}`, `{{submission_date}}`).
- **Security**: Rate limiting on submissions and logins, password hashing with bcrypt, JWT authentication, honeypot spam protection, and file upload validation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript (ESM), Multer, XLSX, Nodemailer, Helmet, Rate-Limit |
| **Database** | PostgreSQL (Supabase / Render / Neon) + Zero-Config Embedded SQLite/LibSQL Fallback |
| **Auth** | JWT (JSON Web Tokens), bcryptjs password hashing, Protected Route Middlewares |
| **Testing** | Vitest, Supertest (32 automated unit, integration, and E2E lifecycle tests) |

---

## 🗄️ Database Architecture

The system utilizes a scalable dynamic relational structure with proper foreign keys and indexes:

```
forms
├── id (PK, VARCHAR 36)
├── name (VARCHAR 255)
├── slug (VARCHAR 255, UNIQUE)
├── title (VARCHAR 255)
├── description (TEXT)
├── status (VARCHAR 50: 'published' | 'draft' | 'archived')
├── settings (JSONB / TEXT)
├── theme (JSONB / TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

form_fields
├── id (PK, VARCHAR 36)
├── form_id (FK -> forms.id ON DELETE CASCADE)
├── field_type (VARCHAR 50)
├── label (TEXT)
├── description (TEXT)
├── placeholder (TEXT)
├── required (BOOLEAN / INTEGER)
├── options (JSONB / TEXT)
├── validation (JSONB / TEXT)
├── position (INTEGER)
├── settings (JSONB / TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

form_responses
├── id (PK, VARCHAR 36)
├── form_id (FK -> forms.id ON DELETE CASCADE)
├── submitted_at (TIMESTAMP)
├── respondent_email (VARCHAR 255)
└── metadata (JSONB / TEXT)

form_response_values
├── id (PK, VARCHAR 36)
├── response_id (FK -> form_responses.id ON DELETE CASCADE)
├── field_id (FK -> form_fields.id ON DELETE CASCADE)
└── value (JSONB / TEXT)

admin_users
├── id (PK, VARCHAR 36)
├── email (VARCHAR 255, UNIQUE)
├── password_hash (VARCHAR 255)
├── name (VARCHAR 255)
└── role (VARCHAR 50)

system_settings
├── key (PK, VARCHAR 100)
├── value (JSONB / TEXT)
└── updated_at (TIMESTAMP)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: Version 18 or higher (Node 22 recommended)
- **NPM**

### 2. Installation
Clone the repository and install dependencies:
```bash
# In project root:
npm install
npm install --prefix server
npm install --prefix client
```

### 3. Environment Setup
A default configuration is pre-configured in `server/.env`.
To customize:
```bash
cp server/.env.example server/.env
```

Key environment variables:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-jwt-secret
DATABASE_URL= # Leave empty to use zero-config local store (server/data/forms.db)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### 4. Running Locally
Run both client and server concurrently with one command from the project root:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`
- **Public Forms Portal**: `http://localhost:3000/forms`
- **Admin Login**: `http://localhost:3000/admin/login`

### 5. Default Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123456`
*(Pre-filled demo button available directly on the login screen for one-click access)*

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Authenticate admin & receive JWT token
- `GET /api/auth/me` - Get current authenticated user profile
- `PUT /api/auth/profile` - Update admin name, email, or password

### Forms (`/api/forms`)
- `GET /api/forms` - List all forms with response counts (search & filter supported)
- `POST /api/forms` - Create new dynamic form with fields
- `GET /api/forms/:id` - Get form details and all question fields
- `PUT /api/forms/:id` - Update form metadata, settings, theme, and sync fields
- `DELETE /api/forms/:id` - Delete form (cascades to all fields and responses)
- `POST /api/forms/:id/duplicate` - Clone form into a new draft copy
- `PATCH /api/forms/:id/toggle-publish` - Toggle between published and draft
- `GET /api/forms/check-slug` - Validate URL slug availability

### Responses (`/api/responses`)
- `GET /api/responses` - List responses with search, date filters, and pagination
- `GET /api/responses/:id` - Get submission details with all answers dynamically mapped
- `DELETE /api/responses/:id` - Delete single response
- `DELETE /api/responses/form/:formId/all` - Delete all responses for a form
- `GET /api/responses/export/:formId` - Export responses (`format=csv` or `format=xlsx`)

### Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` - Platform statistics, counts, recent items, 14-day timeline
- `GET /api/analytics/form/:formId` - Per-field distributions (pie, bar, averages, timeline)

### Public Endpoints (`/api/public`)
- `GET /api/public/forms` - Public directory of published forms
- `GET /api/public/forms/:slug` - Form schema for public respondent
- `POST /api/public/forms/:slug/submit` - Validate and record submission
- `POST /api/uploads` - Handle file upload (returns URL and metadata)

---

## 🧪 Automated Testing

FormCraft Pro includes 32 automated tests covering authentication, form CRUD, field validations, submission rates, dynamic exports, and end-to-end workflows.

Run all tests from the project root:
```bash
npm test
```

Output:
```
 ✓ src/__tests__/api.test.ts (15 tests)
 ✓ src/__tests__/e2e.test.ts (11 tests)
 ✓ src/__tests__/validation.test.ts (6 tests)

 Test Files  3 passed (3)
      Tests  32 passed (32)
```

---

## 🚢 Deployment Guide

### Deployment Option 1: Render / Railway / Single-Service (Fullstack)
1. Build both client and server:
   ```bash
   npm run build
   ```
   *The Express server automatically detects `client/dist` and serves the React SPA statically with full client-side routing.*
2. Set environment variables on Render:
   - `NODE_ENV=production`
   - `JWT_SECRET=your_production_secret`
   - `DATABASE_URL=your_postgresql_or_supabase_url`
3. Set start command:
   ```bash
   npm start
   ```

### Deployment Option 2: Supabase + Vercel
1. Create a Supabase project and run `server/src/db/schema.sql` in the Supabase SQL Editor.
2. In your backend environment, set:
   `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
3. Deploy frontend to Vercel pointing API proxy to your deployed backend.
