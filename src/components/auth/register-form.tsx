"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
  Wallet,
  Upload,
  AlertCircle,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

const formSchema = z.object({
  companyName: z.string().min(2, "Mínimo 2 caracteres"),
  rif: z.string().min(6, "Debe ser un RIF válido (Ej: J-12345678-9)"),
  fullName: z.string().min(3, "Ingresa tu nombre completo"),
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  plan: z.enum(["basic", "pro", "enterprise"]),
  paymentMethod: z.string().optional(),
  paymentName: z.string().optional(),
  paymentLast4: z.string().optional(),
  paymentEmail: z.string().optional(),
  paymentBank: z.string().optional(),
  paymentPhone: z.string().optional(),
  paymentDni: z.string().optional(),
  paymentRef: z.string().optional(),
  paymentConfirmed: z.boolean().optional(),
});

const steps = [
  { id: 1, title: "Empresa", icon: Building2 },
  { id: 2, title: "Administrador", icon: User },
  { id: 3, title: "Plan", icon: CreditCard },
  { id: 4, title: "Pago", icon: Wallet },
];

const plans = [
  {
    id: "basic",
    name: "Lumis Starter",
    price: "$19.99",
    period: "/mes",
    desc: "Se acabó el desorden de facturas y el Excel manual",
    features: ["Facturación básica", "CRM esencial", "Control de deudas"],
  },
  {
    id: "pro",
    name: "Lumis Pro Business",
    price: "$79.99",
    period: "/mes",
    desc: "Multiplica tus ventas con WhatsApp y CRM integrado",
    features: ["CRM avanzado", "Integración WhatsApp", "Ventas Pro"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Lumis Enterprise",
    price: "$119.99",
    period: "/mes",
    desc: "Control total de todas tus sedes y distribuidores",
    features: ["Multi-sucursal", "Control distribuidores", "Soporte VIP"],
  },
];

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      rif: "",
      fullName: "",
      email: "",
      password: "",
      plan: "basic",
      paymentMethod: "",
      paymentConfirmed: false,
    },
  });

  const selectedPlanId = form.watch("plan");
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const paymentMethod = form.watch("paymentMethod");
  const paymentConfirmed = form.watch("paymentConfirmed");

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["companyName", "rif"]);
    } else if (step === 2) {
      isValid = await form.trigger(["fullName", "email", "password"]);
    } else if (step === 3) {
      isValid = await form.trigger(["plan"]);
    } else {
      isValid = true;
    }
    if (isValid && step < 4) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo no puede superar los 5MB");
        return;
      }
      setReceiptFile(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (step < 4) return;
    
    // Validación de Paso 4
    if (!paymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }
    if (!receiptFile) {
      toast.error("Debes adjuntar el comprobante de pago");
      return;
    }
    if (!paymentConfirmed) {
      toast.error("Debes confirmar que realizaste el pago");
      return;
    }

    if (paymentMethod === "zinli" && (!values.paymentName || !values.paymentLast4 || !values.paymentEmail)) {
      toast.error("Completa todos los campos de referencia para Zinli");
      return;
    }
    if (paymentMethod === "pago_movil" && (!values.paymentBank || !values.paymentPhone || !values.paymentDni || !values.paymentRef)) {
      toast.error("Completa todos los campos de referencia para Pago Móvil");
      return;
    }
    if (paymentMethod === "zelle" && (!values.paymentEmail || !values.paymentName)) {
      toast.error("Completa los campos requeridos para Zelle (Correo/Teléfono y Nombre)");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError || !authData.user) {
        toast.error("Error al registrar usuario", {
          description: authError?.message,
        });
        setIsLoading(false);
        return;
      }

      // Crear empresa en estado pendiente
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: values.companyName,
          rif: values.rif,
          plan_type: values.plan,
          primary_color: "#E040FB",
          subscription_status: "pending_verification"
        } as any)
        .select("id")
        .single();

      if (companyError || !companyData) {
        toast.error("Error al registrar empresa", {
          description: companyError?.message,
        });
        setIsLoading(false);
        return;
      }

      const cData = companyData as any;

      // Subir archivo
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${cData.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, receiptFile);

      let receiptUrl = "";
      if (uploadData) {
        const { data: publicURLData } = supabase.storage.from("receipts").getPublicUrl(uploadData.path);
        receiptUrl = publicURLData.publicUrl;
      }

      // Guardar pago
      const refData = paymentMethod === "zinli" 
        ? { name: values.paymentName, last4: values.paymentLast4, email: values.paymentEmail }
        : paymentMethod === "pago_movil"
        ? { bank: values.paymentBank, phone: values.paymentPhone, dni: values.paymentDni, ref: values.paymentRef }
        : { email: values.paymentEmail, name: values.paymentName, last4: values.paymentLast4 };

      await supabase.from("subscription_payments").insert({
        company_id: cData.id,
        plan_type: values.plan,
        method: paymentMethod,
        reference_data: refData,
        receipt_url: receiptUrl,
        status: "pending"
      } as any);

      // Crear Admin User
      const { error: userError } = await supabase.from("users").insert({
        auth_id: authData.user.id,
        company_id: cData.id,
        full_name: values.fullName,
        email: values.email,
        role: "admin",
      } as any);

      if (userError) {
        toast.error("Error al crear perfil", {
          description: userError.message,
        });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 3500);
    } catch (err: any) {
      toast.error("Error inesperado: " + err.message);
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl w-full text-center flex flex-col items-center shadow-2xl border border-white"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-20 h-20 bg-brand rounded-full flex items-center justify-center mb-6 shadow-lg shadow-brand/30"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-[#1A1125] font-outfit mb-3">
          ¡Documentación Recibida!
        </h2>
        <p className="text-[#64748B] font-medium font-outfit mb-2">
          Gracias por subir tu comprobante de pago, {form.getValues().fullName}.
        </p>
        <p className="text-brand font-bold font-outfit text-sm max-w-sm mb-6 bg-brand/5 p-3 rounded-lg border border-brand/10">
          Tu pago está siendo verificado. Recibirás acceso completo en un máximo de 24 horas.
        </p>
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </motion.div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col pt-1">
      {/* Progress Bar */}
      <div className="mb-6 relative px-4 shrink-0">
        <div className="flex justify-between relative z-10">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            const isProcessing = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ scale: isProcessing ? 1.15 : 1 }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border ${
                    isActive
                      ? "bg-brand text-white border-brand shadow-brand/20"
                      : "bg-[#F8FAFC] text-[#94A3B8] border-[#EDF2F7]"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
                <span
                  className={`text-[9px] sm:text-[11px] font-bold font-outfit uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? "text-brand" : "text-[#94A3B8]"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="absolute top-5 sm:top-6 left-10 right-10 h-[2px] bg-[#EDF2F7] -z-0">
          <motion.div
            className="h-full bg-brand"
            initial={{ width: "0%" }}
            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-[32px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative flex flex-col flex-1 min-h-[480px]"
        >
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand/10 via-brand to-brand/10" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 flex flex-col flex-1">
              
              {/* STEP 1 */}
              <div className={step === 1 ? "space-y-5 flex-1" : "hidden"}>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#1A1125] font-outfit">Datos de la Empresa</h3>
                  <p className="text-xs text-[#64748B] font-medium font-outfit">Cuéntanos un poco sobre tu negocio</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Distribuidora Los Andes C.A." {...field} className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20" />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">RIF</FormLabel>
                      <FormControl>
                        <Input placeholder="J-12345678-9" {...field} className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20 uppercase" />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold" />
                    </FormItem>
                  )}
                />
              </div>

              {/* STEP 2 */}
              <div className={step === 2 ? "space-y-5 flex-1" : "hidden"}>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#1A1125] font-outfit">Cuenta del Administrador</h3>
                  <p className="text-xs text-[#64748B] font-medium font-outfit">Crea las credenciales de acceso principal</p>
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20" />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="juan@empresa.com" {...field} className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20" />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20" />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold" />
                    </FormItem>
                  )}
                />
              </div>

              {/* STEP 3 */}
              <div className={step === 3 ? "flex flex-col flex-1" : "hidden"}>
                <div className="space-y-1 mb-4">
                  <h3 className="text-xl font-bold text-[#1A1125] font-outfit">Selecciona un Plan</h3>
                  <p className="text-xs text-[#64748B] font-medium font-outfit">Elige el plan que mejor se adapte a ti</p>
                </div>

                <div className="grid grid-cols-1 gap-3 overflow-y-auto no-scrollbar max-h-[300px] pb-2 pr-1">
                  {plans.map((p) => {
                    const isSelected = form.watch("plan") === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => form.setValue("plan", p.id as "basic" | "pro" | "enterprise")}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer active:scale-[0.98] shrink-0 ${
                          isSelected ? "bg-brand/[0.04] border-brand border-2 shadow-sm" : "bg-[#F8FAFC] border-[#EDF2F7] hover:border-brand/30"
                        }`}
                      >
                        {p.popular && (
                          <div className="absolute -top-3 right-5 px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 shadow-lg shadow-brand/20">
                            <Sparkles className="w-3 h-3" /> POPULAR
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className={`font-bold font-outfit ${isSelected ? "text-brand" : "text-[#1A1125]"}`}>{p.name}</p>
                            <p className="text-[11px] font-medium text-[#64748B] font-outfit leading-snug pr-2">{p.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span className={`text-xl font-black font-outfit ${isSelected ? "text-brand" : "text-[#1A1125]"}`}>{p.price}</span>
                              <span className="text-[10px] font-bold text-[#94A3B8] font-outfit uppercase tracking-tighter">{p.period}</span>
                            </div>
                            {isSelected && (
                               <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center mt-2 ml-auto">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: PAGO */}
              <div className={step === 4 ? "flex flex-col flex-1" : "hidden"}>
                 <div className="flex items-center justify-between p-3 bg-brand/5 border border-brand/10 rounded-xl mb-4 shrink-0">
                   <div>
                     <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider font-outfit">Plan Seleccionado</p>
                     <p className="font-bold font-outfit text-brand">{selectedPlan?.name}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-lg font-black font-outfit text-[#1A1125]">{selectedPlan?.price}<span className="text-[10px] font-bold text-[#94A3B8]">/mes</span></p>
                   </div>
                 </div>

                 <div className="flex-1 overflow-y-auto no-scrollbar pb-2 relative">
                   <p className="text-xs font-bold text-[#1A1125] font-outfit mb-3">Métodos de Pago Disponibles</p>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
                     {[
                       { id: "pago_movil", name: "Pago Móvil", active: true },
                       { id: "zinli", name: "Zinli", active: true },
                       { id: "zelle", name: "Zelle\u00AE", active: true },
                       { id: "stripe", name: "Stripe", active: false },
                       { id: "paypal", name: "PayPal", active: false }
                     ].map(pm => {
                       const isSelected = paymentMethod === pm.id;
                       return (
                         <div 
                           key={pm.id} 
                           onClick={() => pm.active ? form.setValue("paymentMethod", pm.id) : toast.info("Disponible en la siguiente actualización")}
                           className={`p-3 rounded-lg border flex items-center justify-center text-center cursor-pointer transition-all ${
                             !pm.active ? "opacity-40 grayscale cursor-not-allowed bg-white" :
                             isSelected ? "border-brand bg-brand/5 shadow-sm text-brand font-bold" : "border-[#EDF2F7] bg-[#F8FAFC] text-[#64748B] hover:border-brand/30"
                           }`}
                         >
                           <span className="text-xs font-outfit font-bold">{pm.name}</span>
                         </div>
                       )
                     })}
                   </div>

                   {/* Dynamic Form for the selected method */}
                   {paymentMethod && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2 border-t border-[#EDF2F7]">
                       {paymentMethod === "zinli" && (
                         <div className="grid grid-cols-2 gap-3">
                           <div className="col-span-2">
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Nombre del Titular</Label>
                             <Input {...form.register("paymentName")} className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                           <div>
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Últimos 4 (TDC)</Label>
                             <Input {...form.register("paymentLast4")} maxLength={4} placeholder="xxxx" className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                           <div>
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Correo Asociado</Label>
                             <Input {...form.register("paymentEmail")} type="email" className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                         </div>
                       )}

                       {paymentMethod === "pago_movil" && (
                         <div className="grid grid-cols-2 gap-3">
                           <div>
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Banco Emisor</Label>
                             <Input {...form.register("paymentBank")} placeholder="Ej. Banesco" className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                           <div>
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Número de Referencia</Label>
                             <Input {...form.register("paymentRef")} placeholder="00001234..." className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                           <div>
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Teléfono</Label>
                             <Input {...form.register("paymentPhone")} placeholder="0414..." className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                           <div>
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Cédula</Label>
                             <Input {...form.register("paymentDni")} placeholder="V-123..." className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                         </div>
                       )}

                       {paymentMethod === "zelle" && (
                         <div className="grid grid-cols-2 gap-3">
                           <div className="col-span-2">
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Nombre del Titular</Label>
                             <Input {...form.register("paymentName")} className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                           <div className="col-span-2">
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Correo o Teléfono Emisor</Label>
                             <Input {...form.register("paymentEmail")} className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                           <div className="col-span-2">
                             <Label className="text-[11px] font-bold text-[#64748B] uppercase">Últimos 4 (Banco Origen/Opcional)</Label>
                             <Input {...form.register("paymentLast4")} maxLength={4} className="bg-[#F8FAFC] border-[#E2E8F0] h-10 rounded-lg text-sm mt-1" />
                           </div>
                         </div>
                       )}

                       <div className="pt-2">
                         <Label className="text-[11px] font-bold text-[#64748B] uppercase mb-1 block">Comprobante de Pago (Max 5MB)</Label>
                         <input type="file" ref={fileInputRef} accept=".jpg,.png,.jpeg,.pdf" className="hidden" onChange={handleFileChange} />
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className={`w-full h-16 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                              receiptFile ? "border-brand bg-brand/5" : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-brand/40 hover:bg-white"
                           }`}
                         >
                           {receiptFile ? (
                              <>
                                <FileText className="w-5 h-5 text-brand" />
                                <span className="text-xs font-bold text-brand truncate max-w-[200px]">{receiptFile.name}</span>
                              </>
                           ) : (
                              <>
                                <Upload className="w-4 h-4 text-[#94A3B8]" />
                                <span className="text-xs font-bold text-[#64748B]">Click para subir captura (JPG, PNG, PDF)</span>
                              </>
                           )}
                         </div>
                       </div>
                       
                       <div className="flex items-center space-x-2 pt-2">
                         <input 
                           type="checkbox"
                           id="confirmPayment" 
                           checked={paymentConfirmed} 
                           onChange={(e) => form.setValue("paymentConfirmed", e.target.checked)}
                           className="w-4 h-4 rounded border-[#CED4DA] text-brand focus:ring-brand accent-brand"
                         />
                         <label
                           htmlFor="confirmPayment"
                           className="text-xs font-medium text-[#1A1125] leading-snug cursor-pointer"
                         >
                           Confirmo que he realizado el pago y los datos son correctos.
                         </label>
                       </div>
                     </motion.div>
                   )}
                 </div>
              </div>

              <div className="flex justify-between shrink-0 pt-4 mt-auto border-t border-[#EDF2F7]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={step === 1 || isLoading}
                  className="text-[#64748B] hover:text-[#1A1125] hover:bg-[#F8FAFC] rounded-xl font-bold font-outfit text-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-brand hover:opacity-90 text-white font-bold rounded-xl px-8 shadow-lg shadow-brand/20 h-10 sm:h-12 transition-all active:scale-95 font-outfit uppercase tracking-widest text-xs"
                  >
                    Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-brand hover:opacity-90 text-white font-bold rounded-xl px-4 sm:px-8 shadow-lg shadow-brand/20 h-10 sm:h-12 transition-all active:scale-95 font-outfit text-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Verificar Pago e Iniciar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 text-center text-sm shrink-0">
        <span className="text-[#64748B] font-medium font-outfit">¿Ya tienes una cuenta?</span>{" "}
        <Link
          href="/login"
          className="text-brand hover:underline font-bold transition-all font-outfit"
        >
          Inicia Sesión
        </Link>
      </div>
    </div>
  );
}
