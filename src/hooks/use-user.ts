"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from("users")
            .select("*, companies(id, is_active, plan_type, settings, subscription_status)")
            .eq("auth_id", authUser.id)
            .single();

          setUser(profile);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  return { user, loading };
}
