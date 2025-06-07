import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { CartContextType, CartItem, MenuItem } from '../types';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: MenuItem; quantity: number; specialInstructions?: string } }
  | { type: 'REMOVE_ITEM'; payload: { menuItemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { menuItemId: string; quantity: number } }
  | { type: 'UPDATE_INSTRUCTIONS'; payload: { menuItemId: string; instructions: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: { items: CartItem[] } };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity, specialInstructions } = action.payload;
      const existingItemIndex = state.items.findIndex(
        cartItem => cartItem.menu_item.id === item.id && 
                   cartItem.special_instructions === specialInstructions
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.menu_item.price;
        
        return { items: updatedItems };
      } else {
        // Add new item
        const newItem: CartItem = {
          menu_item: item,
          quantity,
          special_instructions: specialInstructions,
          subtotal: quantity * item.price,
        };
        
        return { items: [...state.items, newItem] };
      }
    }

    case 'REMOVE_ITEM': {
      const { menuItemId } = action.payload;
      return {
        items: state.items.filter(item => item.menu_item.id !== menuItemId),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          items: state.items.filter(item => item.menu_item.id !== menuItemId),
        };
      }

      const updatedItems = state.items.map(item => {
        if (item.menu_item.id === menuItemId) {
          return {
            ...item,
            quantity,
            subtotal: quantity * item.menu_item.price,
          };
        }
        return item;
      });

      return { items: updatedItems };
    }

    case 'UPDATE_INSTRUCTIONS': {
      const { menuItemId, instructions } = action.payload;
      const updatedItems = state.items.map(item => {
        if (item.menu_item.id === menuItemId) {
          return {
            ...item,
            special_instructions: instructions,
          };
        }
        return item;
      });

      return { items: updatedItems };
    }

    case 'CLEAR_CART':
      return { items: [] };

    case 'LOAD_CART':
      return { items: action.payload.items };

    default:
      return state;
  }
}

interface CartProviderProps {
  children: React.ReactNode;
  persistKey?: string; // Optional key for localStorage persistence
}

export function CartProvider({ children, persistKey = 'tabledirect_cart' }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    if (persistKey) {
      try {
        const savedCart = localStorage.getItem(persistKey);
        if (savedCart) {
          const items = JSON.parse(savedCart);
          if (Array.isArray(items)) {
            dispatch({ type: 'LOAD_CART', payload: { items } });
          }
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, [persistKey]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (persistKey) {
      try {
        localStorage.setItem(persistKey, JSON.stringify(state.items));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [state.items, persistKey]);

  const addItem = (item: MenuItem, quantity = 1, specialInstructions?: string) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { item, quantity, specialInstructions },
    });
  };

  const removeItem = (menuItemId: string) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { menuItemId },
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { menuItemId, quantity },
    });
  };

  const updateInstructions = (menuItemId: string, instructions: string) => {
    dispatch({
      type: 'UPDATE_INSTRUCTIONS',
      payload: { menuItemId, instructions },
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Calculate totals
  const total = state.items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    updateInstructions,
    clearCart,
    total,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
} 