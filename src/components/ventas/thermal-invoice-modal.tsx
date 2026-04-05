"use client";

import { useState, useEffect, useRef } from "react";
import { X, Printer, Receipt, FileText, SkipForward, Loader2 } from "lucide-react";
import { getNextDocumentNumber, saveDocumentNumber } from "@/hooks/use-invoice-number";
import type { CompanyProfile } from "@/hooks/use-company-profile";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface InvoiceOrderData {
  id: string;
  orderNumber: string;
  createdAt: string;
  paymentMethod: string;
  paymentType: string;
  totalUsd: number;
  totalBs: number;
  bcvRate: number;
  items: Array<{
    name: string;
    qty: number;
    price_usd: number;
  }>;
  client: {
    name: string;
    rif?: string;
    phone?: string;
  } | null;
  invoiceNumber?: string; // pre-existing number when reprinting
}

interface ThermalInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  order: InvoiceOrderData;
  company: CompanyProfile | null;
  ivaPercent?: number; // default 16
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(iso: string, ampm = false) {
  const d = new Date(iso);
  if (ampm) {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${suffix}`;
  }
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function paymentLabel(method: string) {
  const map: Record<string, string> = {
    efectivo_usd: "Efectivo USD",
    efectivo_bs: "Efectivo Bs.",
    pago_movil: "Pago Móvil",
    zelle: "Zelle",
    transferencia: "Transferencia",
    punto: "Punto de Venta",
    Efectivo: "Efectivo",
  };
  return map[method] ?? method;
}

// ─────────────────────────────────────────────────────────
// Print CSS (90mm thermal)
// ─────────────────────────────────────────────────────────
const PRINT_STYLES = `
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
    body > *:not(#thermal-print-root) { display: none !important; }
    #thermal-print-root {
      display: block !important;
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 90mm !important;
      background: white !important;
      margin: 0 !important;
      padding: 2mm !important;
    }
    .thermal-doc {
      width: 86mm !important;
      font-family: 'Courier New', Courier, monospace !important;
      font-size: 11px !important;
      color: #000 !important;
      background: #fff !important;
      line-height: 1.4 !important;
    }
    .thermal-doc img.company-logo {
      max-width: 60mm !important;
      height: auto !important;
      display: block !important;
      margin: 0 auto 4px auto !important;
    }
    .no-print { display: none !important; }
    @page { size: 90mm auto; margin: 0; }
  }
  @media screen {
    .thermal-doc {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #111;
      background: #fff;
      width: 86mm;
      line-height: 1.5;
    }
    .thermal-doc img.company-logo {
      max-width: 60mm;
      height: auto;
      display: block;
      margin: 0 auto 4px auto;
    }
  }
`;

// ─────────────────────────────────────────────────────────
// Ticket Rápido Template
// ─────────────────────────────────────────────────────────
function TicketRapido({
  order,
  company,
  docNumber,
  ivaPercent,
  includeIva,
}: {
  order: InvoiceOrderData;
  company: CompanyProfile | null;
  docNumber: string;
  ivaPercent: number;
  includeIva: boolean;
}) {
  const subtotal = order.items.reduce((acc, i) => acc + i.price_usd * i.qty, 0);
  const ivaAmount = includeIva && ivaPercent > 0 ? subtotal * (ivaPercent / 100) : 0;
  const total = subtotal + ivaAmount;
  const totalBs = total * order.bcvRate;

  const SEP = "--------------------------------";

  return (
    <div className="thermal-doc" style={{ padding: "4px 0" }}>
      {/* Header empresa */}
      {company?.logo_url && (
        <img src={company.logo_url} alt="Logo" className="company-logo" />
      )}
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", marginBottom: "2px" }}>
        {company?.name ?? ""}
      </div>
      {company?.rif && (
        <div style={{ textAlign: "center", fontSize: "11px" }}>RIF: {company.rif}</div>
      )}
      {company?.address && (
        <div style={{ textAlign: "center", fontSize: "10px" }}>{company.address}</div>
      )}
      {company?.phone && (
        <div style={{ textAlign: "center", fontSize: "10px" }}>Telf: {company.phone}</div>
      )}

      <div style={{ margin: "4px 0" }}>{SEP}</div>
      <div style={{ textAlign: "center", fontWeight: "bold" }}>TICKET DE VENTA</div>
      <div>Fecha: {formatDate(order.createdAt)}  Hora: {formatTime(order.createdAt)}</div>
      <div>N° Venta: {docNumber}</div>
      <div>{SEP}</div>

      {/* Cliente */}
      {(order.client?.name || order.client?.rif) && (
        <>
          <div>Cliente: {order.client?.name ?? "Consumidor Final"}</div>
          {order.client?.rif && <div>Cédula:  {order.client.rif}</div>}
          <div>{SEP}</div>
        </>
      )}

      {/* Productos */}
      <div style={{ fontWeight: "bold" }}>CANT  DESCRIPCIÓN      PRECIO</div>
      {order.items.map((item, i) => {
        const desc = item.name.length > 14 ? item.name.slice(0, 14) : item.name.padEnd(14, " ");
        const price = `$${(item.price_usd * item.qty).toFixed(2)}`;
        const qty = String(item.qty).padStart(2, " ");
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{qty}    {desc}</span>
            <span>{price}</span>
          </div>
        );
      })}

      <div>{SEP}</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>SUBTOTAL:</span><span>${subtotal.toFixed(2)}</span>
      </div>
      {includeIva && ivaPercent > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>IVA ({ivaPercent}%):</span><span>${ivaAmount.toFixed(2)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
        <span>TOTAL USD:</span><span>${total.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>TOTAL Bs:</span>
        <span>Bs.{totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span>
      </div>
      <div style={{ fontSize: "10px" }}>Tasa BCV: Bs.{order.bcvRate.toFixed(2)}/$</div>
      <div>{SEP}</div>
      <div>Método de pago: {paymentLabel(order.paymentMethod)}</div>
      <div>{SEP}</div>
      <div style={{ textAlign: "center", marginTop: "4px" }}>¡Gracias por su compra!</div>
      <div style={{ textAlign: "center", fontWeight: "bold" }}>{company?.name ?? ""}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Factura Formal Template
// ─────────────────────────────────────────────────────────
function FacturaFormal({
  order,
  company,
  docNumber,
  ivaPercent,
  includeIva,
}: {
  order: InvoiceOrderData;
  company: CompanyProfile | null;
  docNumber: string;
  ivaPercent: number;
  includeIva: boolean;
}) {
  const subtotal = order.items.reduce((acc, i) => acc + i.price_usd * i.qty, 0);
  const ivaAmount = includeIva && ivaPercent > 0 ? subtotal * (ivaPercent / 100) : 0;
  const total = subtotal + ivaAmount;
  const totalBs = total * order.bcvRate;

  const SEP = "--------------------------------";
  const DOUBLE = "================================";

  return (
    <div className="thermal-doc" style={{ padding: "4px 0" }}>
      {/* Header empresa */}
      {company?.logo_url && (
        <img src={company.logo_url} alt="Logo" className="company-logo" />
      )}
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", marginBottom: "2px" }}>
        {company?.name ?? ""}
      </div>
      {company?.rif && (
        <div style={{ textAlign: "center", fontSize: "11px" }}>RIF: {company.rif}</div>
      )}
      {company?.address && (
        <div style={{ fontSize: "10px" }}>Dirección: {company.address}</div>
      )}
      {company?.phone && (
        <div style={{ fontSize: "10px" }}>Teléfono: {company.phone}</div>
      )}

      <div>{DOUBLE}</div>
      <div style={{ textAlign: "center", fontWeight: "bold" }}>    FACTURA NO FISCAL</div>
      <div>{DOUBLE}</div>

      <div>N° Factura: {docNumber}</div>
      <div>Fecha: {formatDate(order.createdAt)}</div>
      <div>Hora: {formatTime(order.createdAt, true)}</div>
      <div>{SEP}</div>

      {/* Datos cliente */}
      <div style={{ fontWeight: "bold" }}>DATOS DEL CLIENTE:</div>
      <div>Nombre: {order.client?.name ?? "Consumidor Final"}</div>
      {order.client?.rif && <div>Cédula/RIF: {order.client.rif}</div>}
      {order.client?.phone && <div>Teléfono: {order.client.phone}</div>}
      <div>{SEP}</div>

      {/* Productos */}
      <div style={{ fontWeight: "bold" }}>DESCRIPCIÓN DE PRODUCTOS:</div>
      <div style={{ fontSize: "10px" }}>----  ---------  -----</div>

      {order.items.map((item, i) => {
        const name = item.name.length > 22 ? item.name.slice(0, 22) : item.name;
        return (
          <div key={i} style={{ marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "bold" }}>{String(item.qty).padStart(2, " ")}  {name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "4px", fontSize: "10px" }}>
              <span>P.Unit: ${item.price_usd.toFixed(2)}</span>
              <span>Total: ${(item.price_usd * item.qty).toFixed(2)}</span>
            </div>
          </div>
        );
      })}

      <div>{SEP}</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>SUBTOTAL:</span><span>${subtotal.toFixed(2)}</span>
      </div>
      {includeIva && ivaPercent > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>IVA ({ivaPercent}%):</span><span>${ivaAmount.toFixed(2)}</span>
        </div>
      )}
      <div>{DOUBLE}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
        <span>TOTAL A PAGAR:</span><span>${total.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>TOTAL EN Bs:</span>
        <span>Bs.{totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span>
      </div>
      <div style={{ fontSize: "10px" }}>Tasa BCV aplicada: Bs.{order.bcvRate.toFixed(2)}</div>
      <div>{DOUBLE}</div>
      <div>Forma de pago: {paymentLabel(order.paymentMethod)}</div>
      <div>{SEP}</div>
      <div style={{ fontSize: "10px", textAlign: "center" }}>Nota: Este documento no tiene</div>
      <div style={{ fontSize: "10px", textAlign: "center" }}>valor fiscal</div>
      <div>{SEP}</div>
      <div style={{ textAlign: "center", fontWeight: "bold" }}>{company?.name ?? ""}</div>
      <div style={{ textAlign: "center" }}>Gracias por preferirnos</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────────────────
export function ThermalInvoiceModal({
  open,
  onClose,
  order,
  company,
  ivaPercent = 16,
}: ThermalInvoiceModalProps) {
  const [selected, setSelected] = useState<"ticket" | "factura" | null>(null);
  const [includeIva, setIncludeIva] = useState(ivaPercent > 0);
  const [docNumber, setDocNumber] = useState<string>("");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const printRootRef = useRef<HTMLDivElement>(null);

  // Generate doc number when format is selected
  useEffect(() => {
    if (!selected || !company?.id) return;
    if (order.invoiceNumber) {
      // Reprinting – use existing number
      setDocNumber(order.invoiceNumber);
      return;
    }

    setLoadingDoc(true);
    getNextDocumentNumber(company.id, selected)
      .then((num) => {
        setDocNumber(num);
        // Persist to DB
        saveDocumentNumber(order.id, num);
      })
      .finally(() => setLoadingDoc(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handlePrint = () => {
    // Inject print styles once
    const styleId = "thermal-print-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = PRINT_STYLES;
      document.head.appendChild(style);
    }

    // Move the print root to top-level body for clean print
    const root = printRootRef.current;
    if (root) {
      const clone = root.cloneNode(true) as HTMLElement;
      clone.id = "thermal-print-root";
      clone.style.display = "block";
      document.body.appendChild(clone);

      window.print();

      // Cleanup after print
      setTimeout(() => {
        const existing = document.getElementById("thermal-print-root");
        if (existing) document.body.removeChild(existing);
      }, 1000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* ── PRINT STYLES INJECTED ── */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* ── MODAL CARD ── */}
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-outfit text-[#1A1125]">¿Cómo deseas imprimir?</h2>
            <p className="text-xs text-[#94A3B8] font-outfit mt-0.5">
              Pedido {order.orderNumber} · {company?.name ?? ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F8F9FA] rounded-full transition-all text-[#94A3B8] hover:text-[#1A1125]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* ── FORMAT SELECTOR ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelected("ticket")}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
                selected === "ticket"
                  ? "border-[#7C3AED] bg-[#7C3AED]/5 shadow-lg shadow-[#7C3AED]/10"
                  : "border-[#E2E8F0] hover:border-[#7C3AED]/40 hover:bg-[#F8FAFC]"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                selected === "ticket" ? "bg-[#7C3AED]/10" : "bg-[#F8FAFC]"
              }`}>
                🧾
              </div>
              <div className="text-center">
                <div className={`font-bold font-outfit text-sm ${selected === "ticket" ? "text-[#7C3AED]" : "text-[#1A1125]"}`}>
                  Ticket Rápido
                </div>
                <div className="text-[10px] text-[#94A3B8] font-outfit mt-0.5">Estilo supermercado</div>
              </div>
            </button>

            <button
              onClick={() => setSelected("factura")}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
                selected === "factura"
                  ? "border-[#0EA5E9] bg-[#0EA5E9]/5 shadow-lg shadow-[#0EA5E9]/10"
                  : "border-[#E2E8F0] hover:border-[#0EA5E9]/40 hover:bg-[#F8FAFC]"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                selected === "factura" ? "bg-[#0EA5E9]/10" : "bg-[#F8FAFC]"
              }`}>
                📄
              </div>
              <div className="text-center">
                <div className={`font-bold font-outfit text-sm ${selected === "factura" ? "text-[#0EA5E9]" : "text-[#1A1125]"}`}>
                  Factura Formal
                </div>
                <div className="text-[10px] text-[#94A3B8] font-outfit mt-0.5">Formato detallado</div>
              </div>
            </button>
          </div>

          {/* ── IVA TOGGLE (only when format selected) ── */}
          {selected && (
            <div className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3 border border-[#E2E8F0] animate-in slide-in-from-top-2 duration-300">
              <div>
                <div className="text-[12px] font-bold font-outfit text-[#1A1125]">Incluir IVA en el documento</div>
                <div className="text-[10px] text-[#94A3B8] font-outfit">IVA {ivaPercent}% configurado</div>
              </div>
              <button
                onClick={() => setIncludeIva((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  includeIva ? "bg-[#7C3AED]" : "bg-[#CBD5E1]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    includeIva ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          {/* ── DOCUMENT NUMBER PREVIEW ── */}
          {selected && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              {loadingDoc ? (
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[12px] font-outfit">Generando número...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#64748B] bg-[#F8FAFC] rounded-xl px-4 py-2.5 border border-[#E2E8F0]">
                  <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[12px] font-outfit">
                    N° documento:{" "}
                    <span className="font-bold text-[#1A1125] font-mono">{docNumber}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── PRINT PREVIEW (hidden on screen, shown in print) ── */}
          {selected && docNumber && !loadingDoc && (
            <div
              ref={printRootRef}
              className="hidden"
              id="thermal-preview-inner"
            >
              {selected === "ticket" ? (
                <TicketRapido
                  order={order}
                  company={company}
                  docNumber={docNumber}
                  ivaPercent={ivaPercent}
                  includeIva={includeIva}
                />
              ) : (
                <FacturaFormal
                  order={order}
                  company={company}
                  docNumber={docNumber}
                  ivaPercent={ivaPercent}
                  includeIva={includeIva}
                />
              )}
            </div>
          )}

          {/* ── PREVIEW ON SCREEN (visual preview card) ── */}
          {selected && docNumber && !loadingDoc && (
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#F8FAFC] px-4 py-2 border-b border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest font-outfit">
                  Vista previa · 90mm
                </span>
              </div>
              <div className="p-3 overflow-x-auto max-h-52 no-scrollbar">
                {selected === "ticket" ? (
                  <TicketRapido
                    order={order}
                    company={company}
                    docNumber={docNumber}
                    ivaPercent={ivaPercent}
                    includeIva={includeIva}
                  />
                ) : (
                  <FacturaFormal
                    order={order}
                    company={company}
                    docNumber={docNumber}
                    ivaPercent={ivaPercent}
                    includeIva={includeIva}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={handlePrint}
            disabled={!selected || loadingDoc || !docNumber}
            className={`w-full py-3.5 rounded-2xl font-bold font-outfit text-sm uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
              !selected || loadingDoc || !docNumber
                ? "bg-[#F4F7FA] text-[#B0BCCB] cursor-not-allowed shadow-none"
                : selected === "factura"
                ? "bg-[#0EA5E9] text-white hover:opacity-90 shadow-[#0EA5E9]/25"
                : "bg-[#7C3AED] text-white hover:opacity-90 shadow-[#7C3AED]/25"
            }`}
          >
            <Printer className="w-4 h-4" />
            {selected === "ticket" ? "Imprimir Ticket" : selected === "factura" ? "Imprimir Factura" : "Selecciona un formato"}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-bold font-outfit text-[11px] uppercase tracking-widest text-[#94A3B8] hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-all flex items-center justify-center gap-2"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Omitir impresión
          </button>
        </div>
      </div>
    </div>
  );
}
