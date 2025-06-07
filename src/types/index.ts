export type UserRole = 'owner' | 'manager' | 'chef' | 'server' | 'host';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type ItemStatus = 'pending' | 'preparing' | 'ready';
export type SessionStatus = 'active' | 'busy' | 'break' | 'offline';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  subscription_status: SubscriptionStatus;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantStaff {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  is_active: boolean;
  permissions: Record<string, any>;
  created_at: string;
}

export interface KitchenStation {
  id: string;
  restaurant_id: string;
  station_name: string;
  station_type: string;
  is_active: boolean;
  position_order: number;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  restaurant_id: string;
  station_id?: string;
  station?: string;
  session_token: string;
  user_name?: string;
  status: SessionStatus;
  device_info?: Record<string, any>;
  last_seen: string;
  last_heartbeat?: string;
  created_at: string;
}

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: number;
  qr_token: string;
  token?: string; // Optional for compatibility with existing code
  seats?: number; // Optional since this is a new field
  location?: string; // Optional
  is_active: boolean;
  created_at: string;
  restaurant?: Restaurant;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  sort_order: number;
  preferred_station_id?: string;
  preparation_time_minutes: number;
  preparation_time?: number;
  allergens?: string[] | null; // Can be null from database
  created_at: string;
  updated_at: string;
  category?: MenuCategory;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  special_instructions?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  claimed_by?: string;
  claimed_at?: string;
  priority: number;
  estimated_time_minutes: number;
  assigned_station_id?: string;
  created_at: string;
  updated_at: string;
  table?: RestaurantTable;
  order_items?: OrderItem[];
  claimed_session?: ActiveSession;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  price: number;
  special_instructions?: string;
  item_status: ItemStatus;
  status?: string;
  claimed_by_user_id?: string;
  claimed_by?: { email: string };
  claimed_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  menu_item?: MenuItem;
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  special_instructions?: string;
  subtotal: number;
}

export interface KitchenOrderView extends Order {
  age_minutes: number;
  is_new: boolean;
  can_claim: boolean;
  is_claimed_by_me: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// Real-time subscription types
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  schema: string;
  table: string;
}

// Context types
export interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<ApiResponse>;
  signUp: (email: string, password: string, userData?: any) => Promise<ApiResponse>;
  signOut: () => Promise<void>;
  userRole?: UserRole;
  restaurantId?: string;
  activeSession?: ActiveSession;
  createKitchenSession?: (userName: string, stationId?: string) => Promise<(() => void) | null>;
  endKitchenSession?: () => Promise<void>;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

// Component prop types
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting';
  className?: string;
}

// Kitchen interface specific types
export interface KitchenColumn {
  title: string;
  status: OrderStatus;
  orders: KitchenOrderView[];
  canClaim?: boolean;
}

export interface SoundSettings {
  enabled: boolean;
  newOrderVolume: number;
  statusChangeVolume: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  restaurantName: string;
  ownerName: string;
}

export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url?: string;
  preparation_time_minutes: number;
  preferred_station_id?: string;
  allergens?: string[];
}

export interface OrderFormData {
  customer_name?: string;
  special_instructions?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    special_instructions?: string;
  }>;
}

// Utility types
export interface QRCodeData {
  restaurant_id: string;
  table_id: string;
  qr_token: string;
}

export interface NotificationData {
  id: string;
  type: 'new_order' | 'status_change' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
} 