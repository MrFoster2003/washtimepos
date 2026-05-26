import {
  Role,
  SaleStatus,
  ShiftStatus,
  MovementType,
  InventoryType,
  PromotionStatus,
  CommissionStatus,
  EquipmentStatus,
  Periodicity,
  PaymentMethod,
  PromotionType,
  ValueType,
  RegistrationType,
} from './enums';

// Re-export all enums for standard importing from @/types/models
export * from './enums';

/**
 * Platform/White-Label Module
 */

export interface Company {
  id: string;
  name: string;
  nit: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  annual_price: number;
  max_users: number | null;
  max_services_month: number | null;
  allows_multishift: boolean;
  allows_reports: boolean;
  allows_operating_costs: boolean;
  allows_promotions: boolean;
  trial_days: number | null;
  active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  periodicity: 'MONTHLY' | 'ANNUAL';
  start_date: string;
  end_date: string;
  trial_end_date: string | null;
  auto_renewal: boolean;
  amount_paid: number;
  currency: string;
  payment_reference: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Users & Access Module
 */

export interface RoleModel {
  id: string;
  name: Role;
  description: string | null;
}

export interface User {
  id: string;
  company_id: string;
  role_id: string;
  name: string;
  phone: string | null;
  email: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Service Catalog Module
 */

export interface VehicleType {
  id: string;
  company_id: string;
  name: string;
  active: boolean;
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  estimated_time_min: number;
  active: boolean;
}

export interface ServiceVehicle {
  id: string;
  service_id: string;
  vehicle_type_id: string;
  price: number;
  active: boolean;
}

/**
 * Commissions Module
 */

export interface CommissionService {
  id: string;
  company_id: string;
  service_id: string;
  value_type: ValueType;
  value: number;
  active: boolean;
}

export interface CommissionEmployee {
  id: string;
  user_id: string;
  service_id: string;
  value_type: ValueType;
  value: number;
  active: boolean;
}

/**
 * Clients & Vehicles Module
 */

export interface Vehicle {
  plate: string;
  company_id: string;
  vehicle_type_id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  engine_cc: number | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Promotions & Discounts Module
 */

export interface Promotion {
  id: string;
  company_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  type: PromotionType;
  value: number;
  value_type: ValueType;
  start_date: string;
  end_date: string | null;
  usage_limit: number | null;
  current_uses: number;
  status: PromotionStatus;
  created_at: string;
  updated_at: string;
}

export interface SalePromotion {
  id: string;
  sale_id: string;
  promotion_id: string;
  amount_discounted: number;
  applied_by: string;
  created_at: string;
}

/**
 * Inventory Module
 */

export interface Equipment {
  id: string;
  company_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  status: EquipmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: string;
  company_id: string;
  name: string;
  active: boolean;
}

export interface Inventory {
  id: string;
  company_id: string;
  category_id: string;
  name: string;
  type: InventoryType;
  unit: string;
  stock: number;
  min_stock: number;
  sale_price: number | null;
  cost_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  company_id: string;
  inventory_id: string;
  type: MovementType;
  quantity: number;
  unit_price: number;
  sale_id: string | null;
  registered_by: string;
  notes: string | null;
  created_at: string;
}

/**
 * POS / Operations Module
 */

export interface Shift {
  id: string;
  company_id: string;
  opened_by: string;
  closed_by: string | null;
  opened_at: string;
  closed_at: string | null;
  status: ShiftStatus;
  opening_cash: number;
  total_cash: number;
  total_digital: number;
  total_sales: number;
  total_services: number;
  total_unassigned: number;
  notes: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  company_id: string;
  shift_id: string;
  vehicle_plate: string;
  vehicle_company: string;
  cashier_id: string;
  subtotal: number;
  total_discounts: number;
  total: number;
  payment_status: SaleStatus;
  created_at: string;
  updated_at: string;
}

export interface SaleDetail {
  id: string;
  sale_id: string;
  service_id: string | null;
  inventory_id: string | null;
  executor_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  assigned: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: PaymentMethod;
  paid_at: string;
  registered_by: string;
}

export interface CommissionGenerated {
  id: string;
  sale_detail_id: string;
  user_id: string;
  calculation_base: number;
  commission_amount: number;
  status: CommissionStatus;
  created_at: string;
}

/**
 * Attendance Module
 */

export interface Attendance {
  id: string;
  company_id: string;
  user_id: string;
  shift_id: string | null;
  date: string;
  check_in: string;
  check_out: string | null;
  minutes_worked: number | null;
  registered_by: string;
  registration_type: RegistrationType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Operating Costs Module
 */

export interface CostCategory {
  id: string;
  company_id: string;
  name: string;
  color: string;
  active: boolean;
}

export interface OperatingCost {
  id: string;
  company_id: string;
  category_id: string;
  description: string;
  amount: number;
  date: string;
  periodicity: Periodicity;
  receipt_url: string | null;
  registered_by: string;
  created_at: string;
  updated_at: string;
}
