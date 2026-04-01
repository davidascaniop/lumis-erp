import { RegisterForm } from "@/components/auth/register-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Registrar Empresa — LUMIS",
  description: "Crea la cuenta de tu empresa en LUMIS ERP/CRM",
};

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: flags } = await supabase.from("feature_flags").select("*");

  return <RegisterForm flags={flags || []} />;
}
