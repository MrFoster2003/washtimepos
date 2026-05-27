# WashTimePOS — Frontend Documentation

> This document details the frontend architecture, components, hooks, and stores of the WashTimePOS system.
> Update this file whenever a new frontend module, component, hook, or store is built or modified.

---

## State Management — Zustand Stores

### auth.store.ts

**Path:** `store/auth.store.ts`

Stores the authenticated user session. Populated on login, cleared on logout.

**State:**
```ts
interface AuthState {
  user: SessionUser | null
}

interface SessionUser {
  id: string
  name: string
  role: Role       // ADMIN | SUPERVISOR | CASHIER | WASHER
  company_id: string
}
```

**Actions:**
| Action | Signature | Description |
|---|---|---|
| `setUser` | `(user: SessionUser) => void` | Sets the authenticated user |
| `clearUser` | `() => void` | Clears the user session (logout) |

**Usage:**
```ts
import { useAuthStore } from '@/store/auth.store'
const user = useAuthStore((s) => s.user)
const setUser = useAuthStore((s) => s.setUser)
```

---

### shift.store.ts

**Path:** `store/shift.store.ts`

Stores the current open shift for the company. Null when no shift is open. Blocks POS operations when null.

**State:**
```ts
interface ShiftState {
  shift: ActiveShift | null
}

interface ActiveShift {
  id: string
  opened_at: string
  opening_cash: number
  status: ShiftStatus   // OPEN | CLOSED
}
```

**Actions:**
| Action | Signature | Description |
|---|---|---|
| `setShift` | `(shift: ActiveShift) => void` | Sets the active shift |
| `clearShift` | `() => void` | Clears the shift (on close) |

**Usage:**
```ts
import { useShiftStore } from '@/store/shift.store'
const shift = useShiftStore((s) => s.shift)
```

---

### pos.store.ts

**Path:** `store/pos.store.ts`

Stores the sale being built in the POS screen. Resets completely on sale complete or cancel.

**State:**
```ts
interface PosState {
  vehiclePlate: string | null
  lines: SaleLine[]
  appliedPromotions: Promotion[]
  paymentStatus: PaymentStatus        // 'PENDING' | 'PAID'
  subtotal: number                    // Computed from lines
  totalDiscounts: number              // Computed from appliedPromotions
  total: number                       // Computed: subtotal - totalDiscounts
}

interface SaleLine {
  id: string
  service_id?: string | null
  inventory_id?: string | null
  name: string
  quantity: number
  unit_price: number
}
```

**Business rules:**
- `subtotal`, `totalDiscounts`, and `total` are **computed** — never stored separately
- Discounts: FIXED promotions apply their value directly; PERCENTAGE promotions apply a percentage of subtotal
- Duplicate promotions are rejected (checked by promotion id)
- `resetSale` creates fresh arrays to avoid reference issues
- Line IDs are generated client-side using timestamp + random string

**Actions:**
| Action | Signature | Description |
|---|---|---|
| `setVehicle` | `(plate: string) => void` | Sets vehicle plate for the sale |
| `addLine` | `(line: Omit<SaleLine, 'id'>) => void` | Adds a service or product line |
| `removeLine` | `(id: string) => void` | Removes a line by id |
| `addPromotion` | `(promotion: Promotion) => void` | Applies a promotion (no duplicates) |
| `removePromotion` | `(promotionId: string) => void` | Removes an applied promotion |
| `setPaymentStatus` | `(status: PaymentStatus) => void` | Updates payment status |
| `resetSale` | `() => void` | Resets all state (sale complete/cancel) |

**Usage:**
```ts
import { usePosStore } from '@/store/pos.store'
const subtotal = usePosStore((s) => s.subtotal)
const total = usePosStore((s) => s.total)
const addLine = usePosStore((s) => s.addLine)
```

---

## Base Hooks

### useAuth.ts

**Path:** `hooks/useAuth.ts`

Returns the authenticated user session from `auth.store`. Returns `null` when no user is logged in.

```ts
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const user = useAuth()
  if (!user) return <p>Not logged in</p>
  return <p>{user.name} — {user.role}</p>
}
```

**Returns:** `SessionUser | null`
```ts
{ id: string, name: string, role: Role, company_id: string }
```

---

### useShift.ts

**Path:** `hooks/useShift.ts`

Returns the current open shift from `shift.store`. Returns `null` when no shift is open. Every component that uses this value must handle the `null` case (POS operations are blocked when null).

```ts
import { useShift } from '@/hooks/useShift'

function MyComponent() {
  const shift = useShift()
  if (!shift) return <p>No open shift</p>
  return <p>Shift opened at {shift.opened_at}</p>
}
```

**Returns:** `ActiveShift | null`
```ts
{ id: string, opened_at: string, opening_cash: number, status: ShiftStatus }
```

---

### useDebounce.ts

**Path:** `hooks/useDebounce.ts`

Generic debounce hook used for search inputs and any value that needs rate-limiting. Default delay is 300ms.

```ts
import { useDebounce } from '@/hooks/useDebounce'

function MyComponent() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // debouncedSearch updates 300ms after the last search change
  useEffect(() => {
    fetchResults(debouncedSearch)
  }, [debouncedSearch])
}
```

**Signature:**
| Param | Type | Default | Description |
|---|---|---|---|
| `value` | `T` | required | Value to debounce |
| `delay` | `number` | `300` | Delay in milliseconds |

**Returns:** `T` — the debounced value after the delay has elapsed.

---

## Utilities

### lib/utils.ts

**Path:** `lib/utils.ts`

Contains shared utility functions used across the application.

#### `cn`

Tailwind class merge helper. Provided by shadcn/ui — do not redefine.

```ts
import { cn } from '@/lib/utils'
cn('px-4 py-2', 'bg-blue-500') // merges classes
```

#### `formatCurrency`

Formats a number to Colombian Pesos (COP) using the `es-CO` locale. Rounds to whole pesos (no decimals).

```ts
import { formatCurrency } from '@/lib/utils'

formatCurrency(15000)   // "$ 15.000"
formatCurrency(2500)    // "$ 2.500"
formatCurrency(0)       // "$ 0"
```

| Param | Type | Description |
|---|---|---|
| `amount` | `number` | Amount in COP |

**Returns:** `string`

#### `formatDate`

Formats a date string or Date object to a readable Spanish date (e.g. "15 de marzo de 2026").

```ts
import { formatDate } from '@/lib/utils'

formatDate('2026-03-15')       // "15 de marzo de 2026"
formatDate(new Date())          // "27 de mayo de 2026"
```

| Param | Type | Description |
|---|---|---|
| `date` | `string \| Date` | ISO string or Date object |

**Returns:** `string`

#### `formatDateTime`

Formats a date string or Date object to a readable Spanish date with time (e.g. "15 de marzo de 2026, 02:30 p.m.").

```ts
import { formatDateTime } from '@/lib/utils'

formatDateTime('2026-03-15T14:30:00')  // "15 de marzo de 2026, 02:30 p.m."
```

| Param | Type | Description |
|---|---|---|
| `date` | `string \| Date` | ISO string or Date object |

**Returns:** `string`

---

## Layout Components

### Sidebar

**Path:** `components/layout/Sidebar.tsx`

Role-aware navigation sidebar. Renders only the links allowed for the current user's role using a single `navItems` config array filtered by role.

**Desktop:** Fixed `w-64` sidebar on the left (`hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0`). Uses `bg-sidebar` background.

**Mobile:** Accessible via hamburger button in the `TopBar`. Uses shadcn `Sheet` with `side="left"`. Each nav link is wrapped in `SheetClose` so the sheet closes on navigation.

**Exports:**
| Export | Description |
|---|---|
| `Sidebar` | Desktop fixed sidebar |
| `MobileSidebar` | Sheet-based mobile navigation trigger + content |

**Nav links per role:**

| Admin | Supervisor | Cashier | Washer |
|---|---|---|---|
| Dashboard, Employees, Services, Commissions, Promotions, Inventory, Equipment, Costs, Reports, Config | Dashboard, Employees, Inventory, Equipment, Costs, Reports, Commissions | POS, Shift, Attendance, Sales | Dashboard |

**Behavior:**
- Reads `useAuth()` to get the current user's role
- Filters `navItems` array by `role`
- Highlights active link using `usePathname()` — active when `pathname.startsWith(href)`
- Active style: `bg-primary/10 text-primary`
- Inactive style: `text-muted-foreground hover:bg-muted hover:text-foreground`

---

### TopBar

**Path:** `components/layout/TopBar.tsx`

Fixed top bar displayed across all role-protected pages.

**Layout:** `fixed top-0 right-0 left-0 z-40 h-14 border-b bg-background` with `lg:left-64` to account for the desktop sidebar.

**Sections (left to right):**
1. `MobileSidebar` trigger (hamburger icon, visible only on mobile via `lg:hidden`)
2. "WashTime" branding text (hidden on small screens via `hidden sm:inline`)
3. Vertical `Separator` (hidden on small screens)
4. User name from `useAuth()` (falls back to "Not logged in")
5. Role badge using shadcn `Badge` — variant per role:
   - ADMIN: `default` (primary blue)
   - SUPERVISOR: `secondary`
   - CASHIER / WASHER: `outline`
6. Dark mode toggle using `next-themes` `useTheme()` — Sun/Moon icons with rotation animation

---

### ThemeProvider

**Path:** `components/theme-provider.tsx`

Client component that wraps `next-themes` `ThemeProvider`.

**Configuration:**
```ts
attribute="class"       // Adds 'dark' class to <html>
defaultTheme="system"   // Follows OS preference on first visit
enableSystem            // Reads system preference
disableTransitionOnChange  // Prevents flash on theme switch
```

Used in `app/layout.tsx` as a client boundary wrapping all children.

---

## Custom UI Components

### Stat

**Path:** `components/ui/Stat.tsx`

Dashboard metric card. Built on top of shadcn `Card`.

```tsx
import { Stat } from '@/components/ui/Stat'
import { DollarSign } from 'lucide-react'

<Stat
  label="Today's Revenue"
  value="$ 150.000"
  trend={12.5}
  icon={DollarSign}
/>
```

**Props:**
| Prop | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | yes | Metric description |
| `value` | `string \| number` | yes | Display value (formatted outside) |
| `trend` | `number` | no | Percentage change. Positive → green `TrendingUp` arrow. Negative → red `TrendingDown` arrow. |
| `icon` | `LucideIcon` | no | Icon displayed in a `bg-primary/10` rounded box |

**Rendering:**
- Left: label (text-xs muted), value (text-2xl bold), optional trend with arrow
- Right: optional icon in a `p-2 rounded-lg bg-primary/10 text-primary` container

---

### PageHeader

**Path:** `components/ui/PageHeader.tsx`

Consistent page title block used at the top of every page in the app.

```tsx
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'

<PageHeader
  title="Employees"
  subtitle="Manage your team members"
  action={<Button>New Employee</Button>}
/>
```

**Props:**
| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | yes | Page title (text-xl font-bold) |
| `subtitle` | `string` | no | Description below the title (text-sm muted) |
| `action` | `ReactNode` | no | Action element rendered at the right on desktop, below on mobile |

**Responsive:** On mobile (`sm:` breakpoint), action moves below the title.

---

### ConfirmDialog

**Path:** `components/ui/ConfirmDialog.tsx`

Replaces all uses of `confirm()`, `alert()`, and `prompt()` in the app. Wraps shadcn `Dialog`.

```tsx
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useState } from 'react'

function MyComponent() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete</Button>
      <ConfirmDialog
        open={open}
        onConfirm={() => { /* destructive action */ setOpen(false) }}
        onCancel={() => setOpen(false)}
        title="Delete employee?"
        description="This action cannot be undone. The employee will be deactivated."
        variant="danger"
      />
    </>
  )
}
```

**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `open` | `boolean` | yes | — | Controls dialog visibility |
| `onConfirm` | `() => void` | yes | — | Called when user clicks Confirm |
| `onCancel` | `() => void` | yes | — | Called when user clicks Cancel or closes dialog |
| `title` | `string` | yes | — | Dialog title |
| `description` | `string` | yes | — | Dialog description body |
| `variant` | `'danger' \| 'warning'` | no | `'danger'` | Danger → red `destructive` button. Warning → blue `default` button. |

**Business rule:** Never use `alert()`, `confirm()`, or `prompt()` — always use `ConfirmDialog`.

---

## Login Page

### app/(auth)/login/page.tsx

**Path:** `app/(auth)/login/page.tsx`

Public login page at `/login`. Uses `(auth)` route group to avoid role-specific layouts.

**Form fields:**
| Field | Type | Validation |
|---|---|---|
| Email | `email` | Valid email format via Zod |
| Password | `password` | Required (min 1 char) |

**Flow:**
1. Submit email + password → `supabase.auth.signInWithPassword()`
2. On success: fetch `users` record (joined with `roles`) by `auth.uid()`
3. Store `{ id, name, role, company_id }` in `auth.store` via `setUser()`
4. Redirect based on role: ADMIN → `/admin/dashboard`, SUPERVISOR → `/supervisor/dashboard`, CASHIER → `/cashier/pos`, WASHER → `/employee/dashboard`
5. If `redirectTo` query param exists (set by middleware), it takes priority

**Already logged in:** Redirects to dashboard via `useEffect` on mount if `auth.store` has a user.

**Error handling:** shadcn `Alert variant="destructive"` for invalid credentials, account not found, or Supabase errors.

**Dependencies:** `react-hook-form` + `zod`, `createBrowserClient()`, `useAuthStore`, shadcn `Input`/`Button`/`Alert`.

---

## Unauthorized Page

### app/unauthorized/page.tsx

**Path:** `app/unauthorized/page.tsx`

Simple page shown when a user tries to access a route outside their role. Redirected to by `middleware.ts` when role check fails.

**Behavior:**
- Reads `user` from `auth.store`
- If no user (no session) → redirects to `/login`
- Shows a `ShieldAlert` icon, "Access Denied" title, and a message with the user's current role
- Button "Go to my dashboard" redirects to the correct dashboard based on role:
  - ADMIN → `/admin/dashboard`
  - SUPERVISOR → `/supervisor/dashboard`
  - CASHIER → `/cashier/pos`
  - WASHER → `/employee/dashboard`

**Dependencies:** `useAuthStore`, shadcn `Button`, `Lucide` `ShieldAlert` icon.

---

## Role Layouts

### Shared Layout — RoleLayout

**Path:** `components/layout/RoleLayout.tsx`

Client component used by all four role layouts. Provides a consistent page shell with `TopBar`, `Sidebar`, and a content area.

**Props:**
| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Page content to render inside the layout |
| `allowedRoles` | `Role[]` | Array of roles allowed to access pages under this layout |

**Behavior:**
1. Reads user from `auth.store`
2. No session → redirects to `/login`
3. Role not in `allowedRoles` → redirects to `/unauthorized`
4. Renders `<TopBar />`, `<Sidebar />`, and `<main>` with `pt-14 lg:pl-64` padding for fixed header/sidebar

---

### Admin Layout

**Path:** `app/admin/layout.tsx`

```tsx
<RoleLayout allowedRoles={[Role.ADMIN]}>
```

Allowed roles: **ADMIN** only.

---

### Supervisor Layout

**Path:** `app/supervisor/layout.tsx`

```tsx
<RoleLayout allowedRoles={[Role.ADMIN, Role.SUPERVISOR]}>
```

Allowed roles: **ADMIN**, **SUPERVISOR**.

---

### Cashier Layout

**Path:** `app/cashier/layout.tsx`

```tsx
<RoleLayout allowedRoles={[Role.ADMIN, Role.SUPERVISOR, Role.CASHIER]}>
```

Allowed roles: **ADMIN**, **SUPERVISOR**, **CASHIER**.

---

### Employee Layout

**Path:** `app/employee/layout.tsx`

```tsx
<RoleLayout allowedRoles={[Role.ADMIN, Role.SUPERVISOR, Role.CASHIER, Role.WASHER]}>
```

Allowed roles: **all roles**.

---

### Root Page

**Path:** `app/page.tsx`

Client component that never renders UI — always redirects:
- No session → `/login`
- Session exists → dashboard based on role (`/admin/dashboard`, `/supervisor/dashboard`, `/cashier/pos`, `/employee/dashboard`)
