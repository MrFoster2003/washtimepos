import { z } from 'zod'

export const openShiftSchema = z.object({
  opening_cash: z.coerce.number().min(0, 'Opening cash must be 0 or greater'),
})

export const closeShiftSchema = z.object({
  notes: z.string().optional(),
})

export type OpenShiftInput = z.infer<typeof openShiftSchema>
export type CloseShiftInput = z.infer<typeof closeShiftSchema>
