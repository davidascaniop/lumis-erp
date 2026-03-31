"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShieldCheck, Zap, Percent, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CommissionRule {
  id: string;
  type: "brand" | "department" | "price_level" | "global";
  value: string;
  percentage: number;
  condition: "sale" | "collection";
}

export function CommissionRulesEditor({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user?.commission_rules) {
      setRules(user.commission_rules as CommissionRule[]);
    } else {
      setRules([]);
    }
  }, [user]);

  const addRule = () => {
    const newRule: CommissionRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: "global",
      value: "all",
      percentage: 0,
      condition: "sale",
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<CommissionRule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ commission_rules: rules })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Reglas de comisión actualizadas");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error al guardar reglas", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-surface-card border-border text-text-1 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-montserrat font-bold text-text-1">
            <Percent className="text-brand w-6 h-6" />
            Reglas de Comisión: {user?.full_name}
          </DialogTitle>
          <DialogDescription className="text-text-2 font-medium">
            Define cómo gana {user?.full_name?.split(" ")[0] || "el usuario"} sus comisiones según marca, departamento o tipo de precio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
          {rules.length === 0 && (
            <div className="text-center py-10 bg-surface-base/50 rounded-2xl border border-dashed border-border/60">
              <Target className="w-10 h-10 text-text-3/20 mx-auto mb-2" />
              <p className="text-text-3 text-sm font-medium">No hay reglas configuradas.</p>
            </div>
          )}

          {rules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-12 gap-3 items-end bg-surface-base p-4 rounded-xl border border-border/40 group animate-in fade-in zoom-in-95 duration-200 shadow-sm">
              <div className="col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Criterio</label>
                <Select value={rule.type} onValueChange={(v: any) => updateRule(rule.id, { type: v, value: v === "global" ? "all" : "" })}>
                  <SelectTrigger className="bg-surface-card border border-border/30 text-text-1 h-10 rounded-lg shadow-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-elevated border-border text-text-1 z-[9999]">
                    <SelectItem value="global">Global (Todo)</SelectItem>
                    <SelectItem value="brand">Marca</SelectItem>
                    <SelectItem value="department">Departamento</SelectItem>
                    <SelectItem value="price_level">Tipo de Precio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Valor</label>
                {rule.type === "global" ? (
                  <Input disabled value="Todos los items" className="bg-surface-card border border-border/30 opacity-50 h-10 rounded-lg text-text-3 font-medium" />
                ) : rule.type === "price_level" ? (
                  <Select value={rule.value} onValueChange={(v) => updateRule(rule.id, { value: v })}>
                    <SelectTrigger className="bg-surface-card border border-border/30 text-text-1 h-10 rounded-lg shadow-sm font-medium">
                      <SelectValue placeholder="Nivel..." />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-elevated border-border text-text-1 z-[9999]">
                      <SelectItem value="price_usd">P1: General</SelectItem>
                      <SelectItem value="price_usd_2">P2: Mayorista</SelectItem>
                      <SelectItem value="price_usd_3">P3: Distribuidor</SelectItem>
                      <SelectItem value="price_usd_4">P4: Oferta</SelectItem>
                      <SelectItem value="price_usd_5">P5: VIP</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    value={rule.value} 
                    onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                    placeholder="Ej. Polar, Hogar..."
                    className="bg-surface-card border border-border/30 h-10 text-text-1 rounded-lg shadow-sm font-medium"
                  />
                )}
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">% Com.</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={rule.percentage} 
                    onChange={(e) => updateRule(rule.id, { percentage: Number(e.target.value) })}
                    className="bg-surface-card border border-border/30 pr-6 h-10 font-bold font-mono text-brand rounded-lg shadow-sm"
                  />
                  <span className="absolute right-2 top-2.5 text-[10px] text-text-3 font-bold">%</span>
                </div>
              </div>

              <div className="col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold text-text-3 uppercase tracking-wider">Trigger</label>
                <Select value={rule.condition} onValueChange={(v: any) => updateRule(rule.id, { condition: v })}>
                  <SelectTrigger className="bg-surface-card border border-border/30 text-text-1 h-10 rounded-lg shadow-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-elevated border-border text-text-1 z-[9999]">
                    <SelectItem value="sale">💳 Al Vender</SelectItem>
                    <SelectItem value="collection">💰 Al Cobrar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 pb-1">
                <button 
                  onClick={() => removeRule(rule.id)}
                  className="p-2 text-status-danger/40 hover:text-status-danger hover:bg-status-danger/10 rounded-lg transition-all border border-transparent hover:border-status-danger/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-border/40">
          <button 
            onClick={addRule}
            className="flex items-center gap-2 text-sm font-bold text-brand hover:opacity-80 transition-all font-montserrat"
          >
            <Plus className="w-5 h-5" /> Agregar Regla
          </button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white border border-border/40 text-text-2 hover:bg-surface-base font-bold rounded-xl px-6 h-11 transition-all">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-brand-gradient hover:opacity-90 text-white font-bold px-8 shadow-brand rounded-xl h-11 transition-all">
              {loading ? "Guardando..." : "Guardar Reglas"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
