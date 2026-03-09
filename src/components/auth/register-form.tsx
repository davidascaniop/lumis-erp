"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion } from "framer-motion"
import {
    Building2,
    User,
    CreditCard,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

const formSchema = z.object({
    companyName: z.string().min(2, "Mínimo 2 caracteres"),
    rif: z.string().min(6, "Debe ser un RIF válido (Ej: J-12345678-9)"),
    fullName: z.string().min(3, "Ingresa tu nombre completo"),
    email: z.string().email("Ingresa un correo válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    plan: z.enum(["basic", "pro", "enterprise"]),
})

const steps = [
    { id: 1, title: "Empresa", icon: Building2 },
    { id: 2, title: "Administrador", icon: User },
    { id: 3, title: "Plan", icon: CreditCard },
]

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
]

export function RegisterForm() {
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

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
    })

    const nextStep = async () => {
        let isValid = false
        if (step === 1) {
            isValid = await form.trigger(["companyName", "rif"])
        } else if (step === 2) {
            isValid = await form.trigger(["fullName", "email", "password"])
        }
        if (isValid) setStep((s) => s + 1)
    }

    const prevStep = () => setStep((s) => s - 1)

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {
            // 1. Register Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
            })

            if (authError || !authData.user) {
                toast.error("Error al registrar usuario", {
                    description: authError?.message,
                })
                setIsLoading(false)
                return
            }

            // 2. Insert Company
            const { data: companyData, error: companyError } = await supabase
                .from("companies")
                .insert({
                    name: values.companyName,
                    rif: values.rif,
                    plan_type: values.plan,
                    primary_color: "#E040FB",
                })
                .select("id")
                .single()

            if (companyError || !companyData) {
                toast.error("Error al registrar empresa", {
                    description: companyError?.message,
                })
                setIsLoading(false)
                return
            }

            // 3. Insert User Profile (Admin)
            const { error: userError } = await supabase.from("users").insert({
                auth_id: authData.user.id,
                company_id: companyData.id,
                full_name: values.fullName,
                email: values.email,
                role: "admin",
            })

            if (userError) {
                toast.error("Error al crear perfil", {
                    description: userError.message,
                })
                setIsLoading(false)
                return
            }

            setIsSuccess(true)
            setTimeout(() => {
                router.push("/dashboard")
                router.refresh()
            }, 2500)
        } catch (err) {
            toast.error("Error inesperado")
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-10 rounded-2xl w-full text-center flex flex-col items-center shadow-glow"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] rounded-full flex items-center justify-center mb-6 shadow-glow"
                >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-[#F5EEFF] mb-2">
                    ¡Compañía Creada!
                </h2>
                <p className="text-[#B8A0D0]">
                    Bienvenido a LUMIS, {form.getValues().fullName}. Preparando tu
                    entorno...
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-[#E040FB] mt-6" />
            </motion.div>
        )
    }

    return (
        <div className="w-full">
            {/* Progress Bar */}
            <div className="mb-8 relative">
                <div className="flex justify-between relative z-10">
                    {steps.map((s) => {
                        const Icon = s.icon
                        const isActive = step >= s.id
                        return (
                            <div key={s.id} className="flex flex-col items-center gap-2">
                                <motion.div
                                    animate={{
                                        scale: step === s.id ? 1.1 : 1,
                                        boxShadow:
                                            step === s.id
                                                ? "0 0 20px rgba(224,64,251,0.4)"
                                                : "none",
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                            ? "bg-gradient-to-br from-[#E040FB] to-[#7C4DFF] text-white"
                                            : "bg-[#201728] text-[#6B5280] border border-[#E040FB]/10"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.div>
                                <span
                                    className={`text-xs font-medium ${isActive ? "text-[#E040FB]" : "text-[#6B5280]"
                                        }`}
                                >
                                    {s.title}
                                </span>
                            </div>
                        )
                    })}
                </div>
                <div className="absolute top-5 left-0 w-full h-[2px] bg-[#E040FB]/5 -z-0">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#E040FB] to-[#7C4DFF]"
                        initial={{ width: "0%" }}
                        animate={{
                            width: `${((step - 1) / (steps.length - 1)) * 100}%`,
                        }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    />
                </div>
            </div>

            <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                className="glass p-8 rounded-2xl w-full shadow-card relative overflow-hidden min-h-[420px]"
            >
                {/* Gradient top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E040FB] to-transparent" />

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 h-full flex flex-col"
                    >
                        {/* STEP 1 */}
                        <div className={step === 1 ? "space-y-5 flex-1" : "hidden"}>
                            <h3 className="text-xl font-semibold mb-5 text-[#F5EEFF]">
                                Datos de la Empresa
                            </h3>
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#B8A0D0]">
                                            Nombre de la Empresa
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: Distribuidora Los Andes C.A."
                                                {...field}
                                                className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/40 h-11"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[#FF4757] text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rif"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#B8A0D0]">RIF</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="J-12345678-9"
                                                {...field}
                                                className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/40 h-11 uppercase"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[#FF4757] text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* STEP 2 */}
                        <div className={step === 2 ? "space-y-5 flex-1" : "hidden"}>
                            <h3 className="text-xl font-semibold mb-5 text-[#F5EEFF]">
                                Cuenta del Administrador
                            </h3>
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#B8A0D0]">
                                            Nombre Completo
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Juan Pérez"
                                                {...field}
                                                className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/40 h-11"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[#FF4757] text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#B8A0D0]">
                                            Correo Electrónico
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="juan@empresa.com"
                                                {...field}
                                                className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/40 h-11"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[#FF4757] text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#B8A0D0]">
                                            Contraseña
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                                className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/40 h-11"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[#FF4757] text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* STEP 3 */}
                        <div className={step === 3 ? "space-y-4 flex-1" : "hidden"}>
                            <h3 className="text-xl font-semibold mb-5 text-[#F5EEFF]">
                                Selecciona un Plan
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {plans.map((p) => {
                                    const isSelected = form.watch("plan") === p.id
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() =>
                                                form.setValue(
                                                    "plan",
                                                    p.id as "basic" | "pro" | "enterprise"
                                                )
                                            }
                                            className={`p-4 rounded-xl border relative cursor-pointer transition-all duration-200 ${isSelected
                                                    ? "border-[#E040FB]/50 bg-[#E040FB]/10 shadow-glow"
                                                    : "border-[#E040FB]/8 bg-[#0F0A12]/60 hover:border-[#E040FB]/20 hover:bg-[#E040FB]/5"
                                                }`}
                                        >
                                            {"popular" in p && p.popular && (
                                                <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> POPULAR
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-[#F5EEFF]">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-xs text-[#6B5280] mt-0.5">
                                                        {p.desc}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-[#E040FB]">
                                                        {p.price}
                                                    </span>
                                                    <span className="text-xs text-[#6B5280]">
                                                        {p.period}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="plan-indicator"
                                                    className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#E040FB]"
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between mt-auto pt-5 border-t border-[#E040FB]/8">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                disabled={step === 1 || isLoading}
                                className="text-[#6B5280] hover:text-[#F5EEFF] hover:bg-[#E040FB]/5 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                            </Button>

                            {step < 3 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:from-[#E040FB]/90 hover:to-[#7C4DFF]/90 text-white cursor-pointer"
                                >
                                    Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:from-[#E040FB]/90 hover:to-[#7C4DFF]/90 text-white shadow-glow cursor-pointer"
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

            <div className="mt-6 text-center text-sm">
                <span className="text-[#6B5280]">¿Ya tienes una cuenta?</span>{" "}
                <Link
                    href="/login"
                    className="text-[#E040FB] hover:text-[#F8C0FF] font-medium transition-colors"
                >
                    Inicia Sesión
                </Link>
            </div>
        </div>
    )
}
