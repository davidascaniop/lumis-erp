import { Resend } from 'resend';

export async function sendInvitationEmail(email: string, name: string, token: string) {
  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uselumisapp.com'}/setup-password?token=${token}`;

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Variables de entorno incompletas: Falta configurar RESEND_API_KEY en Vercel." };
    }
    
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Lumis <info@uselumisapp.com>',
      to: [email],
      subject: '¡Bienvenido al Equipo Administrativo de Lumis!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(to right, #E040FB, #7C4DFF); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">¡Hola, ${name}!</h1>
          </div>
          
          <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px; background: #fff;">
            <p style="font-size: 16px; line-height: 1.6;">
              Has sido invitado a formar parte del **Equipo Administrativo de Lumis**. Se te han asignado permisos específicos para gestionar módulos de nuestra plataforma.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Para completar tu registro y configurar tu contraseña de acceso segura, haz clic en el siguiente botón:
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${setupUrl}" style="background-color: #E040FB; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Configurar mi Cuenta
              </a>
            </div>
            
            <p style="font-size: 13px; color: #666; line-height: 1.5;">
              Este enlace es personal y expirará en 7 días por motivos de seguridad. Si el botón no funciona, copia y pega este enlace en tu navegador:
              <br/>
              <span style="color: #E040FB;">${setupUrl}</span>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Si no esperabas esta invitación, puedes ignorar este correo.
              <br/>
              © 2026 Lumis ERP. Sistema de Gestión Avanzada.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error enviando email via Resend:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('Excepción al enviar email:', error);
    return { success: false, error: error.message };
  }
}
