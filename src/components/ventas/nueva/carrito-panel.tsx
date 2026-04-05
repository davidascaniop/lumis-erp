"use client";
import { useState } from "react";
import {
  Loader2, Trash2, X, User, CreditCard, ShoppingBag,
  FileText, Wallet, Plus, Search, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export function CarritoPanel({
  cart,
  onUpdateQty,
  onRemove,
  condition,
  onConditionChange,
  method,
  onMethodChange,
  subtotal,
  bcvRate,
  cliente,
  onSubmit,
  submitting,
  amountPaid,
  onAmountPaidChange,
  newClientName,
  setNewClientName,
  newClientRif,
  setNewClientRif,
  newClientPhone,
  setNewClientPhone,
  newClientAddress,
  setNewClientAddress,
  partners,
  onSelectPartner,
  onCreateQuickClient,
  treasuryAccounts,
  treasuryAccountId,
  onTreasuryAccountChange,
}: {
  cart: any[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  condition: "contado" | "credito";
  onConditionChange: (v: "contado" | "credito") => void;
  method: string;
  onMethodChange: (v: string) => void;
  subtotal: number;
  bcvRate: number;
  cliente: any | null;
  onSubmit: () => void;
  submitting: boolean;
  amountPaid: number;
  onAmountPaidChange: (v: number) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newClientRif: string;
  setNewClientRif: (v: string) => void;
  newClientPhone: string;
  setNewClientPhone: (v: string) => void;
  newClientAddress: string;
  setNewClientAddress: (v: string) => void;
  partners: any[];
  onSelectPartner: (p: any | null) => void;
  onCreateQuickClient: (name: string, rif: string, phone: string, address: string) => Promise<boolean>;
  treasuryAccounts?: any[];
  treasuryAccountId?: string;
  onTreasuryAccountChange?: (v: string) => void;
}) {
  // ── Cédula search state ──────────────────────────────────
  const [rifPrefix, setRifPrefix] = useState("V");
  const [rifInput, setRifInput] = useState("");
  const [searchResult, setSearchResult] = useState<"found" | "not_found" | null>(null);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [isSavingQuick, setIsSavingQuick] = useState(false);

  const total = subtotal;
  const totalBs = total * bcvRate;

  // ── Buscar cliente por cédula ───────────────────────────
  const handleSearchByCedula = () => {
    if (!rifInput.trim()) return toast.error("Ingresa la cédula o RIF");
    const fullRif = `${rifPrefix}-${rifInput.trim()}`;
    const found = partners.find(
      (p) =>
        p.rif?.replace(/\s/g, "") === fullRif.replace(/\s/g, "") ||
        p.rif?.replace(/\s/g, "").includes(rifInput.trim()),
    );
    if (found) {
      onSelectPartner(found);
      setNewClientName(found.name ?? "");
      setNewClientRif(found.rif ?? fullRif);
      setNewClientPhone(found.phone ?? "");
      setNewClientAddress(found.address ?? "");
      setSearchResult("found");
    } else {
      setNewClientRif(fullRif);
      setSearchResult("not_found");
    }
  };

  const handleClearClient = () => {
    onSelectPartner(null);
    setNewClientName("");
    setNewClientRif("");
    setNewClientPhone("");
    setNewClientAddress("");
    setRifInput("");
    setSearchResult(null);
  };

  // ── Guardar cliente rápido ──────────────────────────────
  const submitQuickClient = async () => {
    if (!newClientName || !newClientRif) return toast.error("Nombre y cédula son obligatorios");
    setIsSavingQuick(true);
    const success = await onCreateQuickClient(
      newClientName,
      newClientRif,
      newClientPhone,
      newClientAddress,
    );
    setIsSavingQuick(false);
    if (success) {
      setShowQuickModal(false);
      setSearchResult("found");
    }
  };

  const paymentMethods = [
    { id: "efectivo_usd", label: "Efectivo $" },
    { id: "efectivo_bs", label: "Efectivo Bs." },
    { id: "pago_movil", label: "Pago Móvil" },
    { id: "zelle", label: "Zelle" },
    { id: "transferencia", label: "Transf." },
    { id: "punto", label: "Punto" },
  ];

  const canSubmit = cart.length > 0 && (!!cliente || (!!newClientName && !!newClientRif));

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden bg-white">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-brand/5 flex items-center justify-center text-brand">
          <ShoppingBag className="w-4.5 h-4.5" />
        </div>
        <h2 className="text-lg font-bold font-outfit text-[#1A1125]">Resumen del Pedido</h2>
      </div>

      <div className="flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar pb-4 pr-1">

        {/* ── SECCIÓN: CLIENTE ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">
            <User className="w-3 h-3" /> Datos del Cliente
          </div>

          {/* ── BÚSQUEDA POR CÉDULA ── */}
          {!cliente ? (
            <div className="space-y-2">
              {/* Cédula search row */}
              <div className="flex gap-2">
                <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden focus-within:border-brand/40 transition-all flex-shrink-0">
                  <select
                    value={rifPrefix}
                    onChange={(e) => { setRifPrefix(e.target.value); setSearchResult(null); }}
                    className="bg-transparent pl-2.5 pr-1 py-2.5 text-[13px] font-bold text-brand font-outfit outline-none cursor-pointer appearance-none"
                  >
                    <option value="V">V</option>
                    <option value="J">J</option>
                    <option value="E">E</option>
                  </select>
                  <input
                    value={rifInput}
                    onChange={(e) => { setRifInput(e.target.value); setSearchResult(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchByCedula()}
                    placeholder="Cédula / RIF"
                    className="w-28 px-2 py-2.5 bg-transparent text-[13px] font-medium outline-none font-outfit"
                  />
                </div>
                <button
                  onClick={handleSearchByCedula}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand text-white text-[11px] font-bold font-outfit uppercase tracking-wide hover:opacity-90 transition-all active:scale-95"
                >
                  <Search className="w-3.5 h-3.5" /> Buscar
                </button>
              </div>

              {/* ── NO ENCONTRADO → opción crear ── */}
              {searchResult === "not_found" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <div className="text-[11px] font-bold text-amber-700 font-outfit">Cédula no registrada</div>
                    <div className="text-[10px] text-amber-600 font-outfit">{rifPrefix}-{rifInput}</div>
                  </div>
                  <button
                    onClick={() => setShowQuickModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-[10px] font-bold font-outfit uppercase hover:opacity-90 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Crear
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── CLIENTE ENCONTRADO / SELECCIONADO ── */
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start justify-between animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-emerald-800 font-outfit truncate">{newClientName}</div>
                  {newClientRif && <div className="text-[10px] text-emerald-600 font-outfit">{newClientRif}</div>}
                  {newClientPhone && <div className="text-[10px] text-emerald-600 font-outfit">{newClientPhone}</div>}
                  {newClientAddress && <div className="text-[10px] text-emerald-600 font-outfit truncate">{newClientAddress}</div>}
                </div>
              </div>
              <button onClick={handleClearClient} className="text-emerald-400 hover:text-red-400 transition-colors p-0.5 flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── SECCIÓN: MODALIDAD Y MÉTODOS ── */}
        <div className="space-y-4 pt-4 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">
              <CreditCard className="w-3 h-3" /> Modalidad de Pago
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                checked={condition === "contado"}
                onChange={() => onConditionChange("contado")}
                className="w-3.5 h-3.5 accent-brand"
              />
              <span className={`text-[13px] font-bold font-outfit ${condition === "contado" ? "text-[#1A1125]" : "text-text-3"}`}>Contado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="condition"
                checked={condition === "credito"}
                onChange={() => onConditionChange("credito")}
                className="w-3.5 h-3.5 accent-brand"
              />
              <span className={`text-[13px] font-bold font-outfit ${condition === "credito" ? "text-[#1A1125]" : "text-text-3"}`}>Crédito</span>
            </label>
          </div>

          {condition === "credito" && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-brand font-outfit">$</span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                  placeholder="Ingrese monto a abonar..."
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-brand/20 bg-brand/[0.02] text-[13px] font-bold text-brand focus:outline-none focus:border-brand font-outfit"
                />
              </div>
              <p className="text-[10px] text-text-3 font-outfit mt-1 ml-1 opacity-70 italic">Ingrese el pago inicial del cliente</p>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">
              <Wallet className="w-3 h-3" /> Método de Pago
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onMethodChange(m.id)}
                  className={`
                    py-2 rounded-lg text-[10px] font-bold font-outfit transition-all uppercase tracking-tighter border
                    ${method === m.id ? "bg-brand text-white border-brand shadow-md" : "bg-[#F8FAFC] text-text-3 border-[#EDF2F7] hover:bg-white hover:border-brand/30"}
                  `}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── CUENTA DE DESTINO ── */}
          {treasuryAccounts && treasuryAccounts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">
                <CreditCard className="w-3 h-3" /> ¿A qué cuenta entró?
              </div>
              <select
                value={treasuryAccountId || ""}
                onChange={(e) => onTreasuryAccountChange?.(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E2E8F0] text-[12px] font-bold font-outfit bg-[#F8FAFC] focus:outline-none focus:border-brand/40 transition-all"
              >
                <option value="">Seleccionar cuenta...</option>
                {treasuryAccounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency?.toUpperCase()})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── SECCIÓN: ITEMS ── */}
        <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
          <p className="text-text-3 font-bold text-[11px] font-outfit uppercase tracking-widest">Productos Seleccionados</p>
          {cart.length === 0 ? (
            <div className="py-4 text-center opacity-20">
              <p className="text-[11px] font-bold font-outfit uppercase">Sin items</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
              {cart.map((item: any) => (
                <div key={item.id} className="flex items-start justify-between group">
                  <div className="flex gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-text-3 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold text-text-1 truncate font-outfit max-w-[120px]">{item.name}</span>
                      <span className="text-[10px] font-medium text-text-3 font-outfit leading-none mt-0.5">
                        {item.qty}x ${Number(item.price_usd).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#1A1125] font-outfit">${(item.price_usd * item.qty).toFixed(2)}</span>
                    <button onClick={() => onRemove(item.id)} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── TOTALES Y ACCIONES ── */}
      <div className="pt-4 border-t border-[#F1F5F9] space-y-4">
        <div className="flex flex-col gap-0.5 items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-bold text-text-3 font-outfit uppercase tracking-wider">Total Venta:</span>
            <span className="text-xl font-bold text-brand font-outfit">$ {total.toFixed(2)}</span>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] font-outfit uppercase">
            Bs. {totalBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}
            <span className="text-[8px] font-medium opacity-50"> (BCV: {bcvRate.toFixed(2)})</span>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={onSubmit}
            disabled={submitting || !canSubmit}
            className={`w-full py-3 rounded-lg font-bold font-outfit text-[12px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${
              submitting || !canSubmit
                ? "bg-[#F4F7FA] text-[#B0BCCB] cursor-not-allowed shadow-none"
                : "bg-brand text-white shadow-brand/10 hover:opacity-90"
            }`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Finalizar Pedido"}
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="py-2.5 rounded-lg font-bold font-outfit text-[10px] uppercase tracking-widest border border-[#E2E8F0] text-text-2 hover:bg-[#F8FAFC] transition-all">
              Cotizar
            </button>
            <button className="py-2.5 rounded-lg font-bold font-outfit text-[10px] uppercase tracking-widest border border-danger/5 text-danger hover:bg-danger/5 transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL CLIENTE RÁPIDO ── */}
      {showQuickModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-outfit text-[#1A1125]">Crear Cliente Rápido</h3>
                <p className="text-[10px] text-[#94A3B8] font-outfit">Cédula: {rifPrefix}-{rifInput}</p>
              </div>
              <button onClick={() => setShowQuickModal(false)} className="text-text-3 hover:text-danger transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest font-outfit">Nombre Completo *</label>
                <input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-brand/40 font-outfit bg-[#F8FAFC]"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              {/* Cédula (readonly, ya viene del buscador) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest font-outfit">Cédula / RIF</label>
                <input
                  value={`${rifPrefix}-${rifInput}`}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium font-outfit bg-[#F1F5F9] text-text-3 cursor-not-allowed"
                />
              </div>
              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest font-outfit">Teléfono</label>
                <input
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-brand/40 font-outfit bg-[#F8FAFC]"
                  placeholder="0414-0000000"
                />
              </div>
              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-widest font-outfit">Dirección</label>
                <input
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-[13px] font-medium focus:outline-none focus:border-brand/40 font-outfit bg-[#F8FAFC]"
                  placeholder="Ej. Av. Principal, Local 1"
                />
              </div>
            </div>
            <div className="p-5 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowQuickModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-text-3 hover:bg-[#E2E8F0] transition-colors font-outfit uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={submitQuickClient}
                disabled={isSavingQuick || !newClientName}
                className="px-4 py-2 rounded-lg bg-brand text-white text-xs font-bold font-outfit uppercase disabled:opacity-50 transition-colors shadow-md flex items-center gap-2"
              >
                {isSavingQuick && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
