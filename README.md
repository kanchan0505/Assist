# ResumeInterview

AI-powered resume-based **voice** interview preparation. Upload your resume, extract skills and projects, then practice with live AI mock interviews powered by Vapi.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Neon PostgreSQL** + Drizzle ORM
- **NextAuth.js v5** (Google OAuth)
- **Vapi** — live voice STT, LLM, and TTS for mock interviews
- **Groq** — resume parsing and post-interview AI summaries
- **Cloudinary** — resume file storage
- **Tailwind CSS** + shadcn/ui

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled PostgreSQL connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `GROQ_API_KEY` | Groq API key — resume parse + interview debrief |
| `CLOUDINARY_*` | Cloudinary credentials for resume uploads |
| `NEXT_PUBLIC_VAPI_WEB_TOKEN` | Vapi public web key |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | Vapi assistant ID |

See **[docs/VAPI_SETUP.md](./docs/VAPI_SETUP.md)** for full Vapi dashboard configuration (Groq model, system prompt, variables).

### 3. Set up database

```bash
npm run db:push
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Flow

1. Sign in with Google
2. Upload resume (PDF/DOCX) → Groq extracts skills & projects
3. Review and edit extracted data
4. Enrich project descriptions (optional context for voice interviews)
5. Dashboard → choose interview language, skill, or project
6. Live Vapi voice mock interview
7. AI-generated score and summary (Groq) after each session

## Project Structure

```
app/
  (auth)/login/
  (dashboard)/
    dashboard/              # Voice interview hub
    onboarding/             # Upload → review → enrich
    voice/skill/[skillId]/ # Skill voice interview
    voice/project/[projectId]/
  api/voice/session/        # Session create + summarize
lib/
  vapi/                     # Vapi SDK setup
  voice/                    # Language options
  ai/                       # Groq prompts (parse, summarize)
  db/                       # Drizzle schema
components/voice/           # Hub + interview panel
docs/VAPI_SETUP.md          # Vapi configuration guide
```

## Deploy to Vercel

1. Push to GitHub and import in [Vercel](https://vercel.com)
2. Add all env vars from `.env.example`
3. Configure Vapi assistant (see `docs/VAPI_SETUP.md`) and **Publish**
4. Run `npm run db:push` against production Neon DB
5. Add Google OAuth redirect: `https://your-domain.com/api/auth/callback/google`
