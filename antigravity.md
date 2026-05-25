# WashTimePOS — AI Configuration (Antigravity)

> Read this file first. Then read every file in the Mandatory reads section before writing any code.

---

## Identity & Mission

You are working on **WashTimePOS**, a Point of Sale system for car wash businesses.
Write clean, typed, consistent, production-grade code following every rule in this file.

Before writing any code:
1. Read this file completely
2. Read `/docs/PROJECT.md` completely
3. Read `/docs/FRONTEND.md` if touching any UI
4. Read `/docs/BACKEND.md` if touching any API route or service
5. Identify which module, route, role, and DB tables are involved
6. Follow every rule below without exception

---

## Mandatory reads

| File | Purpose |
|---|---|
| `/docs/PROJECT.md` | Full context: DB schema, roles, routes, flows, patterns, stack |
| `/docs/FRONTEND.md` | All built UI — read before touching any component, page, hook, or store |
| `/docs/BACKEND.md` | All built API routes and services — read before touching any backend code |

If unsure about a table, a business rule, or a flow → **check PROJECT.md before guessing**.
If unsure whether a component, service, or route exists → **check FRONTEND.md and BACKEND.md first**.

---

## Actual Stack (already installed — do not change)

| Layer | Technology |
|---|---|
| Framework | Next.js 15, App Router, TypeScript, Tailwind CSS 4 |
| UI | shadcn/ui with Radix + Nova preset |
| Icons | Lucide React |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |
| DB / Auth | Supabase |
| Hosting | Vercel |

### shadcn/ui components already installed
button, input, table, dropdown-menu, alert, card, tabs, select, textarea,
checkbox, badge, separator, skeleton, tooltip, dialog, sheet

**Never recreate these.** Always import from `@/components/ui/[name]`.

---

## Environment Variables

### Your responsibility
1. Copy `.env.example` to `.env.local` and fill in your Supabase values before running the project
2. Never commit `.env.local` — it is in `.gitignore`
3. When you add a new environment variable, add it to `.env.example` with a comment

### Current variables
| Variable | Scope | Where to find it |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Public (browser) | Supabase → Settings → API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public (browser) | Supabase → Settings → API |
| NEXT_PUBLIC_APP_URL | Public (browser) | http://localhost:3000 in dev |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Supabase → Settings → API |
| JWT_SECRET | Server only | Generate: openssl rand -base64 32 |

### Naming rules
- `NEXT_PUBLIC_` prefix → safe for browser, will be exposed in client bundle
- No prefix → server only, never reaches the browser
- Never read a server-only variable from a component, hook, or any client-side file
- `SUPABASE_SERVICE_ROLE_KEY` is imported ONLY in `/lib/supabase/admin.ts` — nowhere else

---

## Documentation Rule — Mandatory After Every Session

Non-negotiable. After any task, update the relevant doc before ending the session.

### Frontend changes → update `/docs/FRONTEND.md`
```md
## [Module] — [YYYY-MM-DD]

### Pages built/modified
- `/cashier/pos` — Main POS. Handles vehicle search, sale lines, promotions, payment.

### Components created/modified
- `SaleLineItem` (`/components/pos/SaleLineItem.tsx`)
  Props: line: SaleLine, onRemove: (id: string) => void
  Renders one service or product line. Shows executor badge if assigned.

### Hooks created/modified
- `useActiveShift` (`/hooks/useActiveShift.ts`)
  Returns current open shift or null. Used in POS to block sale if no shift open.

### Stores modified
- `pos.store.ts` — Added appliedPromotions array and addPromotion() action.

### Decisions made
- Vehicle search debounced 300ms to avoid excessive DB calls.
```

### Backend changes → update `/docs/BACKEND.md`
```md
## [Module] — [YYYY-MM-DD]

### API routes built/modified
- `POST /api/sales` — Creates sale. Requires CASHIER+. Validates with createSaleSchema.
- `PATCH /api/sales/[id]/payment` — Registers payment. Changes PENDING → PAID.

### Services created/modified
- `sales.service.ts`
  - createSale(input) — Creates sale header + detail lines.
  - assignExecutor(saleDetailId, userId) — Assigns executor, auto-generates commission.
  - registerPayment(saleId, method, amount) — Creates payment record, updates status.

### Business rules implemented
- Commission calculated on unit_price, never on discounted total. Enforced in assignExecutor().
- Sale cannot be paid if shift is CLOSED.
```

### Format rules
- Most recent entries at the TOP
- Every entry has a date
- Be specific — explain what a function does, what props a component takes, why a decision was made
- If changing something previously documented: strikethrough old entry, add new one with date

### What happens if you skip this
Next session recreates existing code, breaks existing logic, and produces exactly the spaghetti this project is designed to prevent.

---

## Core Rules — Never Break These

### 1. No spaghetti
- Every function does ONE thing
- Max 40 lines per function — extract helpers if longer
- No business logic inside components
- No DB queries inside components — always use `/services/`
- No inline styles — Tailwind classes only

### 2. No `any` in TypeScript
```ts
// Never
const data: any = response
// Always
const data: Sale = response
```

### 3. No direct Supabase calls from components
```ts
// Never in a component
const { data } = await supabase.from('sales').select()
// Always
const sales = await getSalesByShift(shiftId)
```

### 4. No duplicate components
Before creating any UI element:
- Check `/components/ui/` for custom components (Stat, PageHeader, ConfirmDialog)
- Check shadcn installed list: button, input, table, dropdown-menu, alert, card, tabs,
  select, textarea, checkbox, badge, separator, skeleton, tooltip, dialog, sheet
If it exists → import it. Never redefine it.

### 5. No hardcoded enum strings
```ts
// Never
if (user.role === 'ADMIN') ...
// Always
if (user.role === Role.ADMIN) ...
```

### 6. Always validate with Zod
Every form and every API route validates input with a schema from `/lib/validations/`.

### 7. Always handle three UI states
Every data-fetching component handles:
- Loading → `<Skeleton />`
- Error → `<Alert variant="destructive">`
- Empty → descriptive message

### 8. Always protect routes
Every page verifies role via middleware or `useAuth()`.
Wrong role → redirect to `/unauthorized`.

### 9. Always JSDoc on services and API routes
```ts
/**
 * What it does. Any non-obvious business rule.
 * @param name - What it is
 * @returns What it returns
 * @throws When and why
 */
```

### 10. Never expose secrets to the client
`SUPABASE_SERVICE_ROLE_KEY` only in `/lib/supabase/admin.ts`. Nowhere else. Ever.

---

## Architecture Decisions — Do Not Change Without Asking

- **services/** exists so components are dumb — they display and trigger, services handle data
- **Three Zustand stores only**: auth (session), shift (active shift), pos (sale being built)
- **Separate layout per role** — each role has its own layout + sidebar, no shared nav logic
- **Commissions auto-generated** — only created when executor_id is set on sale_detail, never manually
- **Discounts on invoice, not on lines** — sale_details always stores base prices, sale_promotions holds discounts
- **shadcn/ui is the base** — wrap or extend, never replace with custom components

---

## Feature Map

When asked to build a feature, map it here first:

### POS (cashier)
- Search vehicle by plate or create new
- Add service lines (service + vehicle type → price from services_vehicle)
- Add product lines (inventory items with quantity — e.g. 5 sodas = quantity 5, one line)
- Apply promotions (check eligibility before showing)
- Register payment (before or after service — same Pay button, changes payment_status)
- Assign executor to service lines after wash
- Commission auto-generated on executor assignment

### Shifts
- Open: verify no OPEN shift exists, record opening_cash
- Close: warn if unassigned > 0, compute totals

### Attendance
- Cashier registers check-in / check-out for each employee
- Links to current open shift

### Employees (admin + supervisor)
- CRUD, assign role, view commission history, view attendance

### Commission rules (admin only)
- Base rules per service, special agreements per employee
- Priority: employee agreement > base rule

### Promotions (admin only)
- Create with time / usage / status limits
- Disable manually, system auto-marks DEPLETED or EXPIRED

### Inventory
- SUPPLY: manual USE / PURCHASE / ADJUSTMENT movements
- SALE_PRODUCT: auto-movement on sale, manual for others
- Alert when stock <= min_stock
- Equipment: status only, no stock

### Operating costs (admin + supervisor)
- Register by category with periodicity label
- Amount always manual — never carried over automatically

### Reports (admin + supervisor)
- Sales by day/week/month, commissions per employee, P&L, inventory movements, attendance

---

## Code Generation Checklist

Before submitting any code:

- [ ] TypeScript — no `any`, all types explicit
- [ ] Imports — absolute `@/` paths, correct order
- [ ] UI — uses shadcn or existing custom components, no new duplicates
- [ ] Services — data fetching via service layer only
- [ ] Validation — Zod schema on every form and API route
- [ ] UI states — loading, error, empty all handled
- [ ] Role — route protected, role check in place
- [ ] JSDoc — on every service function and API route
- [ ] Dark mode — `dark:` classes where needed
- [ ] Enums — no hardcoded strings for role/status values
- [ ] RLS — company_id from session, never from client input
- [ ] Docs — FRONTEND.md updated if any UI was created or modified
- [ ] Docs — BACKEND.md updated if any API route or service was created or modified

---

## What NOT To Do

- Do not recreate shadcn components (button, input, dialog, alert, badge, etc.)
- Do not write business logic inside React components
- Do not call Supabase from components directly
- Do not use `any` type
- Do not hardcode role or status strings — use enums
- Do not skip Zod validation on forms or API routes
- Do not trust `company_id` from the client — read from server session
- Do not import `admin.ts` in client-side code
- Do not use `alert()`, `confirm()`, or `prompt()` — use ConfirmDialog and Sonner
- Do not store derived values (subtotal, total) — compute them
- Do not create commissions manually — auto-generated only
- Do not apply discounts at the line level — they live on the invoice via sale_promotions
- Do not skip updating FRONTEND.md or BACKEND.md after a session

---

## Asking for Clarification

Ask before coding when:
- A business rule is not in PROJECT.md
- A new table or field seems necessary
- A UI interaction is not described in the feature map
- A permission edge case is not in the role matrix

Do not invent rules. Do not add tables without confirmation.

---

*WashTimePOS — Antigravity Configuration v1.1*
*Stack: Next.js 15 + Tailwind 4 + shadcn/ui + Sonner + Supabase + Zustand*
*Always read PROJECT.md, FRONTEND.md, and BACKEND.md before writing code.*

---

## Testing Rules — Backend

Every API route must have a corresponding test file in `/tests/api/`.
Tests are written with **Vitest** + **Supertest**. Supabase is always mocked — never call the real DB.

### When to write tests
- New endpoint created → create its test file in the same session
- Endpoint modified → update its test file in the same session
- Tests must pass before a backend task is considered complete

### Required coverage per endpoint (all three, no exceptions)

**1. Happy path**
- Correct status code (200 or 201)
- Response body has the expected shape
- DB was called with correct parameters

**2. Auth & authorization**
- No session → 401
- Wrong role → 403
- Cross-company attempt → 403 (user from company A accessing company B) ← most critical

**3. Edge cases & validation**
- Missing required fields → 422
- Invalid types → 422
- Business rule violations → 400 (e.g. shift already open)
- Resource not found → 404

### Test file structure
```ts
describe('POST /api/[resource]', () => {
  describe('Happy path', () => { ... })
  describe('Auth & authorization', () => { ... })
  describe('Validation', () => { ... })
  describe('Business rules', () => { ... })
})
```

### Checklist addition for backend tasks
- [ ] Test file created or updated in `/tests/api/[resource].test.ts`
- [ ] Happy path covered
- [ ] 401 / 403 / cross-company covered
- [ ] Validation (422) covered
- [ ] Business rule violations covered
- [ ] All tests pass before closing the session

### After writing tests → update `/docs/BACKEND.md`
Include a `### Tests` section in each entry:
```md
### Tests
- `tests/api/sales.test.ts` — covers POST /api/sales
  - Happy: creates sale, triggers inventory movement on product line
  - Auth: 401 no session, 403 WASHER role, 403 cross-company
  - Validation: missing plate, empty details, both ids set, quantity < 1
  - Business: 400 no open shift, 400 vehicle not in company
```

---

## Task Management Rules

### How to work with PLAN.md
The file `docs/PLAN.md` contains the full development plan organized in phases and tasks.

**Before starting any session:**
1. Read `docs/PLAN.md`
2. Identify the first task that is NOT marked as completed
3. Only work on what the user explicitly asks for in that session — do not jump ahead

**After completing a task:**
- Open `docs/PLAN.md`
- Find the completed task
- Add `[x]` at the beginning of every line that belongs to that task
- Example:
  ```
  Before:
  - `lib/validations/shift.schema.ts` — schemas de apertura y cierre

  After:
  - [x] `lib/validations/shift.schema.ts` — schemas de apertura y cierre
  ```

**Never:**
- Mark a task as complete if tests are failing
- Mark a task as complete if documentation was not updated
- Skip ahead to a future task without being asked
- Work on multiple phases in the same session unless explicitly told to

### One task at a time
Build exactly what is asked. Nothing more.
If a task requires something from a previous phase that does not exist yet — stop and say so.
Do not build the dependency automatically without confirmation.
