import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { closeShiftSchema } from '@/lib/validations/shift.schema'
import { Role, ShiftStatus } from '@/types/enums'

export const runtime = 'nodejs'

/**
 * Closes the currently OPEN shift for the authenticated user's company.
 * Computes and stores sales totals, service count, unassigned count,
 * and payment breakdown (cash vs digital).
 *
 * @returns 200 with closed shift data on success
 * @throws 401 if no session
 * @throws 403 if role is below CASHIER
 * @throws 422 if body is invalid
 * @throws 404 if no OPEN shift exists
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedRoles: Role[] = [Role.CASHIER, Role.SUPERVISOR, Role.ADMIN]
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = closeShiftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = createAdminClient()

  const { data: shift, error: findError } = await supabase
    .from('shifts')
    .select('id')
    .eq('company_id', user.company_id)
    .eq('status', ShiftStatus.OPEN)
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (!shift) {
    return NextResponse.json({ error: 'No open shift found' }, { status: 404 })
  }

  const { data: sales } = await supabase
    .from('sales')
    .select('id, total')
    .eq('shift_id', shift.id)

  const saleIds = sales?.map(s => s.id) ?? []

  let total_sales = 0
  let total_services = 0
  let total_unassigned = 0
  let total_cash = 0
  let total_digital = 0

  if (saleIds.length > 0) {
    total_sales = sales!.reduce((sum, s) => sum + Number(s.total), 0)

    const { data: details } = await supabase
      .from('sale_details')
      .select('id, service_id, assigned')
      .in('sale_id', saleIds)

    if (details) {
      total_services = details.filter(d => d.service_id !== null).length
      total_unassigned = details.filter(d => d.assigned === false).length
    }

    const { data: payments } = await supabase
      .from('payments')
      .select('payment_method, amount')
      .in('sale_id', saleIds)

    if (payments) {
      for (const p of payments) {
        if (p.payment_method === 'CASH') {
          total_cash += Number(p.amount)
        } else {
          total_digital += Number(p.amount)
        }
      }
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('shifts')
    .update({
      status: ShiftStatus.CLOSED,
      closed_at: new Date().toISOString(),
      closed_by: user.id,
      total_sales,
      total_services,
      total_unassigned,
      total_cash,
      total_digital,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', shift.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ data: updated }, { status: 200 })
}
