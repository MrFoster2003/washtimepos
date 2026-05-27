import { createBrowserClient } from '@/lib/supabase/client'
import { ShiftStatus } from '@/types/enums'
import type { Shift } from '@/types/models'

/**
 * Retrieves the currently OPEN shift for a company, or null if none exists.
 * Called on every POS page load to verify operations are allowed.
 *
 * @param companyId - The company UUID
 * @returns The active shift or null
 */
export async function getActiveShift(companyId: string): Promise<Shift | null> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', ShiftStatus.OPEN)
    .maybeSingle()

  if (error) {
    throw new Error(`[getActiveShift] ${error.message}`)
  }

  return data as Shift | null
}

/**
 * Creates a new shift record after verifying no OPEN shift exists.
 *
 * @param input - Shift creation payload (company_id, opened_by, opening_cash)
 * @returns The created shift
 * @throws If an OPEN shift already exists for the company
 */
export async function openShift(input: {
  company_id: string
  opened_by: string
  opening_cash: number
}): Promise<Shift> {
  const supabase = createBrowserClient()

  const { data: existing } = await supabase
    .from('shifts')
    .select('id')
    .eq('company_id', input.company_id)
    .eq('status', ShiftStatus.OPEN)
    .maybeSingle()

  if (existing) {
    throw new Error('An open shift already exists for this company')
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      company_id: input.company_id,
      opened_by: input.opened_by,
      status: ShiftStatus.OPEN,
      opening_cash: input.opening_cash,
      total_cash: 0,
      total_digital: 0,
      total_sales: 0,
      total_services: 0,
      total_unassigned: 0,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`[openShift] ${error.message}`)
  }

  return shift as Shift
}

/**
 * Closes the specified shift by computing totals from all associated sales,
 * service counts, unassigned lines, and payment breakdown.
 *
 * All monetary totals are computed server-side from DB data — never trusted from client input.
 *
 * @param shiftId - UUID of the shift to close
 * @param userId - UUID of the user closing the shift
 * @param notes - Optional closing notes
 * @returns The updated shift with computed totals
 * @throws If the shift does not exist or is already closed
 */
export async function closeShift(
  shiftId: string,
  userId: string,
  notes?: string
): Promise<Shift> {
  const supabase = createBrowserClient()

  const { data: shift, error: findError } = await supabase
    .from('shifts')
    .select('id, status')
    .eq('id', shiftId)
    .single()

  if (findError || !shift) {
    throw new Error('Shift not found')
  }

  if (shift.status === ShiftStatus.CLOSED) {
    throw new Error('Shift is already closed')
  }

  const { data: sales } = await supabase
    .from('sales')
    .select('id, total')
    .eq('shift_id', shiftId)

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
      closed_by: userId,
      total_sales,
      total_services,
      total_unassigned,
      total_cash,
      total_digital,
      notes: notes ?? null,
    })
    .eq('id', shiftId)
    .select()
    .single()

  if (updateError) {
    throw new Error(`[closeShift] ${updateError.message}`)
  }

  return updated as Shift
}
