import { create } from 'zustand'
import type { ShiftStatus } from '@/types/enums'

export interface ActiveShift {
  id: string
  opened_at: string
  opening_cash: number
  status: ShiftStatus
}

interface ShiftState {
  shift: ActiveShift | null
  setShift: (shift: ActiveShift) => void
  clearShift: () => void
}

export const useShiftStore = create<ShiftState>()((set) => ({
  shift: null,
  setShift: (shift) => set({ shift }),
  clearShift: () => set({ shift: null }),
}))
