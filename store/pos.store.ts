import { create } from 'zustand'
import type { Promotion } from '@/types/models'
import { ValueType } from '@/types/enums'

export interface SaleLine {
  id: string
  service_id?: string | null
  inventory_id?: string | null
  name: string
  quantity: number
  unit_price: number
}

export type PaymentStatus = 'PENDING' | 'PAID'

interface PosState {
  vehiclePlate: string | null
  lines: SaleLine[]
  appliedPromotions: Promotion[]
  paymentStatus: PaymentStatus
  subtotal: number
  totalDiscounts: number
  total: number
  setVehicle: (plate: string) => void
  addLine: (line: Omit<SaleLine, 'id'>) => void
  removeLine: (id: string) => void
  addPromotion: (promotion: Promotion) => void
  removePromotion: (promotionId: string) => void
  setPaymentStatus: (status: PaymentStatus) => void
  resetSale: () => void
}

const getInitialState = () => ({
  vehiclePlate: null as string | null,
  lines: [] as SaleLine[],
  appliedPromotions: [] as Promotion[],
  paymentStatus: 'PENDING' as PaymentStatus,
})

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`

export const usePosStore = create<PosState>()((set, get) => ({
  ...getInitialState(),

  get subtotal() {
    return get().lines.reduce(
      (sum, line) => sum + line.quantity * line.unit_price,
      0,
    )
  },

  get totalDiscounts() {
    const subtotal = get().subtotal
    return get().appliedPromotions.reduce((sum, promo) => {
      if (promo.value_type === ValueType.FIXED) return sum + promo.value
      return sum + subtotal * (promo.value / 100)
    }, 0)
  },

  get total() {
    return get().subtotal - get().totalDiscounts
  },

  setVehicle: (plate) => set({ vehiclePlate: plate }),

  addLine: (line) =>
    set({
      lines: [...get().lines, { ...line, id: generateId() }],
    }),

  removeLine: (id) =>
    set({
      lines: get().lines.filter((l) => l.id !== id),
    }),

  addPromotion: (promotion) => {
    const exists = get().appliedPromotions.some((p) => p.id === promotion.id)
    if (!exists) {
      set({ appliedPromotions: [...get().appliedPromotions, promotion] })
    }
  },

  removePromotion: (promotionId) =>
    set({
      appliedPromotions: get().appliedPromotions.filter((p) => p.id !== promotionId),
    }),

  setPaymentStatus: (status) => set({ paymentStatus: status }),

  resetSale: () => set(getInitialState()),
}))
