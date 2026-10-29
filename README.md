# MyClassroom.AI — Student Edition

Student-only learning workspace: detailed AI notes, personalized tests, graded mock tests, private/shared library, UID connections, group chats with voice/files, and peer-to-peer video meetings.

## Supabase setup

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste `supabase/schema.sql` and run once. This creates tables, a unique student UID on signup, row-level security, file storage policies, and realtime subscriptions.
3. In **Authentication → Providers**, enable Email.
4. In **Authentication → URL Configuration**, set **Site URL** to your website and add `http://localhost:3000` to **Redirect URLs** for development.
5. Under **Project Settings → API**, obtain the **Project URL** and **publishable key**. Never paste the service-role key into the frontend.
6. Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
GEMINI_API_KEY=YOUR_SECRET_GEMINI_KEY
GEMINI_MODEL=gemini-3.8-flash
```

`VITE_` variables are public browser values. Keep Gemini and other secret keys on the server only.

## Local development

```bash
npm install
npm run lint
npm run dev
```

Open http://localhost:3000 and sign in through the email magic link.
Test collaboration using two separate verified accounts (two browsers or profiles).

## Deploying

The Express server handles `/api/gemini/*`. **A static Vercel frontend alone cannot execute these AI endpoints.** Deploy the Node/Express server on a Node host and either serve the built frontend from the same host, or set `VITE_API_BASE_URL` to your backend HTTPS origin during frontend builds.

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `GEMINI_API_KEY` in backend environment settings. Never commit `.env`.

WebRTC calls use a public STUN server; users on restrictive networks may require a TURN relay with appropriate credentials. Do not promise universally reliable video calling until TURN and cross-network testing are configured.

## Notes on correctness and access

- All library rows are private by default. Students grant access only after an accepted connection. Disconnecting revokes visibility through RLS.
- Group attachments are in a private storage bucket and accessible to group members.
- Mock MCQs are scored deterministically; descriptive answers use AI evaluation and may need human review.
- AI generation requires a configured Gemini API account and is subject to its quota/pricing. If it fails, the UI shows the error rather than fabricated notes.
- Run and verify the schema and authentication against **your** Supabase project before deploying to students.
