/**
 * Central role definitions for Lumis ERP.
 * Single source of truth for roles, permissions, badge colors, and descriptions.
 */

export type AppRole =
  | "admin"
  | "gerente"
  | "vendedor"
  | "cajero"
  | "almacenista"
  | "contador"
  | "logistico"
  | "mesero"
  | "cocinero"
  | "readonly"
  | "custom";

/** Nav section IDs that match BASE_NAV_SECTIONS and special sections */
export type NavSectionId =
  | "ventas"
  | "compras"
  | "clientes"
  | "productos"
  | "finanzas"
  | "operaciones"
  | "reportes"
  | "restaurante"
  | "settings";

/** Which nav sections each role can access */
export const ROLE_SECTION_ACCESS: Record<AppRole, NavSectionId[]> = {
  admin: ["ventas", "compras", "clientes", "productos", "finanzas", "operaciones", "reportes", "restaurante", "settings"],
  gerente: ["ventas", "compras", "clientes", "productos", "finanzas", "operaciones", "reportes", "restaurante"],
  vendedor: ["ventas", "clientes", "reportes"],
  cajero: ["ventas"],
  almacenista: ["productos", "compras"],
  contador: ["finanzas", "reportes"],
  logistico: ["operaciones", "compras"],
  mesero: ["restaurante"],
  cocinero: ["restaurante"],
  readonly: ["ventas", "compras", "clientes", "productos", "finanzas", "operaciones", "reportes", "restaurante"],
  custom: [],
};

export interface RoleDefinition {
  label: string;
  description: string;
  /** Tailwind color classes for the badge */
  badgeClass: string;
}

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  admin: {
    label: "Administrador General",
    description: "Acceso total a todos los módulos, configuración y eliminación de datos.",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
  },
  gerente: {
    label: "Gerente",
    description: "Acceso total excepto Configuración y eliminación permanente de datos.",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  vendedor: {
    label: "Vendedor",
    description: "Acceso a Ventas (POS y Presupuestos), Clientes & CRM y Reportes de Ventas.",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
  },
  cajero: {
    label: "Cajero",
    description: "Acceso solo al Punto de Venta (POS) e Historial de Ventas.",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  almacenista: {
    label: "Almacenista",
    description: "Acceso completo a Inventario y módulo de Compras.",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
  contador: {
    label: "Contador",
    description: "Acceso completo a Finanzas y todos los Reportes.",
    badgeClass: "bg-teal-100 text-teal-700 border-teal-200",
  },
  logistico: {
    label: "Logístico",
    description: "Acceso a Logística y módulo completo de Compras.",
    badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  mesero: {
    label: "Mesero",
    description: "Acceso solo al módulo Restaurante — toma y gestión de comandas.",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  cocinero: {
    label: "Cocinero",
    description: "Acceso exclusivo a la pantalla KDS de Cocina en tiempo real.",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  readonly: {
    label: "Solo Lectura",
    description: "Puede visualizar todos los módulos pero no crear ni editar nada.",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
  custom: {
    label: "Personalizado",
    description: "Permisos configurados manualmente por el administrador.",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
};

/** Roles available in the invite dropdown (excludes superadmin) */
export const INVITE_ROLES: AppRole[] = [
  "admin",
  "gerente",
  "vendedor",
  "cajero",
  "almacenista",
  "contador",
  "logistico",
  "mesero",
  "cocinero",
  "readonly",
  "custom",
];
