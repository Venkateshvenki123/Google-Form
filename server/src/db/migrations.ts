import { db } from '../config/database.js';

export async function runMigrations(): Promise<void> {
  const isPg = db.isPostgres();
  console.log(`🚀 Running database migrations (${isPg ? 'PostgreSQL' : 'SQLite'})...`);

  if (isPg) {
    // PostgreSQL schema
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL DEFAULT 'Administrator',
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        settings JSONB NOT NULL DEFAULT '{}',
        theme JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS form_fields (
        id VARCHAR(36) PRIMARY KEY,
        form_id VARCHAR(36) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        field_type VARCHAR(50) NOT NULL,
        label TEXT NOT NULL,
        description TEXT DEFAULT '',
        placeholder TEXT DEFAULT '',
        required BOOLEAN DEFAULT FALSE,
        options JSONB DEFAULT '[]',
        validation JSONB DEFAULT '{}',
        position INTEGER NOT NULL DEFAULT 0,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS form_responses (
        id VARCHAR(36) PRIMARY KEY,
        form_id VARCHAR(36) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        respondent_email VARCHAR(255) DEFAULT '',
        metadata JSONB DEFAULT '{}'
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS form_response_values (
        id VARCHAR(36) PRIMARY KEY,
        response_id VARCHAR(36) NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
        field_id VARCHAR(36) NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
        value JSONB DEFAULT 'null'
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_fields_form_id_position ON form_fields(form_id, position);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON form_responses(submitted_at);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_response_values_response_id ON form_response_values(response_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_response_values_field_id ON form_response_values(field_id);`);

  } else {
    // SQLite schema
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'Administrator',
        role TEXT NOT NULL DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        settings TEXT NOT NULL DEFAULT '{}',
        theme TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS form_fields (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        field_type TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT DEFAULT '',
        placeholder TEXT DEFAULT '',
        required INTEGER DEFAULT 0,
        options TEXT DEFAULT '[]',
        validation TEXT DEFAULT '{}',
        position INTEGER NOT NULL DEFAULT 0,
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS form_responses (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        respondent_email TEXT DEFAULT '',
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS form_response_values (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL,
        field_id TEXT NOT NULL,
        value TEXT DEFAULT 'null',
        FOREIGN KEY (response_id) REFERENCES form_responses(id) ON DELETE CASCADE,
        FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_fields_form_id_position ON form_fields(form_id, position);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON form_responses(submitted_at);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_response_values_response_id ON form_response_values(response_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_form_response_values_field_id ON form_response_values(field_id);`);
  }

  console.log('✅ Database migrations applied successfully.');
}
