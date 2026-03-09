"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

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
    email: z.string().email({
        message: "Ingresa un correo electrónico válido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
})

export function LoginForm() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })

            if (error) {
                toast.error("Error al iniciar sesión", {
                    description: error.message,
                })
                return
            }

            toast.success("¡Bienvenido a LUMIS!")
            router.push("/dashboard")
            router.refresh()
        } catch (err) {
            toast.error("Error inesperado al conectar")
        } finally {
            setIsLoading(false)
        }
    }

    async function onGoogleLogin() {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                toast.error("Error", { description: error.message })
                setIsLoading(false)
            }
        } catch (err) {
            toast.error("Error inesperado")
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="glass p-8 rounded-2xl w-full shadow-card relative overflow-hidden"
        >
            {/* Gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E040FB] to-transparent" />

            <div className="space-y-6 relative z-10">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#B8A0D0]">Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="usuario@empresa.com"
                                            {...field}
                                            className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/40 focus-visible:border-[#E040FB]/30 h-11"
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
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[#B8A0D0]">Contraseña</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-[#E040FB] hover:text-[#F8C0FF] transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            {...field}
                                            className="bg-[#0F0A12]/80 border-[#E040FB]/10 text-[#F5EEFF] placeholder:text-[#6B5280] focus-visible:ring-[#E040FB]/40 focus-visible:border-[#E040FB]/30 h-11"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[#FF4757] text-xs" />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] hover:from-[#E040FB]/90 hover:to-[#7C4DFF]/90 text-white font-semibold shadow-glow transition-all cursor-pointer"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar a LUMIS
                        </Button>
                    </form>
                </Form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#E040FB]/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#201728] px-3 text-[#6B5280]">O continuar con</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={onGoogleLogin}
                    className="w-full h-11 bg-transparent border-[#E040FB]/10 hover:bg-[#E040FB]/5 hover:border-[#E040FB]/20 text-[#F5EEFF] transition-all cursor-pointer"
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </Button>
            </div>

            <div className="mt-6 text-center text-sm">
                <span className="text-[#6B5280]">¿Tu empresa no tiene cuenta?</span>{" "}
                <Link
                    href="/register"
                    className="text-[#E040FB] hover:text-[#F8C0FF] font-medium transition-colors"
                >
                    Regístrate
                </Link>
            </div>
        </motion.div>
    )
}
