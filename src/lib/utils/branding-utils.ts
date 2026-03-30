/**
 * Branding and Template Utilities for Whitelabel Follow-up
 */

interface TemplateData {
  Nombre_Cliente?: string;
  User_Business_Name?: string;
  Monto?: string;
  Producto_Habitual?: string;
  Nombre_Vendedor?: string;
  [key: string]: string | undefined;
}

/**
 * Replaces placeholders in a template string with actual data.
 * Supports both {Variable} and {{Variable}} formats.
 */
export function parseWhitelabelTemplate(template: string, data: TemplateData): string {
  let result = template;

  // Replace placeholders
  Object.keys(data).forEach((key) => {
    const value = data[key] || "";
    
    // Support {Variable}
    const regexSingle = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regexSingle, value);
    
    // Support {{Variable}}
    const regexDouble = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regexDouble, value);
  });

  return result;
}

/**
 * Generates a WhatsApp URL with a pre-filled message.
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Clean phone: remove +, spaces, dashes
  const cleanPhone = phone.replace(/\D/g, "");
  const encodedText = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export const FOLLOWUP_TEMPLATES = {
  SALES: "Hola {Nombre_Cliente}, te escribo de {{User_Business_Name}} para saber si tuviste oportunidad de revisar el presupuesto por {Monto}. ¿Te gustaría que apartemos la mercancía de una vez?",
  COLLECTION: "Hola {Nombre_Cliente}, de parte de {{User_Business_Name}} te envío tu estado de cuenta actualizado. Tienes un saldo pendiente de {Monto} que vence hoy. Adjunto los datos de pago actualizados a la tasa del día.",
  LOYALTY: "Hola {Nombre_Cliente}, ¡un saludo de parte del equipo de {{User_Business_Name}}! Tiempo sin saludarte. Vi que hace tiempo no repones {Producto_Habitual}. Acaba de llegarnos stock nuevo, ¿te envío la lista de precios?",
};
