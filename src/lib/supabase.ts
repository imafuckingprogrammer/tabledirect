import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Use configuration helper
const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to create unique channel names
export const createChannelName = (type: string, id: string) => {
  return `${type}_${id}_${Date.now()}`;
};

// Helper function to safely remove channels
export const removeChannel = (channelName: string) => {
  try {
    const channel = supabase.channel(channelName);
    return supabase.removeChannel(channel);
  } catch (error) {
    console.warn('Failed to remove channel:', channelName, error);
    return Promise.resolve();
  }
};

// Database helper functions
export const dbHelpers = {
  // Orders
  async claimOrder(orderId: string, sessionId: string) {
    const { data, error } = await supabase.rpc('claim_order', {
      order_uuid: orderId,
      session_uuid: sessionId
    });
    
    if (error) throw error;
    return data;
  },

  async releaseOrder(orderId: string, sessionId: string) {
    const { data, error } = await supabase.rpc('release_order', {
      order_uuid: orderId,
      session_uuid: sessionId
    });
    
    if (error) throw error;
    return data;
  },

  // Session management
  async createSession(userId: string, restaurantId: string, userName: string, stationId?: string) {
    const sessionToken = `session_${userId}_${Date.now()}`;
    
    const { data, error } = await supabase
      .from('active_sessions')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        station_id: stationId,
        session_token: sessionToken,
        user_name: userName,
        status: 'active',
        device_info: {
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSessionHeartbeat(sessionId: string) {
    const { error } = await supabase
      .from('active_sessions')
      .update({ 
        last_seen: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async endSession(sessionId: string) {
    // Release any claimed orders first
    await supabase
      .from('orders')
      .update({ 
        claimed_by: null, 
        claimed_at: null,
        status: 'pending'
      })
      .eq('claimed_by', sessionId);

    // Delete session
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Menu helpers
  async getMenuWithItems(restaurantId: string) {
    const { data, error } = await supabase
      .from('menu_categories')
      .select(`
        *,
        menu_items (
          *
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .eq('menu_items.is_available', true)
      .order('sort_order')
      .order('sort_order', { foreignTable: 'menu_items' });

    if (error) throw error;
    return data;
  },

  // Order helpers
  async getOrdersWithDetails(restaurantId: string, statuses?: string[]) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        table:restaurant_tables(*),
        order_items(
          *,
          menu_item:menu_items(*)
        ),
        claimed_session:active_sessions(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createOrder(orderData: {
    restaurant_id: string;
    table_id: string;
    order_number: string;
    total_amount: number;
    special_instructions?: string;
    customer_name?: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      unit_price: number;
      special_instructions?: string;
    }>;
  }) {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: orderData.restaurant_id,
        table_id: orderData.table_id,
        order_number: orderData.order_number,
        total_amount: orderData.total_amount,
        special_instructions: orderData.special_instructions,
        customer_name: orderData.customer_name,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      special_instructions: item.special_instructions
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  },

  // Table helpers
  async getTableByToken(token: string) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select(`
        *,
        restaurant:restaurants(*)
      `)
      .or(`qr_token.eq.${token},token.eq.${token}`)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  },

  // Staff helpers
  async getStaffRole(userId: string, restaurantId: string) {
    const { data, error } = await supabase
      .from('restaurant_staff')
      .select('*')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  }
};

export default supabase; 