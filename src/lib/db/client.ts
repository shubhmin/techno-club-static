import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let initialized = false;

export function getDatabaseUrl(): string | undefined {
  return (
    import.meta.env.DATABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined)
  );
}

export function hasDb(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && url.startsWith('postgres'));
}

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    return null;
  }
  if (!dbInstance) {
    const sql = neon(url);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

// Auto-bootstrap tables and seed defaults on first connection
export async function ensureDatabaseBootstrapped() {
  if (initialized || !hasDb()) return;
  const url = getDatabaseUrl();
  if (!url) return;

  try {
    const sql = neon(url);

    // Run safe DDL
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(64) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS page_content (
        id SERIAL PRIMARY KEY,
        page_slug VARCHAR(64) NOT NULL,
        section_key VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(page_slug, section_key)
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        track VARCHAR(64) NOT NULL,
        status VARCHAR(32) DEFAULT 'UPCOMING' NOT NULL,
        event_date VARCHAR(64) NOT NULL,
        location VARCHAR(128) NOT NULL,
        description TEXT NOT NULL,
        registration_link TEXT,
        sort_order INT DEFAULT 0 NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gallery_items (
        id SERIAL PRIMARY KEY,
        year_category VARCHAR(32) NOT NULL,
        album_title VARCHAR(128) NOT NULL,
        caption VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INT DEFAULT 0 NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        role VARCHAR(128) NOT NULL,
        category VARCHAR(32) NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INT DEFAULT 0 NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        category_tag VARCHAR(64) NOT NULL,
        track VARCHAR(64) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(32) NOT NULL,
        link_url TEXT,
        sort_order INT DEFAULT 0 NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(64) NOT NULL,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id INT REFERENCES admin_users(id) ON DELETE CASCADE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(64),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS login_attempts (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(64) NOT NULL,
        username VARCHAR(64),
        success BOOLEAN NOT NULL,
        attempted_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS security_audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        ip_address VARCHAR(64) NOT NULL,
        actor_username VARCHAR(64),
        details TEXT
      );
    `;

    // Seed default settings if empty
    const countRes = await sql`SELECT count(*)::int as count FROM site_settings`;
    if (countRes[0]?.count === 0) {
      await sql`
        INSERT INTO site_settings (key, value) VALUES
        ('accent_color', 'blue'),
        ('system_status', 'GUILD SYSTEMS: NORMAL · DAVPS SRESHTHA VIHAR'),
        ('banner_active', 'false'),
        ('banner_text', 'Annual Inter-House Cyber & AI Debate Registrations Open'),
        ('banner_link', '/gallery')
        ON CONFLICT DO NOTHING;
      `;
    }

    initialized = true;
  } catch (err) {
    console.error('Failed to auto-bootstrap database:', err);
  }
}
