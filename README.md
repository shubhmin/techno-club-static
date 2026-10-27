# Techno Sreshtha — Cyber Safety & Ethical AI Guild Portal

The official web portal and dynamic content management system for **Techno Sreshtha Cyber Safety Club** at DAV Public School, Sreshtha Vihar.

## 🚀 Stack & Architecture

- **Framework**: [Astro 5](https://astro.build/) (Hybrid SSR + Static Caching)
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL (`@neondatabase/serverless` + Drizzle ORM)
- **Deployment**: [Vercel](https://vercel.com/) via `@astrojs/vercel`
- **Styling**: Tailwind CSS with bespoke cyber-defense terminal design system (Plus Jakarta Sans + JetBrains Mono)
- **Admin Console**: Zero-code dashboard at `/admin` for editing content, live telemetry, events, gallery photos, and team members.

---

## ⚡ Connecting your Neon Database (The ONLY config needed)

You only need **one single environment variable**:

```env
DATABASE_URL="postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

1. **In Local Development**: Add `DATABASE_URL` to your `.env` file.
2. **On Vercel**: Go to **Project Settings → Environment Variables** and add `DATABASE_URL`.

> 💡 **Auto-Bootstrapping**: The moment you plug in your `DATABASE_URL`, the application automatically creates all necessary PostgreSQL tables and seeds initial fallback data. You do not need to run manual SQL migrations!

---

## 🛡️ Admin Console (`/admin`)

Visit `/admin` on your website:
- **First-time Setup**: If no administrator exists, the console automatically renders a setup wizard prompting you to set your master username and password.
- **Security Features**:
  - Scrypt memory-hard password hashing with salt.
  - Constant-time verification against timing attacks.
  - Brute-force rate limiting (console locks out after 5 consecutive failed attempts).
  - HttpOnly, Secure, SameSite=Strict cryptographic session management.
  - Self-contained media upload directly into Neon Postgres (`/api/media/[id]`) — no third-party AWS/Cloudinary accounts needed!
  - Real-time Tamper-Evident Security Audit Log.

---

## 🛠️ Local Development Commands

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for Vercel production
npm run build
```
