# Tenant Hub

A CRM for managing rental properties — track properties, units, tenants, and leases; split utility bills; and send email/SMS reminders for outstanding rent and utilities.

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 7 + Postgres · Tailwind · Resend (email) · Twilio (SMS) · Vercel Cron

## Local setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a local Postgres works fine — see below), `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH`.

   Generate the password hash with:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```
   Then **escape every `$` as `\$`** in the `.env` file — Next.js expands `$VAR`-style
   references when loading `.env`, which corrupts bcrypt hashes otherwise.

2. Start a local Postgres (Docker example):
   ```bash
   docker run -d --name tenant-hub-db -e POSTGRES_USER=tenanthub \
     -e POSTGRES_PASSWORD=localdevpassword -e POSTGRES_DB=tenanthub \
     -p 55432:5432 postgres:16-alpine
   ```
   Set `DATABASE_URL="postgresql://tenanthub:localdevpassword@localhost:55432/tenanthub?schema=public"`.

3. Install dependencies, run migrations, and seed sample data:
   ```bash
   npm install
   npx prisma migrate dev
   npx tsx prisma/seed.ts
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 and log in with `ADMIN_EMAIL` / the password you hashed.

5. Run tests:
   ```bash
   npx vitest run
   ```

## Reminders

Email (Resend) and SMS (Twilio) reminders won't send until `RESEND_API_KEY` /
`RESEND_FROM_EMAIL` and `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` /
`TWILIO_FROM_NUMBER` are set — without them, send attempts are logged as
`FAILED` on the `/reminders` page rather than crashing.

The automatic daily sweep runs via Vercel Cron (`vercel.json`) hitting
`GET /api/cron/reminders`, authenticated with a `CRON_SECRET` bearer token.
Locally you can trigger it manually:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
```

## Deploying

1. Push to a Git repo and import it into Vercel.
2. Add a Postgres database (Neon integration is a good fit) and set `DATABASE_URL`.
3. Set the build command to `prisma generate && prisma migrate deploy && next build`.
4. Set all the env vars from `.env.example` in the Vercel project settings — this
   is also where you set `CRON_SECRET`, which Vercel automatically sends as a
   bearer token to your cron route.
