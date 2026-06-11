import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { openShiftSchema } from '@/lib/validations/shift.schema'
import { Role, ShiftStatus } from '@/types/enums'

export const runtime = 'nodejs'

/**
 * Opens a new shift for the authenticated user's company.
 * Validates that no OPEN shift already exists before creating.
 *
 * @returns 201 with shift data on success
 * @throws 401 if no session
 * @throws 403 if role is below CASHIER
 * @throws 422 if opening_cash is invalid
 * @throws 400 if an OPEN shift already exists
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
  const parsed = openShiftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('shifts')
    .select('id')
    .eq('company_id', user.company_id)
    .eq('status', ShiftStatus.OPEN)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An open shift already exists' }, { status: 400 })
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      company_id: user.company_id,
      opened_by: user.id,
      status: ShiftStatus.OPEN,
      opening_cash: parsed.data.opening_cash,
      total_cash: 0,
      total_digital: 0,
      total_sales: 0,
      total_services: 0,
      total_unassigned: 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: shift }, { status: 201 })
}
