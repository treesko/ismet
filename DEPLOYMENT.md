Deployment Guide (Vercel)

Overview
- This app is a Next.js (App Router) application using Prisma ORM.
- Local development uses SQLite. For production (Vercel), use a hosted Postgres for persistence.
- Minimal auth is provided via Basic Auth to protect admin pages (optional).

Environment variables
- DATABASE_URL: Connection string for your DB (Postgres recommended for Vercel)
- ADMIN_USER, ADMIN_PASS: Optional Basic Auth credentials to protect /admin/*, /blocks, /settings
- PDF_SERVICE_URL: Optional HTTP endpoint that accepts { html } (JSON) and returns a PDF (application/pdf)
  
Important: Do not commit your local `.env` file. Ensure `.env` is gitignored and removed from the repo so Vercel uses the project Environment Variables instead of a local SQLite URL.

Auth (Login page)
- Set `ADMIN_USER` and `ADMIN_PASS` to enable login.
- Set `SESSION_SECRET` to a strong random string (used to sign the session cookie).
- Visit `/login` to sign in. After signing in, an HTTP-only cookie authorizes access across the app.
- `/api/logout` clears the session and redirects back to `/login`.

Quick steps (using Postgres)
1) Provision a Postgres database (e.g. Neon, Supabase, Render). Copy the connection string.
2) In Vercel project settings → Environment Variables, set:
   - DATABASE_URL = <your Postgres URL>
   - ADMIN_USER, ADMIN_PASS (optional)
   - PDF_SERVICE_URL (optional)
3) Push the repository to Vercel. Build runs `prisma generate && next build`.
4) Run database migrations once (from your local machine):
   - IMPORTANT: The repo migrations are SQLite-based. Create a clean Postgres migration baseline:
     a. Temporarily set Prisma datasource provider to postgresql and regenerate a new migration history, or
     b. Use `prisma db push` to sync schema to Postgres, then `prisma migrate diff` to establish migrations for future changes.
   - Easiest path: from local with DATABASE_URL pointing to Postgres: `npx prisma db push` to create the schema, then redeploy.
5) Open the app. Visit /settings to set company info, locale/currency, date/invoice formats.
6) Optionally, protect admin pages by setting ADMIN_USER/PASS. When set, /admin/*, /blocks, /settings prompt for Basic Auth.

Local development
- Copy .env.example to .env and set DATABASE_URL like `file:./dev.db` for SQLite (default).
- Run: `npm i`, then `npm run dev`.
- Apply local SQLite migrations: `npx prisma migrate dev` (if needed).

PDF generation
- `/api/pdf/invoice/:id` returns server-side generated PDFs when PDF_SERVICE_URL is set.
- Without it, the endpoint returns HTML you can print as PDF via the browser.

Notes & caveats
- SQLite is not persistent on Vercel. Use Postgres for production persistence.
- If you want more robust auth/roles, add NextAuth (email/password, OAuth) and roles. The current Basic Auth is meant for a simple single-user admin gate.
- If you plan for high concurrency invoice numbering, consider Postgres and sequences.
