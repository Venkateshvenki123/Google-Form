import pg from 'pg';
import { createClient, type Client as LibSqlClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type DbEngine = 'postgres' | 'sqlite';

interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  isPostgres(): boolean;
}

class DatabaseManager implements DbClient {
  private engine: DbEngine = 'sqlite';
  private pgPool: pg.Pool | null = null;
  private sqliteClient: LibSqlClient | null = null;
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    const dbUrl = config.databaseUrl.trim();
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      this.engine = 'postgres';
      this.pgPool = new pg.Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('supabase') || dbUrl.includes('render') || dbUrl.includes('neon')
          ? { rejectUnauthorized: false }
          : false,
      });
      console.log('📦 Database: Connected using PostgreSQL Pool');
    } else {
      this.engine = 'sqlite';
      const dataDir = path.resolve(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dbPath = path.resolve(dataDir, 'forms.db');
      this.sqliteClient = createClient({
        url: `file:${dbPath.replace(/\\/g, '/')}`,
      });
      console.log(`📦 Database: Using local zero-config SQLite/LibSQL store (${dbPath})`);
    }
    this.initialized = true;
  }

  public isPostgres(): boolean {
    return this.engine === 'postgres';
  }

  public async query<T = any>(sqlText: string, params: any[] = []): Promise<QueryResult<T>> {
    if (this.engine === 'postgres' && this.pgPool) {
      try {
        const res = await this.pgPool.query(sqlText, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rowCount ?? res.rows.length,
        };
      } catch (err) {
        console.error('PostgreSQL query error:', err, 'SQL:', sqlText, 'Params:', params);
        throw err;
      }
    } else if (this.sqliteClient) {
      try {
        // Convert PostgreSQL $1, $2, etc. placeholders into ? for SQLite
        let sqliteSql = sqlText.replace(/\$(\d+)/g, '?');

        // SQLite doesn't use 'TIMESTAMP WITH TIME ZONE' or 'JSONB', handled in migrations
        // Serialize objects/arrays in params for SQLite
        const normalizedParams = params.map(p => {
          if (p === null || p === undefined) return null;
          if (typeof p === 'boolean') return p ? 1 : 0;
          if (typeof p === 'object' && !(p instanceof Date)) {
            return JSON.stringify(p);
          }
          if (p instanceof Date) {
            return p.toISOString();
          }
          return p;
        });

        const res = await this.sqliteClient.execute({
          sql: sqliteSql,
          args: normalizedParams,
        });

        const rows: any[] = res.rows.map(row => {
          const obj: Record<string, any> = {};
          res.columns.forEach((col, idx) => {
            let val: any = (row as any)[col] ?? (row as any)[idx];
            // Auto parse JSON columns if they are strings
            if (
              typeof val === 'string' &&
              (col === 'settings' ||
                col === 'theme' ||
                col === 'options' ||
                col === 'validation' ||
                col === 'metadata' ||
                col === 'value')
            ) {
              try {
                val = JSON.parse(val);
              } catch {
                // leave as string
              }
            }
            // Normalize boolean fields if SQLite returns 1/0
            if (col === 'required') {
              val = Boolean(val);
            }
            obj[col] = val;
          });
          return obj;
        });

        return {
          rows: rows as T[],
          rowCount: res.rowsAffected ?? rows.length,
        };
      } catch (err) {
        console.error('SQLite query error:', err, 'SQL:', sqlText, 'Params:', params);
        throw err;
      }
    }

    throw new Error('Database client not initialized');
  }

  public async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.sqliteClient) {
      this.sqliteClient.close();
    }
  }
}

export const db = new DatabaseManager();
