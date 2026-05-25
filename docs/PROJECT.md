# WashTimePOS — Complete Project Documentation

> Read this file before writing any code. Every decision made here has a reason.
> All code, comments, variables, functions, and documentation must be written in **English**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Model](#2-business-model)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Authentication & Roles](#5-authentication--roles)
6. [Route Map](#6-route-map)
7. [Design System](#7-design-system)
8. [Component Library](#8-component-library)
9. [Project Structure](#9-project-structure)
10. [Backend Patterns](#10-backend-patterns)
11. [Frontend Patterns](#11-frontend-patterns)
12. [Business Logic & Flows](#12-business-logic--flows)
13. [Coding Conventions](#13-coding-conventions)
14. [Documentation Standard](#14-documentation-standard)
15. [Security Rules](#15-security-rules)

---

## 1. Project Overview

**WashTimePOS** is a Point of Sale system designed for car wash businesses.
Deployed on Vercel (frontend + serverless API) with Supabase as the database and auth provider.
Manages the full operation of a car wash: sales, employees, commissions, shifts, inventory, costs, and reporting.

### Core principles

- Every feature must serve an operational need — no bloat
- Data integrity over convenience — never skip validations
- Role-based access is non-negotiable — every route is protected
- One source of truth — no duplicated business logic between frontend and backend

---

## 2. Business Model

### How a car wash operates

- A **shift** is opened by a cashier or supervisor (24/7 operation, one shift open at a time per company)
- A **client** arrives with a **vehicle** (identified by license plate)
- The cashier registers a **sale** with one or more **service lines** and/or **product lines**
- Payment can happen **before** or **after** the service — handled by a single Pay button that changes the sale status
- After washing, the employee who performed each service tells the cashier — the cashier assigns them to each service line
- When an employee is assigned, a **commission** is automatically calculated and recorded
- The shift is closed at the end of the period with a cash summary
- **Promotions/discounts** are applied at the invoice level (not per line) — employee commissions are always calculated on base price, never on discounted price

### Commission rules

1. Check if the employee has a **special agreement** for this service (`commissions_employee`) → use it if exists
2. Otherwise use the **base commission** for the service (`commissions_service`)
3. Commission is always calculated on `unit_price` (base price), regardless of any discounts on the invoice

### Inventory flow

- **Equipment** (pressure washers, compressors): tracked for existence and status only, no stock movement
- **Supplies** (soap, sponges, wax): manual movements — staff registers usage or purchase when needed
- **Sale products** (drinks, snacks, oil): added to a sale invoice or sold standalone; each sale line auto-triggers an inventory movement of type SALE
- All inventory exits: SALE, USE, ADJUSTMENT — entries: PURCHASE

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 15 |
| Language | TypeScript | 5+ |
| Styling | Tailwind CSS | 4 |
| UI Components | shadcn/ui (Radix + Nova preset) | latest |
| Icons | Lucide React | latest |
| Database | Supabase (PostgreSQL) | latest |
| Auth | Supabase Auth | latest |
| Hosting | Vercel | latest |
| State | Zustand | 4+ |
| Forms | React Hook Form + Zod | latest |
| Toasts | Sonner | latest |

### shadcn/ui components already installed

The following components are already available from shadcn/ui — never recreate them:
button, input, table, dropdown-menu, alert, card, tabs, select, textarea,
checkbox, badge, separator, skeleton, tooltip, dialog, sheet

### Key rules for the stack

- Use **App Router** only — no Pages Router
- Use **Server Components** by default — add `'use client'` only when strictly necessary (interactivity, hooks, browser APIs)
- shadcn/ui components are the base — wrap or extend them, never replace them
- Toasts use **Sonner** — never use browser `alert()` or build custom toast components
- Zod schemas are the single source of truth for validation — reuse in frontend and backend
- Never import Supabase admin client in frontend components

---

## 4. Database Schema

> All tables include `created_at` (timestamp) unless noted. Modifiable tables include `updated_at`.
> Every table (except `vehicles`) has a UUID `id` as primary key.
> Every table except `roles` and `plans` has `company_id` (FK → companies) for multi-tenancy isolation.

---

### Module: Platform / White Label

#### `companies`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | string | Commercial name |
| nit | string | Tax ID |
| logo_url | string | For white label branding |
| email | string | Main contact |
| phone | string | |
| active | boolean | Platform-level toggle |
| created_at | timestamp | |

#### `plans`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | string | Basic, Pro, Enterprise |
| description | string | |
| monthly_price | decimal | |
| annual_price | decimal | 20% discount applied |
| max_users | int | NULL = unlimited |
| max_services_month | int | NULL = unlimited |
| allows_multishift | boolean | 24/7 operation |
| allows_reports | boolean | |
| allows_operating_costs | boolean | |
| allows_promotions | boolean | |
| trial_days | int | NULL = no trial |
| active | boolean | |
| created_at | timestamp | |

#### `subscriptions`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| plan_id | FK → plans | |
| status | enum | TRIAL / ACTIVE / EXPIRED / CANCELLED / SUSPENDED |
| periodicity | enum | MONTHLY / ANNUAL |
| start_date | date | |
| end_date | date | |
| trial_end_date | date | NULL if no trial |
| auto_renewal | boolean | |
| amount_paid | decimal | Actual amount paid |
| currency | string | COP, USD, etc. |
| payment_reference | string | Payment gateway transaction ID |
| cancellation_reason | string | NULL if active |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### Module: Users & Access

#### `roles`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | string | ADMIN / SUPERVISOR / CASHIER / WASHER |
| description | string | |

> Roles are seeded on install. Do not allow creation of new roles from the UI.

#### `users`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | Matches Supabase Auth UID |
| company_id | FK → companies | |
| role_id | FK → roles | |
| name | string | Full name |
| phone | string | |
| email | string | Used for Supabase Auth login |
| active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### Module: Service Catalog

#### `vehicle_types`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| name | string | Car, Motorcycle, Truck, Bus |
| active | boolean | |

#### `services`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| name | string | Basic wash, Wax, Engine wash |
| description | string | |
| estimated_time_min | int | Estimated execution time in minutes |
| active | boolean | |

#### `services_vehicle`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| service_id | FK → services | |
| vehicle_type_id | FK → vehicle_types | |
| price | decimal | Price for this service + vehicle type combo |
| active | boolean | |

> A basic wash costs differently for a car vs a motorcycle. This table handles that.

---

### Module: Commissions

#### `commissions_service`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| service_id | FK → services | |
| value_type | enum | FIXED / PERCENTAGE |
| value | decimal | Base commission for all employees |
| active | boolean | |

#### `commissions_employee`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | FK → users | |
| service_id | FK → services | |
| value_type | enum | FIXED / PERCENTAGE |
| value | decimal | Special agreement for this specific employee |
| active | boolean | |

> Priority: `commissions_employee` overrides `commissions_service` if a record exists.

---

### Module: Clients & Vehicles

#### `vehicles`

| Field | Type | Notes |
|---|---|---|
| plate | string PK | License plate — main identifier |
| company_id | FK → companies | |
| vehicle_type_id | FK → vehicle_types | |
| brand | string | Chevrolet, Yamaha, Toyota |
| model | string | Spark, FZ, Hilux |
| year | int | |
| color | string | |
| engine_cc | int | Engine displacement in CC |
| owner_name | string | |
| owner_phone | string | |
| owner_email | string | Optional |
| active | boolean | Archive without deleting |
| created_at | timestamp | |
| updated_at | timestamp | |

> The vehicle IS the client. Any person who brings it is linked to the plate's history.

---

### Module: Promotions & Discounts

#### `promotions`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| service_id | FK → services | NULL = applies to full invoice |
| name | string | |
| description | text | Visible to cashier in POS |
| type | enum | COMBO / SERVICE_DISCOUNT / INVOICE_DISCOUNT |
| value | decimal | Amount or percentage |
| value_type | enum | FIXED / PERCENTAGE |
| start_date | date | |
| end_date | date | NULL = no time limit |
| usage_limit | int | NULL = unlimited |
| current_uses | int | Auto-incremented on each use |
| status | enum | ACTIVE / DEPLETED / EXPIRED / DISABLED |
| created_at | timestamp | |
| updated_at | timestamp | |

> Expires by whichever comes first: end_date passed, current_uses >= usage_limit, or manually DISABLED.
> Employee commission is ALWAYS calculated on base price — never on the discounted price.

#### `sale_promotions`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sale_id | FK → sales | |
| promotion_id | FK → promotions | |
| amount_discounted | decimal | Actual amount discounted on this invoice |
| applied_by | FK → users | Cashier who applied it |
| created_at | timestamp | |

> One sale can have multiple promotions — one row per promotion applied.

---

### Module: Inventory

#### `equipment`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| name | string | Pressure washer, Compressor |
| brand | string | |
| model | string | |
| serial_number | string | Optional |
| purchase_date | date | Optional |
| status | enum | ACTIVE / MAINTENANCE / INACTIVE |
| notes | text | Optional |
| created_at | timestamp | |
| updated_at | timestamp | |

> Equipment has NO stock movement — tracked for existence and status only.

#### `inventory_categories`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| name | string | Supplies, Beverages, Snacks, Lubricants |
| active | boolean | |

#### `inventory`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| category_id | FK → inventory_categories | |
| name | string | Soap, Pepsi, Oil 20W50 |
| type | enum | SUPPLY / SALE_PRODUCT |
| unit | string | ml, units, liters, kg |
| stock | decimal | Current stock level |
| min_stock | decimal | Alert threshold |
| sale_price | decimal | NULL if SUPPLY only |
| cost_price | decimal | Purchase cost per unit |
| active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `inventory_movements`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| inventory_id | FK → inventory | |
| type | enum | PURCHASE / SALE / USE / ADJUSTMENT |
| quantity | decimal | Positive = entry, negative = exit |
| unit_price | decimal | Price at time of movement |
| sale_id | FK → sales | Only for type = SALE |
| registered_by | FK → users | |
| notes | text | Optional |
| created_at | timestamp | |

---

### Module: POS / Operations

#### `shifts`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| opened_by | FK → users | |
| closed_by | FK → users | NULL if still open |
| opened_at | timestamp | |
| closed_at | timestamp | NULL if still open |
| status | enum | OPEN / CLOSED |
| opening_cash | decimal | Cash in register at start |
| total_cash | decimal | Cash collected during shift |
| total_digital | decimal | Digital payments collected |
| total_sales | decimal | Sum of all sales |
| total_services | int | Number of services performed |
| total_unassigned | int | Services without assigned employee at close |
| notes | text | Free text at closing |
| created_at | timestamp | |

> Only ONE shift with status = OPEN is allowed per company at any time.

#### `sales`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| shift_id | FK → shifts | |
| vehicle_plate | FK → vehicles | |
| cashier_id | FK → users | |
| subtotal | decimal | Sum of all line base prices |
| total_discounts | decimal | Sum of all promotions applied |
| total | decimal | Final amount client pays |
| payment_status | enum | PENDING / PAID / CANCELLED |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `sale_details`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sale_id | FK → sales | |
| service_id | FK → services | NULL if product line |
| inventory_id | FK → inventory | NULL if service line |
| executor_id | FK → users | NULL until assigned (services only) |
| quantity | decimal | Always >= 1 |
| unit_price | decimal | Price per unit at time of sale |
| subtotal | decimal | quantity x unit_price |
| assigned | boolean | Whether executor has been assigned |
| created_at | timestamp | |

> CONSTRAINT: either service_id OR inventory_id must be set — never both, never neither.
> Products (inventory_id) never have executor_id — they don't generate commissions.
> quantity applies to both services and products (e.g. 5 sodas = quantity 5, one line).

#### `payments`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sale_id | FK → sales | |
| amount | decimal | |
| payment_method | enum | CASH / NEQUI / TRANSFER / OTHER |
| paid_at | timestamp | |
| registered_by | FK → users | Cashier |

> Separate from sales to support pay-before and pay-after flows.

#### `commissions_generated`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| sale_detail_id | FK → sale_details | 1-to-1 |
| user_id | FK → users | Employee who performed the service |
| calculation_base | decimal | Always base price — never discounted price |
| commission_amount | decimal | Calculated amount |
| status | enum | PENDING / PAID |
| created_at | timestamp | |

> Auto-generated when executor_id is assigned in sale_details.
> If a service line has no executor → no commission record exists yet.

---

### Module: Attendance

#### `attendance`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| user_id | FK → users | |
| shift_id | FK → shifts | NULL if outside shift |
| date | date | For easy date filtering |
| check_in | timestamp | |
| check_out | timestamp | NULL if still present |
| minutes_worked | int | Calculated on check_out |
| registered_by | FK → users | Cashier who recorded it |
| registration_type | enum | MANUAL / AUTOMATIC |
| notes | text | Late, early leave, etc. |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### Module: Operating Costs

#### `cost_categories`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| name | string | Water, Electricity, Supplies, Rent |
| color | string | Hex color for reports |
| active | boolean | |

#### `operating_costs`

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | FK → companies | |
| category_id | FK → cost_categories | |
| description | string | "Invoice water March", "Soap purchase" |
| amount | decimal | Actual amount — entered manually every time |
| date | date | |
| periodicity | enum | ONE_TIME / MONTHLY / WEEKLY |
| receipt_url | string | Photo or PDF of receipt. Optional |
| registered_by | FK → users | |
| created_at | timestamp | |
| updated_at | timestamp | |

> Amount is ALWAYS entered manually. periodicity = MONTHLY is just a label for reminders.
> It does NOT auto-fill or carry over previous values.

---

### Complete Table Summary (25 tables)

| # | Table | Module |
|---|---|---|
| 1 | companies | Platform |
| 2 | plans | Platform |
| 3 | subscriptions | Platform |
| 4 | roles | Users |
| 5 | users | Users |
| 6 | vehicle_types | Catalog |
| 7 | services | Catalog |
| 8 | services_vehicle | Catalog |
| 9 | commissions_service | Commissions |
| 10 | commissions_employee | Commissions |
| 11 | vehicles | Clients |
| 12 | promotions | Promotions |
| 13 | sale_promotions | Promotions |
| 14 | equipment | Inventory |
| 15 | inventory_categories | Inventory |
| 16 | inventory | Inventory |
| 17 | inventory_movements | Inventory |
| 18 | shifts | POS |
| 19 | sales | POS |
| 20 | sale_details | POS |
| 21 | payments | POS |
| 22 | commissions_generated | POS |
| 23 | attendance | Attendance |
| 24 | cost_categories | Costs |
| 25 | operating_costs | Costs |

---

## 5. Authentication & Roles

### Auth flow

1. User logs in with email + password via Supabase Auth
2. On login, fetch `users` record matching `auth.uid()` → get `role_id` and `company_id`
3. Store `{ role, company_id, user_id, name }` in Zustand `auth.store`
4. `middleware.ts` reads the session on every request and enforces route protection

### Role permissions matrix

| Feature | ADMIN | SUPERVISOR | CASHIER | WASHER |
|---|---|---|---|---|
| Open / close shift | ✓ | ✓ | ✓ | ✗ |
| Register sale (POS) | ✓ | ✓ | ✓ | ✗ |
| Assign executor to service | ✓ | ✓ | ✓ | ✗ |
| Register payment | ✓ | ✓ | ✓ | ✗ |
| Apply promotion | ✓ | ✓ | ✓ | ✗ |
| Register attendance | ✓ | ✓ | ✓ | ✗ |
| View own commissions | ✓ | ✓ | ✓ | ✓ |
| View own attendance | ✓ | ✓ | ✓ | ✓ |
| View all commissions | ✓ | ✓ | ✗ | ✗ |
| View reports / metrics | ✓ | ✓ | ✗ | ✗ |
| Manage employees | ✓ | ✓ | ✗ | ✗ |
| Manage inventory | ✓ | ✓ | ✗ | ✗ |
| Manage equipment | ✓ | ✓ | ✗ | ✗ |
| Register operating costs | ✓ | ✓ | ✗ | ✗ |
| View operating costs | ✓ | ✓ | ✗ | ✗ |
| Cancel sales | ✓ | ✓ | ✗ | ✗ |
| Manage services / prices | ✓ | ✗ | ✗ | ✗ |
| Manage promotions | ✓ | ✗ | ✗ | ✗ |
| Manage commission rules | ✓ | ✗ | ✗ | ✗ |
| Company configuration | ✓ | ✗ | ✗ | ✗ |

### Middleware logic

```ts
// middleware.ts
const roleRoutes: Record<string, string[]> = {
  '/admin':      ['ADMIN'],
  '/supervisor': ['ADMIN', 'SUPERVISOR'],
  '/cashier':    ['ADMIN', 'SUPERVISOR', 'CASHIER'],
  '/employee':   ['ADMIN', 'SUPERVISOR', 'CASHIER', 'WASHER'],
}
// If role does not match → redirect to their own dashboard root
```

---

## 6. Route Map

### Public routes

```
/login           → Login (all roles)
/unauthorized    → Access denied
```

### Admin routes (/admin/*)

```
/admin/dashboard      → Overview metrics
/admin/employees      → List + create/edit/deactivate
/admin/services       → Service catalog + prices per vehicle type
/admin/commissions    → Base rules + special employee agreements
/admin/promotions     → Create / edit / disable promotions
/admin/inventory      → Full inventory management
/admin/equipment      → Equipment registry
/admin/costs          → Operating costs + categories
/admin/reports        → Full reports (sales, commissions, costs, P&L)
/admin/config         → Company settings
```

### Supervisor routes (/supervisor/*)

```
/supervisor/dashboard    → Shift overview + today's metrics
/supervisor/employees    → View + manage employees
/supervisor/inventory    → Inventory + movements
/supervisor/equipment    → Equipment status
/supervisor/costs        → Register + view costs
/supervisor/reports      → Sales and commission reports
/supervisor/commissions  → View all commissions
```

### Cashier routes (/cashier/*)

```
/cashier/pos         → Main POS screen (most critical screen in the app)
/cashier/shift       → Open / close shift
/cashier/attendance  → Register employee check-in / check-out
/cashier/sales       → Today's sales list
```

### Employee routes (/employee/*)

```
/employee/dashboard  → Own commissions + attendance history
```

---

## 7. Design System

### Colors

```
Primary blue:  #2563eb  (Tailwind blue-600)
White:         #ffffff
Dark bg:       #0f172a  (Tailwind slate-900)

Semantic:
  Success:     #16a34a  (green-600)
  Warning:     #d97706  (amber-600)
  Danger:      #dc2626  (red-600)
  Info:        #0891b2  (cyan-600)
```

### Typography

- Font: **Inter** (loaded via next/font)
- Scale: Tailwind default (text-xs through text-3xl)

### Dark mode

- Strategy: `class` in `tailwind.config.ts`
- Toggle: TopBar button — persists in `localStorage`
- Default: system preference on first visit
- All components must work correctly in both modes

### Components base

shadcn/ui with Nova preset. Extend with Tailwind — never override with inline styles.

---

## 8. Component Library

### Already installed (shadcn/ui) — never recreate these

button, input, table, dropdown-menu, alert, card, tabs, select, textarea,
checkbox, badge, separator, skeleton, tooltip, dialog, sheet

### To build on top of shadcn (/components/ui/)

- **Stat.tsx** — Dashboard metric card: label, value, trend, icon
- **PageHeader.tsx** — Page title + subtitle + optional action button
- **ConfirmDialog.tsx** — Wraps shadcn Dialog for destructive action confirmations

### POS-specific (/components/pos/)

- **VehicleSearch.tsx** — Search by plate or create new vehicle
- **SaleLineItem.tsx** — Single line in the active sale (service or product)
- **PaymentPanel.tsx** — Payment method selection + confirmation
- **PromotionSelector.tsx** — Browse and apply available promotions
- **ExecutorAssigner.tsx** — Assign employee to a completed service line

### Layout (/components/layout/)

- **Sidebar.tsx** — Role-aware nav (reads role from auth.store, renders allowed links only)
- **TopBar.tsx** — Company name, user name + role, dark mode toggle

### Forms (/components/forms/)

Reusable form sections — NOT full pages. Accept `onSubmit` as prop.
Examples: VehicleForm, EmployeeForm, ServiceForm, PromotionForm, InventoryItemForm

### Table columns (/components/tables/)

Column definitions per entity for the shadcn Table component.
Examples: employees.columns.tsx, sales.columns.tsx, inventory.columns.tsx

---

## 9. Project Structure

```
washtimepos/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── employees/page.tsx + new/page.tsx + [id]/page.tsx
│   │   ├── services/page.tsx
│   │   ├── commissions/page.tsx
│   │   ├── promotions/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── equipment/page.tsx
│   │   ├── costs/page.tsx
│   │   ├── reports/page.tsx
│   │   └── config/page.tsx
│   ├── supervisor/
│   │   ├── layout.tsx
│   │   └── dashboard|employees|inventory|equipment|costs|reports|commissions/page.tsx
│   ├── cashier/
│   │   ├── layout.tsx
│   │   └── pos|shift|attendance|sales/page.tsx
│   ├── employee/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx
│   ├── api/
│   │   └── auth|sales|shifts|commissions|reports|inventory|employees|promotions|costs|attendance/route.ts
│   ├── unauthorized/page.tsx
│   ├── layout.tsx
│   └── page.tsx  (redirects to /login)
│
├── components/
│   ├── ui/          ← Custom on top of shadcn: Stat, PageHeader, ConfirmDialog
│   ├── forms/       ← Reusable form sections per entity
│   ├── tables/      ← Column definitions per entity
│   ├── pos/         ← POS-specific components
│   └── layout/      ← Sidebar, TopBar
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts   ← Browser client (anon key)
│   │   └── admin.ts    ← Server-only client (service role — API routes only)
│   ├── auth.ts
│   ├── utils.ts        ← formatCurrency, formatDate, etc.
│   └── validations/    ← Zod schemas per entity
│
├── hooks/              ← useAuth, useShift, useDebounce
├── services/           ← One file per entity
├── store/              ← auth.store, shift.store, pos.store
├── types/              ← database.types.ts, models.ts, enums.ts
│
├── docs/
│   ├── PROJECT.md      ← This file
│   ├── FRONTEND.md     ← Updated after every frontend session
│   └── BACKEND.md      ← Updated after every backend session
│
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── middleware.ts
├── .env.example
├── .env.local          ← Never committed to git
└── ANTIGRAVITY.md
```

---

## 10. Backend Patterns

### API Route structure

```ts
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/lib/auth'
import { resourceSchema } from '@/lib/validations/resource.schema'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getSessionUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Authorize
    if (!['ADMIN', 'SUPERVISOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Validate
    const body = await req.json()
    const parsed = resourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    // 4. Execute — always use company_id from session, never from body
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('table')
      .insert({ ...parsed.data, company_id: user.company_id })
      .select()
      .single()

    if (error) throw error

    // 5. Respond
    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/resource]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Standard API response format

```ts
// Success
{ data: T, meta?: { total, page, limit } }

// Error
{ error: string | ZodFieldErrors }
```

### Service layer pattern

```ts
// services/sales.service.ts
/**
 * Fetches all sales for a given shift.
 * @param shiftId - Active shift UUID
 * @returns Array of sales with details and payments
 */
export async function getSalesByShift(shiftId: string): Promise<Sale[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('sales')
    .select(`*, sale_details(*, services(*), inventory(*)), payments(*)`)
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getSalesByShift: ${error.message}`)
  return data
}
```

### Commission calculation priority

```ts
// When assigning executor_id to a sale_detail:
// 1. Check commissions_employee for this user + service → use if exists
// 2. Fall back to commissions_service for this service
// 3. Apply value_type: FIXED × quantity OR PERCENTAGE of (unit_price × quantity)
// Base is always unit_price — never the invoice total or discounted price
```

### Error handling

- Never expose raw DB errors to the client
- Always log server-side: `console.error('[CONTEXT]', error)`
- Return human-readable messages in Spanish for UI-facing errors
- HTTP status codes: 200, 201, 400, 401, 403, 404, 422, 500

---

## 11. Frontend Patterns

### Data fetching

- Server Components → fetch directly via Supabase admin client
- Client Components → use service functions from `/services/`
- Never call Supabase directly from a component

### Form pattern

```tsx
const schema = z.object({ name: z.string().min(1) })
type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

### Three required UI states

Every data-fetching component must handle:

1. **Loading** → shadcn `<Skeleton />`
2. **Error** → shadcn `<Alert variant="destructive">`
3. **Empty** → descriptive empty state message

### Toast notifications

```ts
import { toast } from 'sonner'
toast.success('Sale registered successfully')
toast.error('Could not save changes')
```

Never use `alert()` or `confirm()` — use `<ConfirmDialog>` for destructive actions.

### POS store (Zustand)

```ts
// store/pos.store.ts
{
  vehiclePlate: string | null,
  lines: SaleLine[],
  appliedPromotions: Promotion[],
  paymentStatus: 'PENDING' | 'PAID',
  // Computed (derived — never stored separately):
  get subtotal(): number,
  get totalDiscounts(): number,
  get total(): number,
}
```

---

## 12. Business Logic & Flows

### POS — Pay before service

```
1. Client arrives
2. Cashier searches/creates vehicle by plate
3. Cashier adds service and/or product lines
4. Cashier applies promotions (optional)
5. Client pays → payment_status = PAID, payment record created
6. Vehicle goes to wash area
7. Employee performs service, reports to cashier
8. Cashier assigns executor_id to each service line
9. System auto-creates commissions_generated record
```

### POS — Pay after service

```
1. Client arrives
2. Cashier creates sale → payment_status = PENDING
3. Vehicle goes to wash area
4. Employee performs service, reports to cashier
5. Cashier assigns executor_id → commission auto-generated
6. Client returns, cashier registers payment → payment_status = PAID
```

### Shift flow

```
Open:  verify no OPEN shift exists for company → record opened_by, opened_at, opening_cash
Close: warn if total_unassigned > 0 → compute totals → record closed_by, closed_at
```

### Inventory auto-movement on product sale

```
sale_detail has inventory_id set →
  create inventory_movement { type: SALE, quantity: -line.quantity, sale_id }
  update inventory.stock -= line.quantity
  if stock <= min_stock → show low stock alert
```

### Promotion eligibility check (before showing in POS)

```
status === ACTIVE
AND (end_date IS NULL OR end_date >= today)
AND (usage_limit IS NULL OR current_uses < usage_limit)
```

---

## 13. Coding Conventions

### File naming

```
components/  → PascalCase.tsx         (Button.tsx, SaleLineItem.tsx)
services/    → camelCase.service.ts   (sales.service.ts)
hooks/       → camelCase.ts           (useAuth.ts)
validations/ → camelCase.schema.ts    (sale.schema.ts)
store/       → camelCase.store.ts     (auth.store.ts)
api routes/  → route.ts               (app/api/sales/route.ts)
```

### Function naming

```ts
// Services: verb + noun
getSalesByShift(), createSale(), assignExecutor(), calculateCommission()

// Hooks
useAuth(), useShift(), useDebounce()

// Event handlers
handleSubmit(), handleDelete(), handleAssignExecutor()
```

### TypeScript

- No `any` — ever
- All parameters and return types explicitly typed
- `type` for unions/intersections, `interface` for object shapes
- All types exported from `/types/models.ts`

### Import order

```ts
// 1. React / Next
import { useState } from 'react'

// 2. Third-party
import { z } from 'zod'
import { toast } from 'sonner'

// 3. Internal — absolute @/ paths only
import { Button } from '@/components/ui/button'
import { getSalesByShift } from '@/services/sales.service'
import type { Sale } from '@/types/models'
```

---

## 14. Documentation Standard

### JSDoc — required on all services and API routes

```ts
/**
 * Assigns an employee to a service line and auto-generates their commission.
 * Priority: commissions_employee > commissions_service.
 * Commission base: always unit_price, never discounted price.
 *
 * @param saleDetailId - UUID of the sale_detail to assign
 * @param userId - UUID of the employee who performed the service
 * @throws {Error} If sale_detail not found or already assigned
 * @returns Updated sale_detail with generated commission
 */
export async function assignExecutor(saleDetailId: string, userId: string) {}
```

### After every session

- Frontend changes → update `/docs/FRONTEND.md`
- Backend changes → update `/docs/BACKEND.md`
- See ANTIGRAVITY.md for the exact format required

---

## 15. Security Rules

### Supabase RLS

- RLS ENABLED on every table — no exceptions
- All policies filter by `company_id` matching the authenticated user's company
- Never disable RLS — use admin client in server-side routes instead

### Environment variables

```env
# Public (browser-safe)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=

# Private (server only — never in client code)
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
```

- `SUPABASE_SERVICE_ROLE_KEY` imported ONLY in `/lib/supabase/admin.ts`
- Never trust `company_id` from request body — always read from server session
- Validate all inputs with Zod before any DB operation
- Sensitive operations (commissions, payments, reports) go through API routes only

---

*WashTimePOS — Project Documentation v1.1*
*Updated to reflect actual installed stack: Next.js 15, Tailwind 4, shadcn/ui, Sonner.*
*Update this file whenever a significant architectural decision changes.*

---

## 16. Testing

### Stack

- **Vitest** — test runner (faster than Jest, native TypeScript support)
- **Supertest** — HTTP assertions for API routes
- **@supabase/supabase-js mock** — mock Supabase client to avoid real DB calls in tests

### Folder structure

```
tests/
├── setup.ts                  ← Global setup: env vars, Supabase mock
├── helpers/
│   ├── auth.helper.ts        ← Generate mock session tokens per role
│   └── db.helper.ts          ← Factory functions for test data
└── api/
    ├── sales.test.ts
    ├── shifts.test.ts
    ├── commissions.test.ts
    ├── employees.test.ts
    ├── inventory.test.ts
    ├── promotions.test.ts
    ├── costs.test.ts
    ├── attendance.test.ts
    └── reports.test.ts
```

### Coverage required per endpoint

Every endpoint must have tests for all three categories:

**1. Happy path** — request succeeds

- Correct status code (200 or 201)
- Response body matches expected shape
- DB operation was called with correct parameters

**2. Auth & authorization failures**

- No session → 401
- Wrong role → 403 (e.g. CASHIER calling an ADMIN-only route)
- Cross-company attempt → 403 (user from company A trying to access company B data)

**3. Edge cases & validation**

- Missing required fields → 422 with field errors
- Invalid types (string where int expected) → 422
- Business rule violations (e.g. opening a shift when one is already open) → 400
- Non-existent resource (sale not found) → 404

### Test file pattern

```ts
// tests/api/sales.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockSession } from '../helpers/auth.helper'
import { createSaleFactory } from '../helpers/db.helper'

describe('POST /api/sales', () => {

  describe('Happy path', () => {
    it('creates a sale and returns 201 with sale data', async () => {
      // arrange
      // act
      // assert
    })

    it('creates inventory movement when product line is included', async () => {})
  })

  describe('Auth & authorization', () => {
    it('returns 401 when no session', async () => {})
    it('returns 403 when role is WASHER', async () => {})
    it('returns 403 when company_id does not match session', async () => {})
  })

  describe('Validation', () => {
    it('returns 422 when vehicle_plate is missing', async () => {})
    it('returns 422 when sale_details is empty', async () => {})
    it('returns 422 when a detail has both service_id and inventory_id', async () => {})
    it('returns 422 when quantity is less than 1', async () => {})
  })

  describe('Business rules', () => {
    it('returns 400 when no shift is open for the company', async () => {})
    it('returns 400 when vehicle does not belong to the company', async () => {})
  })
})
```

### Running tests

```bash
# Run all tests
npx vitest run

# Run in watch mode during development
npx vitest

# Run a specific file
npx vitest run tests/api/sales.test.ts

# Run with coverage report
npx vitest run --coverage
```

### Rules

- Tests live in `/tests/` — never inside `/app/` or alongside source files
- Mock Supabase — never call the real DB in tests
- Every new endpoint must have its test file created in the same session
- If you modify an endpoint, update its test file in the same session
- Tests must pass before considering any backend task complete
- Cross-company tests are mandatory — this is the most critical security check
