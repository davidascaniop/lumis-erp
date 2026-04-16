"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, X, Eye } from "lucide-react";
import Link from "next/link";

interface PortalPayment {
  id: string;
  content: string;
  created_at: string;
  entity_id: string;
  metadata?: string;
}

export function PortalPaymentsAlert({ companyId, initialPayments }: { companyId: string; initialPayments?: PortalPayment[] }) {
  const [payments, setPayments] = useState<PortalPayment[]>(initialPayments ?? []);
  const [dismissed, setDismiss] = useState<Set<string>>(new Set());

  useEffect(() => {
    // FIX #1: Si ya tenemos datos SSR, no hacer re-fetch en cliente
    if (initialPayments) return;
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("id, content, created_at, entity_id, metadata")
        .eq("company_id", companyId)
        .eq("type", "client_payment")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setPayments(data as PortalPayment[]);
    };
    load();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = payments.filter((p) => !dismissed.has(p.id));
  if (visible.length === 0) return null;

  const latest = visible[0];
  const meta = latest.metadata
    ? (() => {
        try {
          return JSON.parse(latest.metadata!);
        } catch {
          return {};
        }
      })()
    : {};

  return (
    <div
      className="relative bg-brand/10
                        border border-brand/30 rounded-2xl p-5 mb-4
                        shadow-card hover-card-effect"
    >
      {/* Ping */}
      <div className="absolute -top-1.5 -right-1.5">
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
          <span
            className="relative inline-flex rounded-full h-4 w-4 bg-brand
                                     items-center justify-center text-[8px] font-bold text-white"
          >
            {visible.length}
          </span>
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Ícono */}
        <div
          className="w-10 h-10 rounded-xl bg-brand/15
                                border border-brand/25
                                flex items-center justify-center flex-shrink-0"
        >
          <ShieldCheck className="w-5 h-5 text-brand" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-text-1">
              {visible.length === 1
                ? "💳 Pago registrado por cliente"
                : `💳 ${visible.length} pagos registrados por clientes`}
            </p>
            <span className="text-[10px] text-[#9585B8]">
              {new Date(latest.created_at).toLocaleTimeString("es-VE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-xs text-text-2 mb-3 leading-relaxed">
            {latest.content}
          </p>

          {/* Preview */}
          {meta.amount && (
            <div className="flex items-center gap-4 mb-3 p-3 rounded-xl bg-surface-base/50">
              <div>
                <p className="text-[10px] text-text-3 uppercase tracking-wider">
                  Monto
                </p>
                <p className="font-mono text-sm font-bold text-ok">
                  ${parseFloat(meta.amount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-3 uppercase tracking-wider">
                  Método
                </p>
                <p className="text-xs font-semibold text-text-1 capitalize">
                  {meta.method?.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-3 uppercase tracking-wider">
                  Referencia
                </p>
                <p className="font-mono text-xs text-text-1">{meta.reference}</p>
              </div>
              {meta.proof_url && (
                <a
                  href={meta.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-brand font-semibold hover:underline ml-auto"
                >
                  <Eye className="w-3 h-3" /> Ver
                </a>
              )}
            </div>
          )}

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/cobranza"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white
                                       bg-brand-gradient
                                       hover:opacity-90 transition-opacity"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verificar ahora
            </Link>
            {visible.length > 1 && (
              <span className="text-xs text-[#9585B8]">
                +{visible.length - 1} más pendientes
              </span>
            )}
          </div>
        </div>

        {/* Cerrar */}
        <button
          onClick={() => setDismiss((prev) => new Set([...prev, latest.id]))}
          className="p-1.5 rounded-lg hover:bg-surface-base/20 text-text-3 hover:text-text-1 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
