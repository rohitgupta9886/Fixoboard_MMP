export type UserRole =
  | 'MAIN_HEAD'
  | 'SALES'
  | 'PRODUCTION'
  | 'PACKING'
  | 'DISPATCH'
  | 'ADMIN'
  | 'OPERATOR';

export interface RoleSummary {
  id: string;
  name: string;
  display_name: string;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  department?: string;
  is_active: boolean;
  roles: (string | RoleSummary)[];
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserSummary;
}

export interface Party {
  id: string;
  party_code: string;
  party_name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  billing_address: string;
  shipping_address: string;
  gst_number?: string;
  payment_terms?: string;
  credit_limit: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  description?: string;
  is_active: boolean;
  category?: ProductCategory;
}

export interface Thickness {
  id: string;
  value_mm: string | number;
  display_label: string;
  is_active: boolean;
}

export interface Density {
  id: string;
  value_g_cm3: string | number;
  display_label: string;
  is_active: boolean;
}

export interface ProductSize {
  id: string;
  length_mm: string | number;
  width_mm: string | number;
  display_label: string;
  is_active: boolean;
}

export interface ProductFinish {
  id: string;
  name: string;
  is_active: boolean;
}

export interface PackingType {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Machine {
  id: string;
  machine_code: string;
  machine_name: string;
  line_name: string;
  machine_type: string;
  rated_capacity_hourly: string | number;
  status: 'AVAILABLE' | 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE';
  location?: string;
  description?: string;
  is_active: boolean;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  thickness_id: string;
  density_id: string;
  size_id?: string;
  finish_id?: string;
  ordered_quantity: number;
  produced_quantity: number;
  packed_quantity: number;
  dispatched_quantity: number;
  unit: string;
  unit_price: number;
  remarks?: string;
  product?: Product;
  thickness?: Thickness;
  density?: Density;
  size?: ProductSize;
  finish?: ProductFinish;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  party_id: string;
  order_source: 'MANUAL' | 'CAT' | 'EMAIL' | 'PHONE' | 'EDI' | 'OTHER';
  customer_po_number?: string;
  order_date: string;
  required_date: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'PARTIALLY_PRODUCTION'
    | 'IN_PRODUCTION'
    | 'PARTIALLY_DISPATCHED'
    | 'COMPLETED';
  remarks?: string;
  attachment_id?: string;
  total_quantity: number;
  approved_by?: string;
  approved_at?: string;
  party?: Party;
  items: SalesOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface ProductionMemo {
  id: string;
  memo_number: string;
  sales_order_id: string;
  sales_order_item_id: string;
  planned_quantity: number;
  priority: string;
  required_date: string;
  target_machine_id?: string;
  production_stage: string;
  status:
    | 'DRAFT'
    | 'APPROVED'
    | 'PLANNED'
    | 'MACHINE_ASSIGNED'
    | 'RELEASED'
    | 'IN_PROGRESS'
    | 'PAUSED'
    | 'COMPLETED'
    | 'CANCELLED';
  remarks?: string;
  sales_order?: SalesOrder;
  sales_order_item?: SalesOrderItem;
  target_machine?: Machine;
  created_at: string;
  updated_at: string;
}

export interface ProductionRun {
  id: string;
  production_memo_id: string;
  machine_id: string;
  operator_id: string;
  shift: string;
  start_time: string;
  end_time?: string;
  planned_quantity: number;
  good_quantity: number;
  rejected_quantity: number;
  waste_kg: number;
  status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  rejection_reason?: string;
  remarks?: string;
  machine?: Machine;
  operator?: UserSummary;
  created_at: string;
}

export interface PackingRecord {
  id: string;
  packing_number: string;
  sales_order_item_id: string;
  production_run_id?: string;
  packing_type_id: string;
  packed_quantity: number;
  package_count: number;
  pieces_per_package?: number;
  packed_by: string;
  packed_at: string;
  status: string;
  remarks?: string;
  sales_order_item?: SalesOrderItem;
  packing_type?: PackingType;
  packer?: UserSummary;
  created_at: string;
}

export interface DispatchItem {
  id: string;
  dispatch_id: string;
  packing_id: string;
  sales_order_item_id: string;
  dispatched_quantity: number;
  package_count: number;
  packing_record?: PackingRecord;
  sales_order_item?: SalesOrderItem;
}

export interface Dispatch {
  id: string;
  dispatch_number: string;
  party_id: string;
  sales_order_id: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone?: string;
  transporter?: string;
  lr_number?: string;
  dispatch_date: string;
  status: 'DRAFT' | 'READY' | 'LOADING' | 'DISPATCHED' | 'CANCELLED';
  remarks?: string;
  verified_by?: string;
  gate_out_time?: string;
  party?: Party;
  sales_order?: SalesOrder;
  verifier?: UserSummary;
  items: DispatchItem[];
  created_at: string;
  updated_at: string;
}

export interface DashboardKpis {
  total_orders: number;
  open_orders: number;
  pending_production_memos: number;
  in_progress_runs: number;
  pending_packing: number;
  ready_for_dispatch: number;
  dispatched_count: number;
  delayed_orders: number;
  today_produced_quantity: number;
  today_waste_kg: number;
}

export interface DemandByParty {
  party_id: string;
  party_name: string;
  party_code: string;
  total_ordered_quantity: number;
  total_produced_quantity: number;
  total_packed_quantity: number;
  total_dispatched_quantity: number;
  pending_quantity: number;
}

export interface DemandByThickness {
  thickness_id: string;
  thickness_value: number;
  display_label: string;
  total_ordered_quantity: number;
  total_produced_quantity: number;
  pending_quantity: number;
}

export interface DemandByDensity {
  density_id: string;
  density_value: number;
  display_label: string;
  total_ordered_quantity: number;
  total_produced_quantity: number;
  pending_quantity: number;
}

export interface LineStatusItem {
  line_id: string;
  name: string;
  machine_code: string;
  machine_type: string;
  status: string;
  order_no?: string;
  party_name?: string;
  product?: string;
  good_output: number | string;
  target: number | string;
  efficiency: number;
  speed?: string;
  operator?: string;
  targetTime?: string;
}

export interface PipelineStageItem {
  id: string;
  label: string;
  count: number;
  description: string;
  color: 'blue' | 'amber' | 'green' | 'orange' | 'purple' | 'cyan' | 'sky' | 'emerald';
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  demand_by_party: DemandByParty[];
  demand_by_thickness: DemandByThickness[];
  demand_by_density: DemandByDensity[];
  line_status?: LineStatusItem[];
  pipeline_stages?: PipelineStageItem[];
  summary?: {
    total_ordered_quantity?: number;
    total_produced_quantity?: number;
    total_dispatched_quantity?: number;
  };
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_name: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  extra_metadata?: any;
  ip_address?: string;
  created_at: string;
  user?: UserSummary;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  message: string;
}

// ==========================================
// AI ORDER SCANNER & DIGITIZATION TYPES
// ==========================================
export type ScannedOrderStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'AI_EXTRACTED'
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'CORRECTED'
  | 'APPROVED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'NEEDS_CLARIFICATION'
  | 'FAILED_PROCESSING';

export interface ScannedOrderItem {
  id?: string;
  scanned_order_id?: string;
  raw_item_text?: string;
  matched_product_id?: string;
  matched_thickness_id?: string;
  matched_density_id?: string;
  product_name: string;
  thickness_label?: string;
  density_label?: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  confidence_score: number;
  is_ambiguous?: boolean;
  ambiguity_options?: string[];
  product?: Product;
  thickness?: Thickness;
  density?: Density;
}

export interface ScannedOrder {
  id: string;
  scan_number: string;
  image_url: string;
  additional_pages?: string[];
  uploaded_by?: string;
  dealer_id?: string;
  status: ScannedOrderStatus;
  overall_confidence: number;
  ai_model_version?: string;
  raw_extracted_text?: string;
  extracted_customer_name?: string;
  extracted_customer_phone?: string;
  extracted_delivery_location?: string;
  extracted_required_date?: string;
  extracted_remarks?: string;
  field_confidence_scores?: Record<string, number>;
  reviewed_by?: string;
  reviewed_at?: string;
  human_corrections_log?: any;
  converted_sales_order_id?: string;
  uploader?: UserSummary;
  dealer?: Party;
  reviewer?: UserSummary;
  converted_sales_order?: SalesOrder;
  items: ScannedOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface ScannedOrderUpdate {
  extracted_customer_name?: string;
  extracted_customer_phone?: string;
  extracted_delivery_location?: string;
  extracted_required_date?: string;
  extracted_remarks?: string;
  dealer_id?: string;
  status?: string;
  human_corrections_log?: any;
  items?: Partial<ScannedOrderItem>[];
}

export interface ScannedOrderApprove {
  party_id: string;
  priority?: string;
  required_date?: string;
  remarks?: string;
}

// ==========================================
// AI SMART PRODUCT ADVISOR TYPES
// ==========================================
export interface ProductRecommendationItem {
  category_code: string;
  product_code: string;
  product_name: string;
  recommended_thickness: string;
  recommended_density: string;
  verified_rationale: string[];
  certifications: string[];
  advantages_vs_plywood: string[];
  estimated_price_range: string;
  match_score: number;
}

export interface AIAdvisorRequest {
  query?: string;
  message?: string;
  session_id?: string;
  context_conversation_id?: string;
  application_type?: string;
  user_phone?: string;
  user_name?: string;
  visitor_name?: string;
  visitor_phone?: string;
  visitor_city?: string;
}

export interface AIAdvisorResponse {
  session_id?: string;
  conversation_id?: string;
  response_text?: string;
  assistant_reply?: string;
  intent?: string;
  matched_products?: ProductRecommendationItem[];
  recommended_products?: ProductRecommendationItem[];
  action_type?: string;
  lead_created?: boolean;
  lead_id?: string;
  requires_human_followup?: boolean;
  safety_disclaimer?: string;
}

