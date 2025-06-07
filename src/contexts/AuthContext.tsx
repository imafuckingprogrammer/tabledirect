import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, dbHelpers } from '../lib/supabase';
import type { AuthContextType, ApiResponse, UserRole, ActiveSession } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | undefined>();
  const [restaurantId, setRestaurantId] = useState<string | undefined>();
  const [activeSession, setActiveSession] = useState<ActiveSession | undefined>();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserRole(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserRole(session.user.id);
        } else {
          // Clean up on sign out
          setUserRole(undefined);
          setRestaurantId(undefined);
          if (activeSession) {
            await dbHelpers.endSession(activeSession.id).catch(console.error);
            setActiveSession(undefined);
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [activeSession]);

  const loadUserRole = async (userId: string) => {
    try {
      // Check if user is a restaurant owner
      const { data: restaurants, error: ownerError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('owner_id', userId)
        .eq('subscription_status', 'active')
        .limit(1);

      if (!ownerError && restaurants && restaurants.length > 0) {
        setUserRole('owner');
        setRestaurantId(restaurants[0].id);
        return;
      }

      // Check if user is staff at any restaurant
      const { data: staffData, error: staffError } = await supabase
        .from('restaurant_staff')
        .select(`
          role,
          restaurant_id,
          restaurants!inner(
            id,
            name,
            subscription_status
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('restaurants.subscription_status', 'active')
        .limit(1);

      if (!staffError && staffData && staffData.length > 0) {
        const staff = staffData[0];
        setUserRole(staff.role as UserRole);
        setRestaurantId(staff.restaurant_id);
        return;
      }

      // No role found
      setUserRole(undefined);
      setRestaurantId(undefined);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<ApiResponse> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    userData?: any
  ): Promise<ApiResponse> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // If this is a restaurant owner signup, create the restaurant
      if (userData?.restaurantName && data.user) {
        try {
          const slug = userData.restaurantName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          const { error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
              name: userData.restaurantName,
              slug,
              email: email,
              owner_id: data.user.id,
            });

          if (restaurantError) {
            console.error('Error creating restaurant:', restaurantError);
          }
        } catch (error) {
          console.error('Error creating restaurant:', error);
        }
      }

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // End active session if exists
      if (activeSession) {
        await dbHelpers.endSession(activeSession.id);
        setActiveSession(undefined);
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const createKitchenSession = async (userName: string, stationId?: string) => {
    if (!user || !restaurantId) return null;

    try {
      const session = await dbHelpers.createSession(
        user.id,
        restaurantId,
        userName,
        stationId
      );
      
      setActiveSession(session);
      
      // Start heartbeat
      const heartbeatInterval = setInterval(async () => {
        try {
          await dbHelpers.updateSessionHeartbeat(session.id);
        } catch (error) {
          console.error('Heartbeat failed:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 seconds

      // Clean up on unmount
      return () => {
        clearInterval(heartbeatInterval);
      };
    } catch (error) {
      console.error('Error creating kitchen session:', error);
      return null;
    }
  };

  const endKitchenSession = async () => {
    if (!activeSession) return;

    try {
      await dbHelpers.endSession(activeSession.id);
      setActiveSession(undefined);
    } catch (error) {
      console.error('Error ending kitchen session:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    userRole,
    restaurantId,
    activeSession,
    createKitchenSession,
    endKitchenSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 