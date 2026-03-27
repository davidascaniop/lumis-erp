"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

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
  email: z.string().email({
    message: "Ingresa un correo electrónico válido.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
});

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error("Error al iniciar sesión", {
          description: error.message,
        });
        return;
      }

      toast.success("¡Bienvenido a LUMIS!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("Error inesperado al conectar");
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogleLogin() {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error("Error", { description: error.message });
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Error inesperado");
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl w-full shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden"
    >
      {/* Gradient top accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand/10 via-brand to-brand/10" />

      <div className="space-y-6 relative z-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                      placeholder="usuario@empresa.com"
                      {...field}
                      className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] focus-visible:ring-brand/20 focus-visible:border-brand h-12 rounded-xl transition-all font-outfit"
                    />
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
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-[#1A1125] font-bold font-outfit text-sm">Contraseña</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-bold text-brand hover:underline transition-all font-outfit"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      className="bg-[#F8FAFC] border-[#E2E8F0] text-[#1A1125] placeholder:text-[#94A3B8] focus-visible:ring-brand/20 focus-visible:border-brand h-12 rounded-xl transition-all font-outfit"
                    />
                  </FormControl>
                  <FormMessage className="text-danger text-xs font-bold" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 bg-brand hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] font-outfit uppercase tracking-widest text-xs"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar a LUMIS
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#EDF2F7]" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
            <span className="bg-white px-4 text-[#94A3B8]">
              O continuar con
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={onGoogleLogin}
          className="w-full h-12 bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#1A1125] font-bold rounded-xl transition-all font-outfit shadow-sm"
        >
          <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </div>

      <div className="mt-8 text-center text-sm">
        <span className="text-[#64748B] font-medium font-outfit tracking-tight">¿Tu empresa no tiene cuenta?</span>{" "}
        <Link
          href="/register"
          className="text-brand hover:underline font-bold transition-all font-outfit"
        >
          Regístrate
        </Link>
      </div>
    </motion.div>
  );
}
