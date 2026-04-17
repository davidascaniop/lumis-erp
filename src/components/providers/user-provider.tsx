"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserContextType {
  user: any | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

interface UserProviderProps {
  children: React.ReactNode;
  initialUser?: any | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  // If server provided the user, use it immediately (zero loading time)
  const [user, setUser] = useState<any | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);
  const supabase = createClient();
  const hasInitialUser = useRef(!!initialUser);

  const fetchUser = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("*, companies(id, is_active, plan_type, settings, subscription_status, trial_ends_at, modules_enabled, logo_url, name, name_comercial, rif)")
          .eq("auth_id", authUser.id)
          .single();

        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user in UserProvider:", error);
      setUser(null);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // If server already provided the user, skip initial fetch entirely
    if (!hasInitialUser.current) {
      fetchUser();
    }

    // Listen for auth state changes (account switch, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Do not wipe out state. Just refresh profile silently if needed.
        fetchUser(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: () => fetchUser(true) }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUserContext = () => useContext(UserContext);
