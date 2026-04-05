"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CompanyProfile {
  id: string;
  name: string;
  rif: string;
  logo_url: string | null;
  address?: string | null;
  phone?: string | null;
  settings?: Record<string, any>;
}

export function useCompanyProfile(companyId?: string | null) {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    async function fetchCompany() {
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("id, name, rif, logo_url, settings")
          .eq("id", companyId)
          .single();

        if (error) throw error;

        // phone and address may live in settings JSONB
        const settings = data?.settings || {};
        setCompany({
          id: data.id,
          name: data.name,
          rif: data.rif,
          logo_url: data.logo_url ?? null,
          address: settings.address ?? null,
          phone: settings.phone ?? null,
          settings,
        });
      } catch (err) {
        console.error("[useCompanyProfile] Error fetching company:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  return { company, loading };
}
