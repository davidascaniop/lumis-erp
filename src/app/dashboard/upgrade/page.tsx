import { Check, Star, Zap, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UpgradePage() {
  const plans = [
    {
      id: "starter",
      name: "Lumis Starter",
      price: "$19.99",
      description: "\"Se acabó el desorden de facturas y el Excel manual\".",
      icon: Zap,
      features: [
        "Gestión de Ventas y Cobranzas",
        "Control de Inventario Básico",
        "Reportes PDF y Cotizaciones",
        "Fichas de Clientes (Básico)",
      ],
      color: "text-text-1",
      buttonType: "default",
    },
    {
      id: "pro",
      name: "Lumis Pro Business",
      price: "$79.99",
      description: "\"Multiplica tus ventas con WhatsApp y CRM integrado\".",
      icon: Star,
      popular: true,
      features: [
        "Todo lo del Plan Starter",
        "Módulo CRM (Pipeline de Ventas)",
        "Notificaciones por WhatsApp",
        "Múltiples Vendedores y Comisiones",
        "Soporte Prioritario",
      ],
      color: "text-brand",
      buttonType: "brand",
    },
    {
      id: "enterprise",
      name: "Lumis Enterprise",
      price: "$119.99",
      description: "\"Control total de todas tus sedes y distribuidores\".",
      icon: Crown,
      features: [
        "Todo lo del Plan Pro",
        "Múltiples Sucursales",
        "Integración con APIs Externas",
        "Catálogos con Marca Blanca",
        "Account Manager Dedicado",
      ],
      color: "text-status-warning",
      buttonType: "outline",
    },
  ];

  const handleContact = (planName: string) => {
    const msg = encodeURIComponent(`Hola equipo Lumis, estoy interesado en mejorar mi cuenta al plan ${planName}.`);
    return `https://wa.me/584120000000?text=${msg}`; // Replace with actual support number
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-display font-bold text-text-1 mb-4">
          Eleva tu Negocio al Siguiente Nivel
        </h1>
        <p className="text-text-3 max-w-2xl mx-auto text-sm leading-relaxed">
          Para acceder al módulo CRM y otras funcionalidades avanzadas, elige el plan que mejor se adapte a las necesidades de tu empresa. Crece sin limitaciones.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col p-6 rounded-2xl border bg-surface-card transition-all duration-300 hover:-translate-y-1 ${
              plan.popular
                ? "border-brand shadow-[0_10px_40px_rgba(224,64,251,0.15)] ring-1 ring-brand/50"
                : "border-border shadow-sm hover:shadow-md"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-brand to-[#7C4DFF] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                Más Popular
              </div>
            )}
            
            <div className="mb-6 mt-2">
              <plan.icon className={`w-8 h-8 ${plan.color} mb-4`} />
              <h3 className="text-xl font-bold text-text-1">{plan.name}</h3>
              <p className="text-text-3 text-xs italic mt-2 min-h-[32px]">
                {plan.description}
              </p>
            </div>

            <div className="mb-6 flex-1">
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-bold text-text-1 font-display">
                  {plan.price}
                </span>
                <span className="text-text-3 text-sm font-medium mb-1">/ mes</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-2">
                    <Check className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={handleContact(plan.name)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 ${
                plan.buttonType === "brand"
                  ? "bg-brand-gradient text-white shadow-brand-lg hover:opacity-90"
                  : plan.buttonType === "outline"
                  ? "border border-border text-text-1 hover:bg-surface-hover/10"
                  : "bg-surface-hover/10 text-text-1 hover:bg-surface-hover/20"
              }`}
            >
              Contactar por WhatsApp
              <ArrowRight className="w-4 h-4 inline-block" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
