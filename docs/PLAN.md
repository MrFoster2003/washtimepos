# WashTimePOS — Development Plan

---

## FASE 1 — Base técnica
>
> Everything else depends on this. Build it first, touch it last.

### 1. Types & enums

- [x] `types/enums.ts` — All TypeScript enums: Role, SaleStatus, ShiftStatus, MovementType, InventoryType, PromotionStatus, CommissionStatus, EquipmentStatus, Periodicity, PaymentMethod, PromotionType, ValueType, RegistrationType
- [x] `types/models.ts` — App-level types built on top of DB types: Sale, SaleDetail, Employee, Vehicle, Shift, etc.
- [x] `types/database.types.ts` — Auto-generated from Supabase CLI after schema is created

### 2. Supabase clients

- [x] `lib/supabase/client.ts` — Browser client using NEXT_PUBLIC_SUPABASE_ANON_KEY. Used in hooks and client-side services. RLS enforced via user JWT.
- [x] `lib/supabase/admin.ts` — Server-only client using SUPABASE_SERVICE_ROLE_KEY. Imported ONLY in API routes. Bypasses RLS — always filter by company_id manually.

### 3. Auth helper + middleware

- [x] `lib/auth.ts` — getSessionUser(): reads session from request, returns { id, role, company_id, name } or null
- [x] `middleware.ts` — Intercepts every request, checks session and role against route map, redirects to /unauthorized if role does not match

### 4. Zustand stores

- [x] `store/auth.store.ts` — Stores authenticated user: { id, name, role, company_id }. Populated on login, cleared on logout.
- [x] `store/shift.store.ts` — Stores the current open shift: { id, opened_at, opening_cash, status }. Null if no shift is open.
- [x] `store/pos.store.ts` — Stores the sale being built in POS: { vehiclePlate, lines, appliedPromotions, paymentStatus }. Subtotal, totalDiscounts and total are computed — never stored. Resets on sale complete or cancel.

### 5. Base hooks

- [x] `hooks/useAuth.ts` — Returns current user, role and company_id from auth.store
- [x] `hooks/useShift.ts` — Returns current open shift from shift.store. Returns null if no shift is open.
- [x] `hooks/useDebounce.ts` — Generic debounce hook used for search inputs (300ms default)

### 6. Utilities

- [x] `lib/utils.ts` — formatCurrency(amount): formats to COP locale. formatDate(date): formats to readable Spanish date. formatDateTime(date): date + time. cn(): Tailwind class merge helper (already included by shadcn).

### 7. Database schema + seed

- [ ] `supabase/schema.sql` — All 25 tables with correct types, foreign keys, constraints, indexes and RLS policies. Every table has RLS enabled and a policy filtering by company_id matching the authenticated user.
- [ ] `supabase/seed.sql` — Initial data: 4 roles (ADMIN, SUPERVISOR, CASHIER, WASHER), 3 plans (Basic, Pro, Enterprise), 1 test company, 1 test user per role for development.

---

## FASE 2 — Base UI
>
> The shell every page lives inside. Build once, reuse everywhere.

### 8. Layout components

- [ ] `components/layout/Sidebar.tsx` — Role-aware navigation sidebar. Reads role from auth.store and renders only the links allowed for that role. One component handles all roles — no duplicated nav logic.
- [ ] `components/layout/TopBar.tsx` — Fixed top bar with company name, current user name + role badge, and dark mode toggle. Persists dark mode preference in localStorage.

### 9. Custom UI components (on top of shadcn)

- [ ] `components/ui/Stat.tsx` — Dashboard metric card. Props: label, value, trend (number with arrow), icon (LucideIcon). Used on all dashboards.
- [ ] `components/ui/PageHeader.tsx` — Consistent page title block. Props: title, subtitle, optional action button (ReactNode). Used at the top of every page.
- [ ] `components/ui/ConfirmDialog.tsx` — Wraps shadcn Dialog for destructive action confirmations. Props: open, onConfirm, onCancel, title, description, variant (danger or warning). Used for cancel sale, deactivate employee, delete record, etc.

### 10. Login page

- [ ] `app/(auth)/login/page.tsx` — Email + password login form using Supabase Auth. On success: fetches users record, stores session in auth.store, redirects to the correct dashboard based on role.

### 11. Unauthorized page

- [ ] `app/unauthorized/page.tsx` — Simple page shown when a user tries to access a route outside their role. Shows their current role and a button to go back to their dashboard.

### 12. Role layouts

- [ ] `app/admin/layout.tsx` — Admin layout with Sidebar and TopBar. Wraps all /admin/* pages.
- [ ] `app/supervisor/layout.tsx` — Supervisor layout with Sidebar and TopBar. Wraps all /supervisor/* pages.
- [ ] `app/cashier/layout.tsx` — Cashier layout with Sidebar and TopBar. Wraps all /cashier/* pages.
- [ ] `app/employee/layout.tsx` — Employee layout with Sidebar and TopBar. Wraps all /employee/* pages.

---

## FASE 3 — Shifts
>
> First operational module. POS cannot work without an open shift.

### 13. API routes + tests

- [ ] `app/api/shifts/open/route.ts` — POST. Minimum role: CASHIER. Verifies no OPEN shift exists for the company. Records opened_by, opened_at, opening_cash. Returns created shift.
- [ ] `app/api/shifts/close/route.ts` — POST. Minimum role: CASHIER. Computes totals from all sales in the shift. Warns if total_unassigned > 0. Records closed_by, closed_at. Returns closed shift with summary.
- [ ] `tests/api/shifts.test.ts` — Full coverage: happy path, 401/403/cross-company, validation (missing opening_cash), business rules (shift already open, no open shift to close).

### 14. Service

- [ ] `services/shifts.service.ts` — getActiveShift(companyId): returns the current OPEN shift or null. openShift(input): creates new shift record. closeShift(shiftId, userId): computes totals, updates status to CLOSED.

### 15. Schema

- [ ] `lib/validations/shift.schema.ts` — openShiftSchema: { opening_cash: number >= 0 }. closeShiftSchema: { notes?: string }.

### 16. UI

- [ ] `app/cashier/shift/page.tsx` — Shows current shift status. If no shift open: form to open a new one with opening_cash input. If shift open: summary of current totals and button to close. Warns before closing if there are unassigned services.

---

## FASE 4 — Service catalog
>
> Needed before POS so the cashier can select services and their prices.

### 17. Vehicle types API + tests

- [ ] `app/api/vehicle-types/route.ts` — GET (list) + POST (create). Admin only for write.
- [ ] `app/api/vehicle-types/[id]/route.ts` — PATCH + DELETE. Admin only.
- [ ] `tests/api/vehicle-types.test.ts` — Full coverage.

### 18. Services API + tests

- [ ] `app/api/services/route.ts` — GET + POST. Admin only for write.
- [ ] `app/api/services/[id]/route.ts` — PATCH + DELETE. Admin only.
- [ ] `tests/api/services.test.ts` — Full coverage.

### 19. Services per vehicle type API + tests

- [ ] `app/api/services-vehicle/route.ts` — GET + POST. Sets price for a service + vehicle type combination. Admin only for write.
- [ ] `app/api/services-vehicle/[id]/route.ts` — PATCH + DELETE. Admin only.
- [ ] `tests/api/services-vehicle.test.ts` — Full coverage including price = 0 validation.

### 20. Services

- [ ] `services/services.service.ts` — getServices(companyId), createService(input), updateService(id, input), getServicesByVehicleType(vehicleTypeId): returns services with their price for that vehicle type.

### 21. Schemas

- [ ] `lib/validations/service.schema.ts` — createServiceSchema: { name, description?, estimated_time_min }. createServicesVehicleSchema: { service_id, vehicle_type_id, price }.

### 22. UI

- [ ] `app/admin/services/page.tsx` — Two-panel page. Left: list of services with edit/deactivate actions. Right: price matrix showing each service × each vehicle type with editable prices. Uses PageHeader, Table, ConfirmDialog.

---

## FASE 5 — Vehicles
>
> Needed before POS. Every sale is tied to a vehicle plate.

### 23. API + tests

- [ ] `app/api/vehicles/route.ts` — GET (search by plate or list) + POST (create). Minimum role: CASHIER for read and create.
- [ ] `app/api/vehicles/[plate]/route.ts` — GET (single) + PATCH (update). Minimum role: CASHIER.
- [ ] `tests/api/vehicles.test.ts` — Full coverage including duplicate plate in same company, plate format validation, cross-company access.

### 24. Service

- [ ] `services/vehicles.service.ts` — searchVehicle(plate, companyId): searches by plate, returns vehicle with type info or null. createVehicle(input): creates new vehicle record. updateVehicle(plate, input): updates owner or vehicle info.

### 25. Schema

- [ ] `lib/validations/vehicle.schema.ts` — createVehicleSchema: { plate, vehicle_type_id, brand, model, year, color, engine_cc?, owner_name, owner_phone, owner_email? }.

### 26. Component

- [ ] `components/pos/VehicleSearch.tsx` — Search input debounced 300ms. Shows results as dropdown while typing. If found: displays vehicle summary card. If not found: shows "Create new vehicle" option that opens a form modal using VehicleForm.
- [ ] `components/forms/VehicleForm.tsx` — Reusable form for creating/editing a vehicle. Accepts onSubmit as prop.

---

## FASE 6 — POS
>
> The most critical screen in the entire system. Most of the business logic lives here.

### 27. Sale schema

- [ ] `lib/validations/sale.schema.ts` — createSaleSchema: { vehicle_plate, lines: [{ service_id XOR inventory_id, quantity >= 1, unit_price }] }. Either service_id or inventory_id must be set — never both, never neither.

### 28. Create sale API + tests

- [ ] `app/api/sales/route.ts` — POST. Minimum role: CASHIER. Verifies open shift exists. Creates sale header + all detail lines in a transaction. For product lines: auto-creates inventory_movement of type SALE and decrements stock. Returns full sale with details.
- [ ] `tests/api/sales.test.ts` — Happy path (service only, product only, mixed). 401/403/cross-company. Validation (missing plate, empty lines, both ids set, quantity < 1). Business rules (no open shift, vehicle not in company, product not in inventory).

### 29. Payment API + tests

- [ ] `app/api/sales/[id]/payment/route.ts` — POST. Minimum role: CASHIER. Registers payment record. Changes payment_status from PENDING to PAID. Validates shift is still OPEN.
- [ ] `tests/api/sales-payment.test.ts` — Full coverage including paying an already paid sale, paying with closed shift.

### 30. Executor assignment API + tests

- [ ] `app/api/sales/[id]/executor/route.ts` — PATCH. Minimum role: CASHIER. Assigns executor_id to a sale_detail. Auto-calculates and creates commissions_generated record using priority: commissions_employee > commissions_service. Base is always unit_price never discounted price.
- [ ] `tests/api/sales-executor.test.ts` — Full coverage including already assigned line, executor not in same company, commission calculation with both rule types.

### 31. Cancel sale API + tests

- [ ] `app/api/sales/[id]/route.ts` — DELETE (soft delete: sets status to CANCELLED). Minimum role: SUPERVISOR. Reverses inventory movements if sale had product lines. Deletes commissions_generated records for that sale.
- [ ] `tests/api/sales-cancel.test.ts` — Full coverage including CASHIER attempt (403), already cancelled sale, inventory reversal.

### 32. Sales service

- [ ] `services/sales.service.ts` — getSalesByShift(shiftId), createSale(input), registerPayment(saleId, method, amount), assignExecutor(saleDetailId, userId), cancelSale(saleId), getUnassignedLines(shiftId): returns service lines without an executor assigned.

### 33. POS components

- [ ] `components/pos/SaleLineItem.tsx` — Single line in the active sale. Shows service or product name, quantity, unit price, subtotal. For service lines: shows executor badge if assigned or "Pending" badge if not. Has remove button.
- [ ] `components/pos/PaymentPanel.tsx` — Payment method selector (CASH, NEQUI, TRANSFER, OTHER) + amount input + confirm button. Calls registerPayment on confirm. Updates sale status in pos.store.
- [ ] `components/pos/ExecutorAssigner.tsx` — Dropdown to select an employee for a specific service line. Shows only active employees of the company. Calls assignExecutor on select.
- [ ] `components/pos/PromotionSelector.tsx` — Lists active eligible promotions for the current sale. Cashier taps to apply. Shows applied promotions with their discount amount and a remove button.

### 34. POS page

- [ ] `app/cashier/pos/page.tsx` — Main POS screen. Left panel: VehicleSearch + list of SaleLineItems + PromotionSelector + totals summary. Right panel: PaymentPanel + unassigned service lines for executor assignment. Blocks all actions if no shift is open (shows redirect to /cashier/shift).

### 35. Sales list page

- [ ] `app/cashier/sales/page.tsx` — List of all sales in the current shift. Shows status badge (PENDING/PAID/CANCELLED), vehicle plate, total, number of lines, and number of unassigned services. Clicking a sale opens a detail modal.

---

## FASE 7 — Commissions
>
> Rules that determine what each employee earns per service.

### 36. API + tests

- [ ] `app/api/commissions/service/route.ts` — GET + POST. Admin only. Sets base commission rule for a service.
- [ ] `app/api/commissions/service/[id]/route.ts` — PATCH + DELETE. Admin only.
- [ ] `app/api/commissions/employee/route.ts` — GET + POST. Admin only. Sets special agreement for a specific employee on a specific service.
- [ ] `app/api/commissions/employee/[id]/route.ts` — PATCH + DELETE. Admin only.
- [ ] `tests/api/commissions.test.ts` — Full coverage including duplicate rule for same service, employee agreement overriding base rule, PERCENTAGE vs FIXED calculation.

### 37. Service

- [ ] `services/commissions.service.ts` — getCommissionForService(serviceId, companyId): returns base rule. getCommissionForEmployee(userId, serviceId): returns employee agreement or null. calculateCommission(userId, serviceId, unitPrice, quantity, companyId): applies priority logic and returns final commission amount.

### 38. Schema

- [ ] `lib/validations/commission.schema.ts` — createCommissionServiceSchema: { service_id, value_type, value }. createCommissionEmployeeSchema: { user_id, service_id, value_type, value }.

### 39. UI

- [ ] `app/admin/commissions/page.tsx` — Two sections. Top: base commission rules per service (table with service name, value type, value, edit action). Bottom: special employee agreements (table with employee name, service, value type, value, active toggle, edit action).

---

## FASE 8 — Employees & attendance
>
> Managing who works, when they work, and what they earn.

### 40. Employees API + tests

- [ ] `app/api/employees/route.ts` — GET (list) + POST (create). Admin and Supervisor.
- [ ] `app/api/employees/[id]/route.ts` — GET (single) + PATCH (update) + DELETE (deactivate). Admin and Supervisor.
- [ ] `tests/api/employees.test.ts` — Full coverage including duplicate email in same company, deactivating an employee with open commissions, CASHIER attempt (403).

### 41. Attendance API + tests

- [ ] `app/api/attendance/checkin/route.ts` — POST. Minimum role: CASHIER. Creates attendance record with check_in timestamp. Links to current open shift.
- [ ] `app/api/attendance/checkout/route.ts` — POST. Minimum role: CASHIER. Updates attendance record with check_out timestamp. Calculates minutes_worked.
- [ ] `tests/api/attendance.test.ts` — Full coverage including checking out without checking in, double check-in same day, minutes_worked calculation.

### 42. Services

- [ ] `services/employees.service.ts` — getEmployees(companyId), createEmployee(input), updateEmployee(id, input), deactivateEmployee(id).
- [ ] `services/attendance.service.ts` — checkIn(userId, shiftId, registeredBy), checkOut(userId, registeredBy), getAttendanceByDate(date, companyId), getAttendanceByEmployee(userId).

### 43. Schemas

- [ ] `lib/validations/employee.schema.ts` — createEmployeeSchema: { name, email, phone, role_id }.
- [ ] `lib/validations/attendance.schema.ts` — checkInSchema: { user_id }. checkOutSchema: { user_id, notes? }.

### 44. UI — Admin + Supervisor

- [ ] `app/admin/employees/page.tsx` — Employee list with role badge, active status, and actions (edit, deactivate). PageHeader with "New employee" button.
- [ ] `app/admin/employees/new/page.tsx` — Create employee form using EmployeeForm component.
- [ ] `app/admin/employees/[id]/page.tsx` — Edit employee form + commission history table + attendance history table.
- [ ] `app/supervisor/employees/page.tsx` — Same as admin employees page but without delete/deactivate actions.
- [ ] `components/forms/EmployeeForm.tsx` — Reusable form: name, email, phone, role selector.

### 45. UI — Cashier attendance

- [ ] `app/cashier/attendance/page.tsx` — List of active employees with their current status (IN or OUT). Each employee has a Check-in or Check-out button. Cashier registers on behalf of the employee.

### 46. UI — Employee dashboard

- [ ] `app/employee/dashboard/page.tsx` — Personal view. Two tabs: Commissions (list of services performed, amount earned per service, total pending and total paid) and Attendance (check-in/check-out history with hours worked per day).

---

## FASE 9 — Inventory & equipment
>
> Stock control for supplies and sale products. Equipment status registry.

### 47. Inventory API + tests

- [ ] `app/api/inventory/route.ts` — GET (list with current stock) + POST (create item). Admin and Supervisor.
- [ ] `app/api/inventory/[id]/route.ts` — PATCH + DELETE. Admin and Supervisor.
- [ ] `app/api/inventory/movement/route.ts` — POST. Creates manual movement (PURCHASE, USE, ADJUSTMENT). Updates stock accordingly. Minimum role: SUPERVISOR.
- [ ] `tests/api/inventory.test.ts` — Full coverage including stock going negative, low stock alert trigger, SALE movement blocked manually (only auto-created by sales), cross-company access.

### 48. Equipment API + tests

- [ ] `app/api/equipment/route.ts` — GET + POST. Admin and Supervisor.
- [ ] `app/api/equipment/[id]/route.ts` — PATCH + DELETE. Admin and Supervisor.
- [ ] `tests/api/equipment.test.ts` — Full coverage.

### 49. Services

- [ ] `services/inventory.service.ts` — getInventory(companyId), createItem(input), updateItem(id, input), registerMovement(input), getLowStockItems(companyId): returns items where stock <= min_stock.
- [ ] `services/equipment.service.ts` — getEquipment(companyId), createEquipment(input), updateEquipment(id, input), updateStatus(id, status).

### 50. Schema

- [ ] `lib/validations/inventory.schema.ts` — createInventorySchema: { name, category_id, type, unit, stock, min_stock, sale_price?, cost_price }. createMovementSchema: { inventory_id, type (PURCHASE/USE/ADJUSTMENT only), quantity, notes? }.

### 51. UI — Inventory

- [ ] `app/admin/inventory/page.tsx` — Inventory list with stock level, low stock alert badge, type badge (SUPPLY/SALE_PRODUCT). Actions: edit, register movement, deactivate. PageHeader with "New item" button and category filter.
- [ ] `app/supervisor/inventory/page.tsx` — Same as admin inventory.
- [ ] `components/forms/InventoryItemForm.tsx` — Reusable form for creating/editing inventory items.

### 52. UI — Equipment

- [ ] `app/admin/equipment/page.tsx` — Equipment list with status badge (ACTIVE/MAINTENANCE/INACTIVE). Actions: edit status, edit details. PageHeader with "New equipment" button.
- [ ] `app/supervisor/equipment/page.tsx` — Same as admin equipment but view-only status change.

---

## FASE 10 — Promotions
>
> Time-limited, usage-limited, or manually disabled discounts applied at invoice level.

### 53. API + tests

- [ ] `app/api/promotions/route.ts` — GET (active only for POS, all for admin) + POST. Admin only for write.
- [ ] `app/api/promotions/[id]/route.ts` — PATCH (edit or disable) + DELETE. Admin only.
- [ ] `app/api/promotions/eligible/route.ts` — GET. Returns promotions eligible for a given sale total and date. Used by POS before showing options. Minimum role: CASHIER.
- [ ] `tests/api/promotions.test.ts` — Full coverage including expired by date, depleted by usage, manually disabled, eligibility check with edge dates.

### 54. Service

- [ ] `services/promotions.service.ts` — getPromotions(companyId), createPromotion(input), updatePromotion(id, input), disablePromotion(id), getEligiblePromotions(companyId, date): returns only ACTIVE promotions that pass all three expiry checks. incrementUses(id): called when a promotion is applied to a sale.

### 55. Schema

- [ ] `lib/validations/promotion.schema.ts` — createPromotionSchema: { name, description?, type, value, value_type, service_id?, start_date, end_date?, usage_limit? }.

### 56. UI

- [ ] `app/admin/promotions/page.tsx` — Promotions list with status badge, type, value, usage counter (current/limit), and expiry date. Actions: edit, disable, delete. PageHeader with "New promotion" button.
- [ ] `components/forms/PromotionForm.tsx` — Reusable form: name, type selector, value + value_type, date range picker, usage limit, optional service selector.

---

## FASE 11 — Operating costs
>
> Monthly and one-time expense tracking for P&L reporting.

### 57. API + tests

- [ ] `app/api/costs/route.ts` — GET (list with filters by month/category) + POST. Admin and Supervisor.
- [ ] `app/api/costs/[id]/route.ts` — PATCH + DELETE. Admin and Supervisor.
- [ ] `app/api/costs/categories/route.ts` — GET + POST. Admin only for write.
- [ ] `tests/api/costs.test.ts` — Full coverage including amount = 0 validation, category not in same company, CASHIER attempt (403).

### 58. Service

- [ ] `services/costs.service.ts` — getCosts(companyId, filters): supports filter by month and category. createCost(input), updateCost(id, input), deleteCost(id), getCategories(companyId), getTotalByPeriod(companyId, from, to): returns total expenses grouped by category for a date range.

### 59. Schema

- [ ] `lib/validations/cost.schema.ts` — createCostSchema: { category_id, description, amount > 0, date, periodicity, receipt_url? }.

### 60. UI

- [ ] `app/admin/costs/page.tsx` — Costs list filtered by month (default current month). Shows category badge, description, amount, date, periodicity label. Summary row at bottom with total. Actions: edit, delete. PageHeader with "New cost" button and month selector.
- [ ] `app/supervisor/costs/page.tsx` — Same as admin costs.

---

## FASE 12 — Reports & dashboards
>
> Analytics and metrics. Built last because they depend on all other modules.

### 61. Reports API + tests

- [ ] `app/api/reports/sales/route.ts` — GET. Returns sales summary grouped by day/week/month. Filters: date range, cashier. Admin and Supervisor.
- [ ] `app/api/reports/commissions/route.ts` — GET. Returns commissions grouped by employee. Filters: date range, employee. Admin and Supervisor.
- [ ] `app/api/reports/costs/route.ts` — GET. Returns costs grouped by category. Filters: date range. Admin and Supervisor.
- [ ] `app/api/reports/pl/route.ts` — GET. Returns P&L: total income (sales) minus total costs by period. Admin and Supervisor.
- [ ] `tests/api/reports.test.ts` — Full coverage including empty period, CASHIER attempt (403), cross-company data isolation.

### 62. Service

- [ ] `services/reports.service.ts` — getSalesReport(companyId, from, to), getCommissionsReport(companyId, from, to), getCostsReport(companyId, from, to), getPLReport(companyId, from, to): returns { income, costs, profit, margin }.

### 63. Admin dashboard

- [ ] `app/admin/dashboard/page.tsx` — 4 Stat cards: today's revenue, services performed today, open commissions pending payment, low stock alerts. Sales chart for last 30 days. Top employees by commissions this month. Quick links to shift status and unassigned services.

### 64. Supervisor dashboard

- [ ] `app/supervisor/dashboard/page.tsx` — Current shift summary: shift status, services performed, cash collected, pending payments, unassigned services count. Employee attendance status (who is IN right now).

### 65. Reports pages

- [ ] `app/admin/reports/page.tsx` — Tabbed page: Sales tab (table + chart by period), Commissions tab (per employee breakdown), Costs tab (by category), P&L tab (income vs costs with profit margin).
- [ ] `app/supervisor/reports/page.tsx` — Same as admin reports.

---

## FASE 13 — Configuration
>
> Company settings. Last because it has no dependencies.

### 66. API + tests

- [ ] `app/api/config/route.ts` — GET (company info) + PATCH (update name, logo, contact info). Admin only.
- [ ] `tests/api/config.test.ts` — Full coverage including SUPERVISOR attempt (403), invalid logo URL.

### 67. UI

- [ ] `app/admin/config/page.tsx` — Company settings form: name, NIT, email, phone, logo upload. Uses Card layout with PageHeader. Save button with ConfirmDialog for destructive changes.

---

*WashTimePOS — Development Plan v1.0*
*Follow phases in order. Each phase depends on the previous one.*
