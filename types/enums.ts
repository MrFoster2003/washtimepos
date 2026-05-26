/**
 * WashTimePOS TypeScript Enums
 * Matches exactly database CHECK constraints.
 */

export enum Role {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  CASHIER = 'CASHIER',
  WASHER = 'WASHER',
}

export enum SaleStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum MovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  USE = 'USE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum InventoryType {
  SUPPLY = 'SUPPLY',
  SALE_PRODUCT = 'SALE_PRODUCT',
}

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  DEPLETED = 'DEPLETED',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum EquipmentStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

export enum Periodicity {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
}

export enum PaymentMethod {
  CASH = 'CASH',
  NEQUI = 'NEQUI',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export enum PromotionType {
  COMBO = 'COMBO',
  SERVICE_DISCOUNT = 'SERVICE_DISCOUNT',
  INVOICE_DISCOUNT = 'INVOICE_DISCOUNT',
}

export enum ValueType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum RegistrationType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}
