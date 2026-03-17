export type TableStatus = "available" | "occupied" | "reserved";
export type MenuCategory = "food" | "drink";
export type SessionStatus = "active" | "completed" | "reserved" | "cancelled";

export interface BilliardTable {
  id: number;
  number: number;
  status: TableStatus;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  category: MenuCategory;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = "cash" | "qris" | "bank_transfer" | "e_wallet";

export interface Session {
  id: number;
  table_id: number;
  client_id: number;
  start_time: string | null;
  end_time: string | null;
  reserved_start: string | null;
  reserved_end: string | null;
  status: SessionStatus;
  table_cost: number;
  total_cost: number;
  payment_method: string | null;
  table: BilliardTable;
  client: Client;
  orders: Order[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  session_id: number | null;
  customer_name: string | null;
  payment_method: string | null;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  menu_item: MenuItem;
  created_at: string;
}

export interface DashboardSummary {
  total_tables: number;
  available_tables: number;
  occupied_tables: number;
  reserved_tables: number;
  active_sessions: number;
  today_revenue: number;
}

export interface FinancialSummary {
  total_revenue: number;
  table_revenue: number;
  fnb_revenue: number;
  pb1_tax: number;
  net_revenue: number;
  order_count: number;
  session_count: number;
}

export interface FinancialPeriodData {
  period: string;
  summary: FinancialSummary;
}

export interface FinancialReport {
  overall: FinancialSummary;
  periods: FinancialPeriodData[];
}

export type FinancialPeriod = "day" | "week" | "month" | "year" | "all";

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
}

export interface EODReport {
  date: string;
  total_transactions: number;
  total_revenue: number;
  table_revenue: number;
  fnb_revenue: number;
  pb1_tax: number;
  net_revenue: number;
  session_count: number;
  standalone_order_count: number;
  payment_breakdown: PaymentMethodBreakdown[];
}

export type UserRole = "owner" | "worker";

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
