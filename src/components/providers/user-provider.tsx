"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(() => {
    // Hydrate from sessionStorage to avoid loading flash on navigation
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("lumis_user_profile");
        return cached ? JSON.parse(cached) : null;
      } catch { return null; }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    // If we have cached data, skip initial loading state
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("lumis_user_profile");
    }
    return true;
  });
  const supabase = createClient();

  const fetchUser = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("*, companies(id, is_active, plan_type, settings, subscription_status, modules_enabled)")
          .eq("auth_id", authUser.id)
          .single();

        setUser(profile);
        // Cache for instant hydration on next navigation
        try { sessionStorage.setItem("lumis_user_profile", JSON.stringify(profile)); } catch {}
      } else {
        setUser(null);
        try { sessionStorage.removeItem("lumis_user_profile"); } catch {}
      }
    } catch (error) {
      console.error("Error fetching user in UserProvider:", error);
      setUser(null);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes to prevent cross-tenant data leakage
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Immediately clear user data to prevent stale data flash
        setUser(null);
        try { sessionStorage.removeItem("lumis_user_profile"); } catch {}
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Clear stale user first, then fetch fresh profile
        setUser(null);
        setLoading(true);
        fetchUser();
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
