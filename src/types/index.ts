export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'customer';
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  category?: Category;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  image_url?: string;
  is_available: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  preparation_time: number;
  is_featured: boolean;
  is_low_stock?: boolean;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_item?: MenuItem;
  quantity: number;
  price: number;
  subtotal: number;
  special_instructions?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  user?: User;
  cashier_id?: number;
  cashier?: User;
  customer_name?: string;
  customer_phone?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'cash' | 'card' | 'digital_wallet';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  order_items?: OrderItem[];
  created_at: string;
  completed_at?: string;
}

export interface InventoryLog {
  id: number;
  menu_item_id: number;
  menu_item?: MenuItem;
  change_type: 'addition' | 'deduction' | 'adjustment';
  quantity_change: number;
  old_quantity: number;
  new_quantity: number;
  reason: string;
  user_id?: number;
  user?: User;
  created_at: string;
}

export interface CartItem {
  menu_item_id: number;
  menu_item: MenuItem;
  quantity: number;
  special_instructions?: string;
}

export interface DashboardSummary {
  total_sales: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  average_order_value: number;
  today_sales: number;
  today_orders: number;
}

export interface SalesByDay {
  date: string;
  orders: number;
  sales: number;
}

export interface SalesByCategory {
  category: string;
  quantity: number;
  revenue: number;
}

export interface TopSellingItem {
  id: number;
  name: string;
  category: string;
  total_quantity: number;
  total_revenue: number;
}

export interface OrderTrend {
  date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface PaymentMethod {
  payment_method: string;
  count: number;
  total: number;
}
