"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useBCV } from "@/hooks/use-bcv";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Plus, Search, Eye, Pencil, Ban, Landmark,
  Banknote, Globe, Bitcoin, Wallet, ArrowLeftRight,
  AlertTriangle, CheckCircle2, DollarSign, TrendingUp,
  ChevronRight, X, ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ACCOUNT_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  banco: { icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10", label: "Banco" },
  efectivo: { icon: Banknote, color: "text-orange-500", bg: "bg-orange-500/10", label: "Efectivo" },
  digital: { icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Digital" },
  crypto: { icon: Bitcoin, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Crypto" },
};

const CURRENCY_LABELS: Record<string, string> = { bs: "Bs", usd: "USD", usdt: "USDT" };

export default function MisCuentasPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" /></div>}>
      <CuentasContent />
    </Suspense>
  );
}

function CuentasContent() {
  const supabase = createClient();
  const { user } = useUser();
  const { rate } = useBCV();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Create form
  const [formData, setFormData] = useState({
    name: "", alias: "", type: "banco", platform: "", account_number: "",
    currency: "usd", initial_balance: "", min_alert_balance: "0", is_active: true,
  });

  // Transfer form
  const [transferData, setTransferData] = useState({
    from_account_id: "", to_account_id: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "", exchange_rate: "",
  });

  const fetchData = async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("treasury_accounts")
        .select("*")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAccounts(data || []);
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.company_id]);

  // Liquidity summary
  const summary = useMemo(() => {
    const active = accounts.filter(a => a.is_active);
    let totalUsd = 0;
    let totalBs = 0;
    let totalUsdPure = 0;

    active.forEach(a => {
      const bal = Number(a.current_balance || 0);
      if (a.currency === "usd") {
        totalUsdPure += bal;
        totalUsd += bal;
      } else if (a.currency === "usdt") {
        totalUsd += bal; // 1:1 approx
      } else if (a.currency === "bs") {
        totalBs += bal;
        if (rate) totalUsd += bal / rate;
      }
    });

    return { totalUsd, totalBs, totalUsdPure };
  }, [accounts, rate]);

  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.alias?.toLowerCase().includes(q) ||
      a.platform?.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const getStatusIndicator = (account: any) => {
    const bal = Number(account.current_balance || 0);
    const min = Number(account.min_alert_balance || 0);
    if (bal <= 0) return { color: "bg-red-500", label: "Crítico", textColor: "text-red-500" };
    if (min > 0 && bal < min) return { color: "bg-yellow-500", label: "Bajo", textColor: "text-yellow-500" };
    return { color: "bg-emerald-500", label: "Normal", textColor: "text-emerald-500" };
  };

  const getEquivalentUsd = (account: any) => {
    const bal = Number(account.current_balance || 0);
    if (account.currency === "usd" || account.currency === "usdt") return bal;
    if (account.currency === "bs" && rate) return bal / rate;
    return 0;
  };

  // ─── CRUD HANDLERS ───

  const handleSaveAccount = async () => {
    if (!formData.name || !formData.initial_balance) {
      toast.error("Nombre y saldo inicial son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company_id: user.company_id,
        name: formData.name,
        alias: formData.alias || null,
        type: formData.type,
        platform: formData.platform || null,
        account_number: formData.account_number || null,
        currency: formData.currency,
        initial_balance: Number(formData.initial_balance),
        current_balance: Number(formData.initial_balance),
        min_alert_balance: Number(formData.min_alert_balance || 0),
        is_active: formData.is_active,
      };

      const { data: newAccount, error } = await supabase.from("treasury_accounts").insert(payload).select().single();
      if (error) throw error;

      // Register initial balance movement
      await supabase.from("treasury_movements").insert({
        company_id: user.company_id,
        account_id: newAccount.id,
        type: "entrada",
        amount: Number(formData.initial_balance),
        currency: formData.currency,
        description: "Saldo inicial de apertura",
        category: "Apertura",
        origin_module: "manual",
        balance_after: Number(formData.initial_balance),
      });

      toast.success("Cuenta creada exitosamente");
      setCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error("Error al crear cuenta", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("treasury_accounts").update({
        name: formData.name,
        alias: formData.alias || null,
        type: formData.type,
        platform: formData.platform || null,
        account_number: formData.account_number || null,
        currency: formData.currency,
        min_alert_balance: Number(formData.min_alert_balance || 0),
        is_active: formData.is_active,
      }).eq("id", selectedAccount.id);
      if (error) throw error;

      toast.success("Cuenta actualizada");
      setEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Error al actualizar", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (account: any) => {
    try {
      await supabase.from("treasury_accounts").update({ is_active: !account.is_active }).eq("id", account.id);
      toast.success(account.is_active ? "Cuenta desactivada" : "Cuenta activada");
      fetchData();
    } catch (err: any) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleTransfer = async () => {
    if (!transferData.from_account_id || !transferData.to_account_id || !transferData.amount) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (transferData.from_account_id === transferData.to_account_id) {
      toast.error("Las cuentas de origen y destino deben ser diferentes");
      return;
    }
    setSaving(true);
    try {
      const fromAccount = accounts.find(a => a.id === transferData.from_account_id);
      const toAccount = accounts.find(a => a.id === transferData.to_account_id);
      const amount = Number(transferData.amount);

      if (!fromAccount || !toAccount) throw new Error("Cuenta no encontrada");

      // Calculate destination amount (if different currencies)
      let destAmount = amount;
      const needsExchange = fromAccount.currency !== toAccount.currency;
      if (needsExchange && transferData.exchange_rate) {
        const exRate = Number(transferData.exchange_rate);
        if (fromAccount.currency === "usd" && toAccount.currency === "bs") {
          destAmount = amount * exRate;
        } else if (fromAccount.currency === "bs" && toAccount.currency === "usd") {
          destAmount = amount / exRate;
        } else {
          destAmount = amount * exRate;
        }
      }

      // 1. Debit from source
      const newFromBalance = Number(fromAccount.current_balance) - amount;
      const { error: e1 } = await supabase.from("treasury_accounts").update({ current_balance: newFromBalance }).eq("id", fromAccount.id);
      if (e1) throw e1;

      await supabase.from("treasury_movements").insert({
        company_id: user.company_id,
        account_id: fromAccount.id,
        type: "salida",
        amount,
        currency: fromAccount.currency,
        description: `Transferencia a ${toAccount.name}${transferData.notes ? ': ' + transferData.notes : ''}`,
        category: "Transferencia Interna",
        origin_module: "transferencia",
        balance_after: newFromBalance,
      });

      // 2. Credit to destination
      const newToBalance = Number(toAccount.current_balance) + destAmount;
      const { error: e2 } = await supabase.from("treasury_accounts").update({ current_balance: newToBalance }).eq("id", toAccount.id);
      if (e2) throw e2;

      await supabase.from("treasury_movements").insert({
        company_id: user.company_id,
        account_id: toAccount.id,
        type: "entrada",
        amount: destAmount,
        currency: toAccount.currency,
        description: `Transferencia desde ${fromAccount.name}${transferData.notes ? ': ' + transferData.notes : ''}`,
        category: "Transferencia Interna",
        origin_module: "transferencia",
        balance_after: newToBalance,
      });

      // Check low balance alerts
      if (fromAccount.min_alert_balance > 0 && newFromBalance < fromAccount.min_alert_balance) {
        toast.warning(`${fromAccount.name} tiene saldo bajo: ${formatCurrency(newFromBalance)}`);
      }
      if (newFromBalance <= 0) {
        toast.error(`${fromAccount.name} ha quedado en $0 o negativo`);
      }

      toast.success("Transferencia realizada exitosamente");
      setTransferOpen(false);
      setTransferData({ from_account_id: "", to_account_id: "", amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "", exchange_rate: "" });
      fetchData();
    } catch (err: any) {
      toast.error("Error en transferencia", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const fetchMovements = async (accountId: string) => {
    setMovementsLoading(true);
    try {
      const { data, error } = await supabase
        .from("treasury_movements")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setMovements(data || []);
    } catch {
      setMovements([]);
    } finally {
      setMovementsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", alias: "", type: "banco", platform: "", account_number: "", currency: "usd", initial_balance: "", min_alert_balance: "0", is_active: true });
  };

  const openEdit = (account: any) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      alias: account.alias || "",
      type: account.type,
      platform: account.platform || "",
      account_number: account.account_number || "",
      currency: account.currency,
      initial_balance: account.initial_balance?.toString() || "0",
      min_alert_balance: account.min_alert_balance?.toString() || "0",
      is_active: account.is_active,
    });
    setEditOpen(true);
  };

  // Check if transfer needs exchange rate
  const transferFromAccount = accounts.find(a => a.id === transferData.from_account_id);
  const transferToAccount = accounts.find(a => a.id === transferData.to_account_id);
  const needsExchangeRate = transferFromAccount && transferToAccount && transferFromAccount.currency !== transferToAccount.currency;

  // Preload BCV rate when transfer modal opens with different currencies
  useEffect(() => {
    if (needsExchangeRate && rate && !transferData.exchange_rate) {
      setTransferData(prev => ({ ...prev, exchange_rate: rate.toString() }));
    }
  }, [needsExchangeRate, rate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-montserrat font-bold text-text-1">Mis Cuentas y Tesorería</h1>
          <p className="text-text-2 mt-1 text-sm font-medium">Gestiona tus saldos bancarios, efectivo y plataformas digitales</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTransferOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-surface-card border border-border text-text-1 rounded-xl font-bold shadow-sm hover:bg-surface-hover/10 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 text-brand" /> Transferencia entre Cuentas
          </button>
          <button
            onClick={() => { resetForm(); setCreateOpen(true); }}
            className="px-6 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Total Consolidado USD</p><p className="text-xl font-bold text-text-1">{formatCurrency(summary.totalUsd)}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Banknote className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Total en Bolívares</p><p className="text-xl font-bold text-text-1">Bs. {Number(summary.totalBs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p></div>
        </Card>
        <Card className="p-5 bg-surface-card border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Total USD Puro</p><p className="text-xl font-bold text-text-1">{formatCurrency(summary.totalUsdPure)}</p></div>
        </Card>
      </div>

      {/* Buscador */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
        <Input placeholder="Buscar cuenta..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-surface-card border-border shadow-sm" />
      </div>

      {/* TABLA DE CUENTAS */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-surface-base text-[11px] font-bold text-text-3 uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Cuenta</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Banco / Plataforma</th>
                <th className="px-6 py-4 text-center">Moneda</th>
                <th className="px-6 py-4 text-right">Saldo Actual</th>
                <th className="px-6 py-4 text-right">Equiv. USD</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" /></td></tr>
              ) : filteredAccounts.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-text-3">
                  {accounts.length === 0 ? "No tienes cuentas registradas. Crea tu primera cuenta para comenzar." : "No se encontraron cuentas."}
                </td></tr>
              ) : (
                filteredAccounts.map((account, idx) => {
                  const typeConfig = ACCOUNT_TYPE_CONFIG[account.type] || ACCOUNT_TYPE_CONFIG.banco;
                  const TypeIcon = typeConfig.icon;
                  const status = getStatusIndicator(account);
                  const equivUsd = getEquivalentUsd(account);

                  return (
                    <motion.tr key={account.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className={cn("hover:bg-surface-hover/20 transition-colors", !account.is_active && "opacity-50")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeConfig.bg, typeConfig.color)}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-text-1">{account.name}</p>
                            {account.alias && <p className="text-[10px] text-text-3">{account.alias}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest", typeConfig.bg, typeConfig.color, `border-current/20`)}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-2 font-medium">{account.platform || "—"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-text-1">{CURRENCY_LABELS[account.currency] || account.currency}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-mono font-bold text-text-1">
                          {account.currency === "bs" ? "Bs. " : account.currency === "usdt" ? "USDT " : "$"}
                          {Number(account.current_balance || 0).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-mono font-bold text-brand">{formatCurrency(equivUsd)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", status.color)} />
                          <span className={cn("text-[10px] font-bold uppercase", status.textColor)}>
                            {account.is_active ? status.label : "Inactivo"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => { setSelectedAccount(account); fetchMovements(account.id); setMovementsOpen(true); }} className="p-2 hover:bg-brand/10 text-brand rounded-lg transition-colors" title="Ver movimientos">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(account)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleActive(account)} className="p-2 hover:bg-orange-500/10 text-orange-500 rounded-lg transition-colors" title={account.is_active ? "Desactivar" : "Activar"}>
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── DIALOG: NUEVA CUENTA ─── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-surface-card border-border sm:max-w-2xl text-text-1">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-montserrat">Nueva Cuenta</DialogTitle>
            <DialogDescription className="text-text-3 text-xs">Registra una nueva cuenta bancaria, efectivo o plataforma digital.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Nombre de la Cuenta *</label>
              <Input placeholder="Ej: Banesco Principal, Caja Chica Sede" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Alias (opcional)</label>
              <Input placeholder="Ej: Cuenta de Impuestos" value={formData.alias} onChange={e => setFormData(p => ({ ...p, alias: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Tipo</label>
              <Select value={formData.type} onValueChange={val => setFormData(p => ({ ...p, type: val }))}>
                <SelectTrigger className="h-11 bg-surface-input"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Banco o Plataforma</label>
              <Input placeholder="Banesco, Mercantil, Zelle, Binance..." value={formData.platform} onChange={e => setFormData(p => ({ ...p, platform: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Número de Cuenta (opcional)</label>
              <Input placeholder="0134-XXXX-XX-XXXXXXXX" value={formData.account_number} onChange={e => setFormData(p => ({ ...p, account_number: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Moneda</label>
              <Select value={formData.currency} onValueChange={val => setFormData(p => ({ ...p, currency: val }))}>
                <SelectTrigger className="h-11 bg-surface-input"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  <SelectItem value="bs">Bolívares (Bs)</SelectItem>
                  <SelectItem value="usd">Dólares (USD)</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider text-brand">Saldo Inicial *</label>
              <Input type="number" step="0.01" placeholder="0.00" value={formData.initial_balance} onChange={e => setFormData(p => ({ ...p, initial_balance: e.target.value }))} className="h-11 bg-surface-input text-lg font-bold font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Saldo Mínimo de Alerta</label>
              <Input type="number" step="0.01" placeholder="0.00" value={formData.min_alert_balance} onChange={e => setFormData(p => ({ ...p, min_alert_balance: e.target.value }))} className="h-11 bg-surface-input font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-brand/5 border border-brand/20 rounded-xl">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-5 h-5 accent-brand" />
                <div>
                  <p className="text-sm font-bold text-text-1">Cuenta Activa</p>
                  <p className="text-[10px] text-text-3">Las cuentas inactivas no aparecen en los selectores de pago</p>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="px-6 py-2 text-text-3 font-bold">Cancelar</button>
            <button disabled={saving} onClick={handleSaveAccount} className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Guardar Cuenta</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: EDITAR CUENTA ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-surface-card border-border sm:max-w-2xl text-text-1">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-montserrat">Editar Cuenta</DialogTitle>
            <DialogDescription className="text-text-3 text-xs">Modifica los datos de la cuenta. El saldo actual no se puede editar directamente.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Nombre de la Cuenta</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Alias</label>
              <Input value={formData.alias} onChange={e => setFormData(p => ({ ...p, alias: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Tipo</label>
              <Select value={formData.type} onValueChange={val => setFormData(p => ({ ...p, type: val }))}>
                <SelectTrigger className="h-11 bg-surface-input"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Banco o Plataforma</label>
              <Input value={formData.platform} onChange={e => setFormData(p => ({ ...p, platform: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Número de Cuenta</label>
              <Input value={formData.account_number} onChange={e => setFormData(p => ({ ...p, account_number: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Saldo Mínimo de Alerta</label>
              <Input type="number" step="0.01" value={formData.min_alert_balance} onChange={e => setFormData(p => ({ ...p, min_alert_balance: e.target.value }))} className="h-11 bg-surface-input font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-brand/5 border border-brand/20 rounded-xl">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-5 h-5 accent-brand" />
                <div>
                  <p className="text-sm font-bold text-text-1">Cuenta Activa</p>
                  <p className="text-[10px] text-text-3">Desactivar esta cuenta la oculta de los selectores</p>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="px-6 py-2 text-text-3 font-bold">Cancelar</button>
            <button disabled={saving} onClick={handleUpdateAccount} className="px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-brand flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: TRANSFERENCIA ENTRE CUENTAS ─── */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="bg-surface-card border-border sm:max-w-xl text-text-1">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-montserrat flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-brand" /> Transferencia entre Cuentas</DialogTitle>
            <DialogDescription className="text-text-3 text-xs">Mueve fondos entre tus cuentas registradas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Cuenta Origen</label>
              <Select value={transferData.from_account_id} onValueChange={val => setTransferData(p => ({ ...p, from_account_id: val }))}>
                <SelectTrigger className="h-11 bg-surface-input"><SelectValue placeholder="Selecciona cuenta de origen..." /></SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  {accounts.filter(a => a.is_active).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({CURRENCY_LABELS[a.currency]}: {Number(a.current_balance).toLocaleString("es-VE", { minimumFractionDigits: 2 })})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-text-3" /></div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Cuenta Destino</label>
              <Select value={transferData.to_account_id} onValueChange={val => setTransferData(p => ({ ...p, to_account_id: val }))}>
                <SelectTrigger className="h-11 bg-surface-input"><SelectValue placeholder="Selecciona cuenta de destino..." /></SelectTrigger>
                <SelectContent className="bg-surface-card border-border text-black">
                  {accounts.filter(a => a.is_active && a.id !== transferData.from_account_id).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} ({CURRENCY_LABELS[a.currency]}: {Number(a.current_balance).toLocaleString("es-VE", { minimumFractionDigits: 2 })})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Monto</label>
              <Input type="number" step="0.01" placeholder="0.00" value={transferData.amount} onChange={e => setTransferData(p => ({ ...p, amount: e.target.value }))} className="h-12 bg-surface-input text-lg font-bold font-mono" />
            </div>

            {needsExchangeRate && (
              <div className="space-y-1.5 p-4 bg-brand/5 border border-brand/20 rounded-xl">
                <label className="text-xs font-bold text-brand uppercase tracking-wider">Tasa de Cambio (BCV precargada, editable)</label>
                <Input type="number" step="0.0001" value={transferData.exchange_rate} onChange={e => setTransferData(p => ({ ...p, exchange_rate: e.target.value }))} className="h-11 bg-surface-input font-mono text-brand font-bold" />
                <p className="text-[10px] text-text-3">
                  {transferFromAccount && transferToAccount && transferData.amount && transferData.exchange_rate ? (
                    <>Convertir {Number(transferData.amount).toFixed(2)} {CURRENCY_LABELS[transferFromAccount.currency]} = {
                      transferFromAccount.currency === "usd" && transferToAccount.currency === "bs"
                        ? (Number(transferData.amount) * Number(transferData.exchange_rate)).toFixed(2)
                        : (Number(transferData.amount) / Number(transferData.exchange_rate)).toFixed(2)
                    } {CURRENCY_LABELS[transferToAccount.currency]}</>
                  ) : "Ingresa monto y tasa para ver conversión"}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Fecha</label>
              <Input type="date" value={transferData.date} onChange={e => setTransferData(p => ({ ...p, date: e.target.value }))} className="h-11 bg-surface-input" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-3 uppercase tracking-wider">Notas (opcional)</label>
              <Input placeholder="Descripción de la transferencia..." value={transferData.notes} onChange={e => setTransferData(p => ({ ...p, notes: e.target.value }))} className="h-11 bg-surface-input" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setTransferOpen(false)} className="px-6 py-2 text-text-3 font-bold">Cancelar</button>
            <button disabled={saving} onClick={handleTransfer} className="px-8 py-3 bg-brand-gradient text-white rounded-xl font-bold shadow-brand flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowLeftRight className="w-4 h-4" /> Confirmar Transferencia</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: VER MOVIMIENTOS ─── */}
      <Dialog open={movementsOpen} onOpenChange={setMovementsOpen}>
        <DialogContent className="bg-surface-card border-border sm:max-w-2xl text-text-1 max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-montserrat flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand" /> Movimientos: {selectedAccount?.name}
            </DialogTitle>
            <DialogDescription className="text-text-3 text-xs">
              Saldo actual: <span className="text-text-1 font-bold font-mono">
                {selectedAccount?.currency === "bs" ? "Bs. " : "$"}
                {Number(selectedAccount?.current_balance || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-2">
            {movementsLoading ? (
              <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" /></div>
            ) : movements.length === 0 ? (
              <div className="py-10 text-center text-text-3 text-sm italic">No hay movimientos registrados.</div>
            ) : (
              movements.map(m => (
                <div key={m.id} className="p-4 bg-surface-base rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.type === "entrada" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                      {m.type === "entrada" ? <TrendingUp className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-90" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-1">{m.description}</p>
                      <p className="text-[10px] text-text-3 flex items-center gap-2">
                        <span>{format(new Date(m.created_at), "dd/MM/yy HH:mm")}</span>
                        <span className="px-1.5 py-0.5 rounded bg-brand/10 text-brand text-[8px] font-black uppercase">{m.origin_module}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-mono font-bold", m.type === "entrada" ? "text-emerald-500" : "text-red-500")}>
                      {m.type === "entrada" ? "+" : "-"}{Number(m.amount).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-text-3 font-mono">Saldo: {Number(m.balance_after).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setMovementsOpen(false)} className="w-full px-6 py-3 bg-surface-base border border-border rounded-xl font-bold">Cerrar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
