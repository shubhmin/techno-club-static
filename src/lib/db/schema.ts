import { pgTable, serial, text, timestamp, varchar, integer, boolean } from 'drizzle-orm/pg-core';

// 1. Global site settings (accent color, announcement banner, system telemetry)
export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Granular page copy across all webpages
export const pageContent = pgTable('page_content', {
  id: serial('id').primaryKey(),
  pageSlug: varchar('page_slug', { length: 64 }).notNull(),
  sectionKey: varchar('section_key', { length: 64 }).notNull(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Dynamic events & missions
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  track: varchar('track', { length: 64 }).notNull(), // 'COMPETITION', 'WORKSHOP', 'COMMUNITY'
  status: varchar('status', { length: 32 }).default('UPCOMING').notNull(), // 'UPCOMING', 'ACTIVE', 'COMPLETED'
  eventDate: varchar('event_date', { length: 64 }).notNull(),
  location: varchar('location', { length: 128 }).notNull(),
  description: text('description').notNull(),
  registrationLink: text('registration_link'),
  sortOrder: integer('sort_order').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Gallery items & albums
export const galleryItems = pgTable('gallery_items', {
  id: serial('id').primaryKey(),
  yearCategory: varchar('year_category', { length: 32 }).notNull(), // '2025–2026', '2024–2025'
  albumTitle: varchar('album_title', { length: 128 }).notNull(),
  caption: varchar('caption', { length: 255 }).notNull(),
  imageUrl: text('image_url').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Guild members & faculty
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  role: varchar('role', { length: 128 }).notNull(),
  category: varchar('category', { length: 32 }).notNull(), // 'FACULTY', 'CORE_STUDENT', 'CONTRIBUTOR'
  imageUrl: text('image_url').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Student projects & Scratch games
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 128 }).notNull(),
  categoryTag: varchar('category_tag', { length: 64 }).notNull(),
  track: varchar('track', { length: 64 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  linkUrl: text('link_url'),
  sortOrder: integer('sort_order').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Media assets (stored in Neon S3 storage or direct base64 fallback)
export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 64 }).notNull(),
  data: text('data'), // Fallback base64 data URI or raw base64
  s3Key: varchar('s3_key', { length: 512 }),
  s3Url: text('s3_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Admin authentication & sessions
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 64 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  salt: varchar('salt', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: integer('user_id').references(() => adminUsers.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Rate limiting & Brute force protection
export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  ipAddress: varchar('ip_address', { length: 64 }).notNull(),
  username: varchar('username', { length: 64 }),
  success: boolean('success').notNull(),
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
});

// 10. Security audit logging
export const securityAuditLogs = pgTable('security_audit_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  eventType: varchar('event_type', { length: 64 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }).notNull(),
  actorUsername: varchar('actor_username', { length: 64 }),
  details: text('details'),
});
