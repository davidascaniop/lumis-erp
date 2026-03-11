"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { DeliveryNotePDF } from "@/components/pdf/DeliveryNotePDF";
import { ArrowLeft, Loader2, Download, Printer } from "lucide-react";
import { toast } from "sonner";

export default function NotaDeEntregaPage({ params }: { params: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params;

      // Bring order details
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select(
          `
                    *,
                    users ( full_name ),
                    partners ( * ),
                    order_items ( id, qty, price_usd, subtotal, product_id, products (sku, name) )
                `,
        )
        .eq("id", resolvedParams.id)
        .single();

      if (orderErr || !orderData) {
        toast.error("No se encontró el pedido");
        router.push("/dashboard/ventas");
        return;
      }

      // Bring company details for header
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("id", orderData.company_id)
        .single();

      setOrder(orderData);
      setCompany(companyData);
      setLoading(false);
    };

    fetchData();
  }, [params]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-text-3 animate-pulse">
          Generando Nota de Entrega...
        </p>
      </div>
    );
  }

  const { partners: partner, order_items: items } = order;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20 h-screen flex flex-col">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-3 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Venta
        </button>

        <div className="flex gap-4">
          <PDFDownloadLink
            document={
              <DeliveryNotePDF
                order={order}
                items={items}
                company={company}
                partner={partner}
              />
            }
            fileName={`Nota_Entrega_${order.order_number}.pdf`}
          >
            {/* @ts-ignore - react-pdf typings can be tricky with function children */}
            {({ loading }) => (
              <button
                disabled={loading}
                className="px-6 py-2.5 bg-brand-gradient text-white rounded-xl shadow-brand font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {loading ? "Preparando..." : "Descargar PDF"}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="flex-1 bg-surface-card border border-border rounded-xl overflow-hidden shadow-card">
        <PDFViewer width="100%" height="100%" className="border-none">
          <DeliveryNotePDF
            order={order}
            items={items}
            company={company}
            partner={partner}
          />
        </PDFViewer>
      </div>
    </div>
  );
}
