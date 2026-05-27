import { useShiftStore } from '@/store/shift.store'
import type { ActiveShift } from '@/store/shift.store'

export function useShift(): ActiveShift | null {
  const shift = useShiftStore((s) => s.shift)
  return shift
}
