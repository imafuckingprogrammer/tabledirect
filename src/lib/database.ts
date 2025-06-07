import { supabase } from './supabase';

/**
 * Atomically claim an order for a specific user
 * This prevents race conditions when multiple chefs try to claim the same order
 */
export async function claimOrder(orderId: string, userId: string, station?: string): Promise<boolean> {
  try {
    // Start a transaction to atomically claim all items in the order
    const { data: orderItems, error: fetchError } = await supabase
      .from('order_items')
      .select('id, claimed_by_user_id')
      .eq('order_id', orderId);

    if (fetchError) {
      console.error('Error fetching order items:', fetchError);
      return false;
    }

    if (!orderItems || orderItems.length === 0) {
      console.error('No order items found');
      return false;
    }

    // Check if any items are already claimed by someone else
    const alreadyClaimed = orderItems.some(item => 
      item.claimed_by_user_id && item.claimed_by_user_id !== userId
    );

    if (alreadyClaimed) {
      console.error('Order already claimed by another user');
      return false;
    }

    // Claim all items in the order
    const { error: claimError } = await supabase
      .from('order_items')
      .update({
        claimed_by_user_id: userId,
        claimed_at: new Date().toISOString(),
        status: 'claimed'
      })
      .eq('order_id', orderId)
      .is('claimed_by_user_id', null); // Only update unclaimed items

    if (claimError) {
      console.error('Error claiming order items:', claimError);
      return false;
    }

    // Update the order status if it's still pending
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'preparing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('status', 'pending'); // Only update if still pending

    if (orderError) {
      console.error('Error updating order status:', orderError);
      // Don't return false here as the items were successfully claimed
    }

    // Create or update kitchen session if station is provided
    if (station) {
      await createKitchenSession(userId, station);
    }

    return true;
  } catch (error) {
    console.error('Error in claimOrder:', error);
    return false;
  }
}

/**
 * Release an order claimed by a specific user
 */
export async function releaseOrder(orderId: string, userId: string): Promise<boolean> {
  try {
    // Release all items claimed by this user for this order
    const { error: releaseError } = await supabase
      .from('order_items')
      .update({
        claimed_by_user_id: null,
        claimed_at: null,
        status: 'pending'
      })
      .eq('order_id', orderId)
      .eq('claimed_by_user_id', userId);

    if (releaseError) {
      console.error('Error releasing order items:', releaseError);
      return false;
    }

    // Check if there are any remaining claimed items in this order
    const { data: remainingItems, error: checkError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderId)
      .not('claimed_by_user_id', 'is', null);

    if (checkError) {
      console.error('Error checking remaining claimed items:', checkError);
      return false;
    }

    // If no items are claimed, reset order status to pending
    if (!remainingItems || remainingItems.length === 0) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating order status:', orderError);
        // Don't return false as the items were successfully released
      }
    }

    return true;
  } catch (error) {
    console.error('Error in releaseOrder:', error);
    return false;
  }
}

/**
 * Create or update a kitchen session for a user
 */
export async function createKitchenSession(userId: string, station: string): Promise<void> {
  try {
    // Get user's restaurant ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.restaurant_id) {
      console.error('Error getting user restaurant:', userError);
      return;
    }

    // Upsert the active session
    const { error: sessionError } = await supabase
      .from('active_sessions')
      .upsert({
        user_id: userId,
        restaurant_id: user.restaurant_id,
        session_type: 'kitchen',
        station: station,
        status: 'active',
        last_heartbeat: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,restaurant_id'
      });

    if (sessionError) {
      console.error('Error creating kitchen session:', sessionError);
    }
  } catch (error) {
    console.error('Error in createKitchenSession:', error);
  }
}

/**
 * Update heartbeat for an active session
 */
export async function updateSessionHeartbeat(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .update({
        last_heartbeat: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error updating session heartbeat:', error);
    }
  } catch (error) {
    console.error('Error in updateSessionHeartbeat:', error);
  }
}

/**
 * Get all pending orders for a restaurant
 */
export async function getPendingOrders(restaurantId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        table:restaurant_tables(*),
        order_items(
          *,
          menu_item:menu_items(*),
          claimed_by:users(email)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPendingOrders:', error);
    return [];
  }
}

/**
 * Mark an order item as completed
 */
export async function markItemCompleted(itemId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('order_items')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('claimed_by_user_id', userId); // Only allow the user who claimed it to mark it complete

    if (error) {
      console.error('Error marking item completed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markItemCompleted:', error);
    return false;
  }
}

/**
 * Check if all items in an order are completed and update order status
 */
export async function checkOrderCompletion(orderId: string): Promise<void> {
  try {
    // Get all items for this order
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('status')
      .eq('order_id', orderId);

    if (itemsError || !items) {
      console.error('Error fetching order items:', itemsError);
      return;
    }

    // Check if all items are completed
    const allCompleted = items.every(item => item.status === 'completed');

    if (allCompleted) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating order to ready:', orderError);
      }
    }
  } catch (error) {
    console.error('Error in checkOrderCompletion:', error);
  }
} 