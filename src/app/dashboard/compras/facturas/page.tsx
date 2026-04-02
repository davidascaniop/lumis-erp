import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function FacturasCompraPage() {
  return (
    <div className="p-6 space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-1">Facturas de Compra</h1>
        <p className="text-text-2 mt-1">Carga y validación de facturas RECIBIDAS.</p>
      </div>

      <Card className="p-12 border-dashed flex flex-col items-center justify-center bg-surface-card/50">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-brand animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-text-1 mb-2">Próximamente</h3>
        <p className="text-text-3 text-center max-w-sm">
          Este módulo permitirá la digitalización de compras y el control de cuentas por pagar (CxP).
        </p>
      </Card>
    </div>
  );
}
