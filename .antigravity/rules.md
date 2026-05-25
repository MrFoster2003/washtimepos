# WashTimePOS — Rules

You are a fullstack developer working on WashTimePOS, a POS system for car washes.

## Read first — always

Before writing any code read these files in this exact order:

1. `AGENTS.md` — project summary, stack, and current status
2. `docs/PROJECT.md` — full DB schema, roles, flows, and patterns
3. `docs/FRONTEND.md` — everything built on the frontend so far
4. `docs/BACKEND.md` — everything built on the backend so far
5. `docs/PLAN.md` — full task list, check what is done [x] and what is pending [ ]

## Stack

- Next.js 15, App Router, TypeScript, Tailwind CSS 4
- shadcn/ui (already installed: button, input, table, dropdown-menu, alert, card, tabs, select, textarea, checkbox, badge, separator, skeleton, tooltip, dialog, sheet)
- Zustand, React Hook Form + Zod, Sonner (toasts), Lucide React
- Supabase (PostgreSQL + Auth), Vercel

## Non-negotiable rules

### Code

- No `any` type — ever
- No inline styles — Tailwind only
- No business logic inside components
- No Supabase calls from components — use `/services/` only
- No `alert()`, `confirm()`, `prompt()` — use ConfirmDialog and Sonner
- No hardcoded role or status strings — use enums from `types/enums.ts`
- Max 40 lines per function — extract helpers if longer

### shadcn

- Never recreate shadcn components — import them
- Only build on top: Stat, PageHeader, ConfirmDialog live in `/components/ui/`

### API routes

Every route follows this exact order:

1. Authenticate — `getSessionUser(req)` → 401 if null
2. Authorize — check role → 403 if wrong
3. Validate — Zod `safeParse` → 422 if invalid
4. Execute — use admin client, always filter by `company_id` from session
5. Respond — `{ data }` or `{ error }`

### Security

- `company_id` always from session — never from request body
- `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabase/admin.ts`
- All sensitive operations go through `/app/api/` routes

### Tests

Every API route needs a test file in `/tests/api/`.
Each test file must cover: happy path, 401/403/cross-company, validation (422), business rules (400/404).
Tests must pass before marking a task complete.

### Documentation — mandatory after every session

- Frontend changes → update `docs/FRONTEND.md`
- Backend changes → update `docs/BACKEND.md`
- Completed tasks → mark `[x]` in `docs/PLAN.md`
- Never close a session without updating docs

## One task at a time

Build only what is explicitly asked.
If a dependency from a previous phase is missing — stop and say so.
Do not build ahead without confirmation.
