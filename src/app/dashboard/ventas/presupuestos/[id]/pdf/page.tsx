"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PDFViewer } from "@react-pdf/renderer";
import { QuotePDF } from "@/components/pdf/QuotePDF";
import { Loader2 } from "lucide-react";

export default function QuotePDFPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: quote } = await supabase
        .from("quotes")
        .select("*, partners(*), companies(*)")
        .eq("id", id)
        .single();

      if (quote) {
        const { data: items } = await supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", id);

        // Convertir logo a base64 via proxy server-side para evitar CORS en react-pdf
        let company = quote.companies;
        if (company?.logo_url) {
          try {
            const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(company.logo_url)}`);
            const json = await res.json();
            company = { ...company, logo_url: json.dataUrl ?? null };
          } catch {
            company = { ...company, logo_url: null };
          }
        }

        setData({ quote, items, partner: quote.partners, company });
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
        <p className="text-text-2 font-medium">Generando vista previa del presupuesto...</p>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-center">Presupuesto no encontrado</div>;

  return (
    <div className="h-screen w-full">
      <PDFViewer className="w-full h-full border-none">
        <QuotePDF
          quote={data.quote}
          items={data.items}
          company={data.company}
          partner={data.partner}
        />
      </PDFViewer>
    </div>
  );
}
