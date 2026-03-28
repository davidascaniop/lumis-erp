"use client";

import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";

interface WhatsAppButtonProps {
  telefono: string;
  nombre: string;
  clienteId: string;
  oportunidadId?: string;
  mensaje?: string;
  size?: "sm" | "md";
  className?: string;
}

export function WhatsAppButton({ 
  telefono, 
  nombre, 
  clienteId,
  oportunidadId,
  mensaje = `Hola ${nombre}, te escribo de Lumis ERP...`,
  size = "md",
  className = ""
}: WhatsAppButtonProps) {
  const { user } = useUser();
  const supabase = createClient();

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click if inside kanban
    
    // Normalizar teléfono (remover caracteres no numéricos, quitar prefijo '0', agregar '58')
    let num = telefono.replace(/\D/g, "");
    if (num.startsWith("0")) num = num.substring(1);
    if (!num.startsWith("58")) num = "58" + num;
    
    // Registrar interacción en Supabase
    if (user?.id && user?.company_id) {
      await supabase.from("crm_interacciones").insert({
        company_id: user.company_id,
        cliente_id: clienteId,
        oportunidad_id: oportunidadId || null,
        tipo: "whatsapp",
        contenido: "Inicio de conversación por WhatsApp.",
        agente_id: user.id
      });
    }

    const encodedMsg = encodeURIComponent(mensaje);
    window.open(`https://wa.me/${num}?text=${encodedMsg}`, "_blank");
  };

  const btnClasses = size === "sm"
    ? "p-2 rounded-lg"
    : "px-3 py-2 rounded-xl text-sm font-semibold gap-2 border shadow-[0_0_15px_rgba(37,211,102,0.2)]";

  return (
    <button
      onClick={handleWhatsApp}
      className={`flex items-center justify-center bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 transition-all ${btnClasses} ${className}`}
      title="Contactar vía WhatsApp"
    >
      <MessageCircle className={size === "sm" ? "w-4 h-4" : "w-4 h-4"} />
      {size === "md" && <span>WhatsApp</span>}
    </button>
  );
}
