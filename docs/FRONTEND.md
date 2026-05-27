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
