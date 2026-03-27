"use client";

import { useState } from "react";
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
});

const steps = [
  { id: 1, title: "Empresa", icon: Building2 },
  { id: 2, title: "Administrador", icon: User },
  { id: 3, title: "Plan", icon: CreditCard },
];

const plans = [
  {
    id: "basic",
    name: "Básico",
    price: "$29",
    period: "/mes",
    desc: "Hasta 2 usuarios, módulos esenciales",
    features: ["2 usuarios", "CRM básico", "Pedidos", "Cobranza"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79",
    period: "/mes",
    desc: "Hasta 10 usuarios, módulos avanzados",
    features: ["10 usuarios", "CRM completo", "Reportes", "API access"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "/mes",
    desc: "Usuarios ilimitados, soporte dedicado",
    features: ["Ilimitados", "White-label", "Soporte 24/7", "Custom"],
  },
];

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      rif: "",
      fullName: "",
      email: "",
      password: "",
      plan: "basic",
    },
  });

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["companyName", "rif"]);
    } else if (step === 2) {
      isValid = await form.trigger(["fullName", "email", "password"]);
    } else {
      isValid = true;
    }
    if (isValid && step < 3) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: values.companyName,
          rif: values.rif,
          plan_type: values.plan,
          primary_color: "#E040FB",
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
      }, 2500);
    } catch (err) {
      toast.error("Error inesperado");
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
        <h2 className="text-2xl font-bold text-[#1A1125] font-outfit mb-2">
          ¡Compañía Creada!
        </h2>
        <p className="text-[#64748B] font-medium font-outfit">
          Bienvenido a LUMIS, {form.getValues().fullName}. Preparando tu
          entorno...
        </p>
        <Loader2 className="w-6 h-6 animate-spin text-brand mt-6" />
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-10 relative px-4">
        <div className="flex justify-between relative z-10">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            const isProcessing = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{
                    scale: isProcessing ? 1.15 : 1,
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border ${
                    isActive
                      ? "bg-brand text-white border-brand shadow-brand/20"
                      : "bg-[#F8FAFC] text-[#94A3B8] border-[#EDF2F7]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span
                  className={`text-[11px] font-bold font-outfit uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? "text-brand" : "text-[#94A3B8]"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="absolute top-6 left-10 right-10 h-[2px] bg-[#EDF2F7] -z-0">
          <motion.div
            className="h-full bg-brand"
            initial={{ width: "0%" }}
            animate={{
              width: `${((step - 1) / (steps.length - 1)) * 100}%`,
            }}
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
          className="bg-white/90 backdrop-blur-xl p-8 rounded-[32px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden min-h-[460px]"
        >
          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand/10 via-brand to-brand/10" />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 h-full flex flex-col pt-2"
            >
              {/* STEP 1 */}
              <div className={step === 1 ? "space-y-6 flex-1" : "hidden"}>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#1A1125] font-outfit">
                    Datos de la Empresa
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium font-outfit">Cuéntanos un poco sobre tu negocio</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">
                        Nombre de la Empresa
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Distribuidora Los Andes C.A."
                          {...field}
                          className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20 focus-visible:border-brand transition-all font-outfit"
                        />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold font-outfit" />
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
                        <Input
                          placeholder="J-12345678-9"
                          {...field}
                          className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20 focus-visible:border-brand transition-all font-outfit uppercase"
                        />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold font-outfit" />
                    </FormItem>
                  )}
                />
              </div>

              {/* STEP 2 */}
              <div className={step === 2 ? "space-y-6 flex-1" : "hidden"}>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#1A1125] font-outfit">
                    Cuenta del Administrador
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium font-outfit">Crea las credenciales de acceso principal</p>
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">
                        Nombre Completo
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Juan Pérez"
                          {...field}
                          className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20 focus-visible:border-brand transition-all font-outfit"
                        />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold font-outfit" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="juan@empresa.com"
                          {...field}
                          className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20 focus-visible:border-brand transition-all font-outfit"
                        />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold font-outfit" />
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
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] h-12 rounded-xl focus-visible:ring-brand/20 focus-visible:border-brand transition-all font-outfit"
                        />
                      </FormControl>
                      <FormMessage className="text-danger text-xs font-bold font-outfit" />
                    </FormItem>
                  )}
                />
              </div>

              {/* STEP 3 */}
              <div className={step === 3 ? "space-y-6 flex-1" : "hidden"}>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#1A1125] font-outfit">
                    Selecciona un Plan
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium font-outfit">Elige el plan que mejor se adapte a ti</p>
                </div>

                <div className="grid grid-cols-1 gap-3 overflow-y-auto no-scrollbar max-h-[320px] pr-1">
                  {plans.map((p) => {
                    const isSelected = form.watch("plan") === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() =>
                          form.setValue(
                            "plan",
                            p.id as "basic" | "pro" | "enterprise",
                          )
                        }
                        className={`p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer active:scale-[0.98] ${
                          isSelected
                            ? "bg-brand/[0.04] border-brand border-2 shadow-sm"
                            : "bg-[#F8FAFC] border-[#EDF2F7] hover:border-brand/30"
                        }`}
                      >
                        {p.popular && (
                          <div className="absolute -top-3 right-5 px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-full flex items-center gap-1.5 shadow-lg shadow-brand/20">
                            <Sparkles className="w-3 h-3" /> POPULAR
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className={`font-bold font-outfit ${isSelected ? "text-brand" : "text-[#1A1125]"}`}>
                              {p.name}
                            </p>
                            <p className="text-[11px] font-medium text-[#64748B] font-outfit leading-snug">
                              {p.desc}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline gap-0.5 justify-end">
                              <span className={`text-xl font-black font-outfit ${isSelected ? "text-brand" : "text-[#1A1125]"}`}>
                                {p.price}
                              </span>
                              <span className="text-[10px] font-bold text-[#94A3B8] font-outfit uppercase tracking-tighter">
                                {p.period}
                              </span>
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

              <div className="flex justify-between mt-auto pt-6 border-t border-[#EDF2F7]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={step === 1 || isLoading}
                  className="text-[#64748B] hover:text-[#1A1125] hover:bg-[#F8FAFC] rounded-xl font-bold font-outfit text-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-brand hover:opacity-90 text-white font-bold rounded-xl px-8 shadow-lg shadow-brand/20 h-12 transition-all active:scale-95 font-outfit uppercase tracking-widest text-xs"
                  >
                    Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-brand hover:opacity-90 text-white font-bold rounded-xl px-8 shadow-lg shadow-brand/20 h-12 transition-all active:scale-95 font-outfit uppercase tracking-widest text-xs"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Finalizar Registro
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 text-center text-sm">
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
