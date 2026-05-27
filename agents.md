# WashTimePOS — Agent Context

> This file is the first thing the agent reads every session.
> It gives a quick picture of what the project is, what exists, and what comes next.
> For full detail on any topic, use @ to reference the relevant file in /docs/.

---

## What is this project

WashTimePOS is a Point of Sale system for car wash businesses.
It manages: sales, employees, commissions, shifts, inventory, operating costs, and reports.
Deployed on Vercel. Database and auth on Supabase. 25 tables total.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS 4 |
| UI | shadcn/ui + custom components (Stat, PageHeader, ConfirmDialog) |
| State | Zustand (3 stores: auth, shift, pos) |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| DB / Auth | Supabase (PostgreSQL + Auth) |
| Testing | Vitest + Supertest |
| Hosting | Vercel |

---

## Project structure

```
app/              → Pages by role: /admin /supervisor /cashier /employee
app/api/          → Backend API routes (serverless)
components/ui/    → Custom components on top of shadcn
components/pos/   → POS-specific components
components/forms/ → Reusable form sections
components/layout/→ Sidebar, TopBar
lib/supabase/     → client.ts (browser) + admin.ts (server only)
lib/validations/  → Zod schemas per entity
services/         → All data fetching and mutations
store/            → auth.store, shift.store, pos.store
types/            → enums.ts, models.ts, database.types.ts
tests/api/        → One test file per API resource
docs/             → PROJECT.md, FRONTEND.md, BACKEND.md, PLAN.md, PROMPTS.md
```

---

## Roles and access

| Role | Access |
|---|---|
| ADMIN | Everything |
| SUPERVISOR | Reports, employees, inventory, costs — no config or commission rules |
| CASHIER | POS, shifts, attendance |
| WASHER | Own commissions and attendance only |

Route protection: middleware.ts enforces server-side. Each layout adds client-side check.

---

## Key business rules (memorize these)

- One OPEN shift per company at a time
- sale_detail: service_id XOR inventory_id — never both, never neither
- Product lines never get executor_id and never generate commissions
- Commission priority: commissions_employee > commissions_service
- Commission base: always unit_price — never the discounted price
- Discounts live on the invoice (sale_promotions) — never on sale_detail lines
- company_id always from session — never from client input
- All writes go through API routes — never directly from components

---

## Current status
>
> Update this section at the end of every session.

### Completed

- Database: 25 tables created, RLS configured, seed applied
- Supabase clients: lib/supabase/client.ts + lib/supabase/admin.ts
- Types: types/database.types.ts generated from Supabase CLI
- Types & Enums: types/enums.ts + types/models.ts (Phase 1, Task 1)
- Auth helper & middleware: lib/auth.ts + middleware.ts (Phase 1, Task 3)
- Zustand stores: auth.store, shift.store, pos.store (Phase 1, Task 4)
- Base hooks: useAuth, useShift, useDebounce (Phase 1, Task 5)
- Utilities: formatCurrency, formatDate, formatDateTime, cn (Phase 1, Task 6)
- Database types verified: types/database.types.ts exists (83 KB, auto-generated)
- Layout components: Sidebar + TopBar + ThemeProvider (Phase 2, Task 8)
- Custom UI components: Stat, PageHeader, ConfirmDialog (Phase 2, Task 9)
- Login page (Phase 2, Task 10)
- Unauthorized page (Phase 2, Task 11)
- Layout components: Sidebar + TopBar + ThemeProvider (Phase 2, Task 8) — already listed above
- Role layouts: admin, supervisor, cashier, employee + root redirect (Phase 2, Task 12)

### In progress

- Phase 2 — Base UI

### Next task

- Phase 3, Task 13: Shifts API routes + tests

---

## How to work in this project

### Starting a session

1. Read this file
2. Read docs/PLAN.md to see what is done [x] and what is next [ ]
3. Ask the developer what task to work on
4. Reference @docs/PROJECT.md for DB schema, flows, and patterns
5. Reference @docs/FRONTEND.md before touching any UI
6. Reference @docs/BACKEND.md before touching any API or service

### Ending a session

1. Update docs/FRONTEND.md if any UI was built or modified
2. Update docs/BACKEND.md if any API route or service was built or modified
3. Mark completed tasks as [x] in docs/PLAN.md
4. Update the "Current status" section in this file
5. Confirm all tests pass

### Never

- Skip reading docs before starting
- Build more than what was asked
- Leave a session without updating docs and PLAN.md
- Mark a task [x] if tests are failing or docs are not updated
