import type { Metadata, Viewport } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUMIS — ERP/CRM para Distribuidoras",
  description:
    "Sistema de gestión empresarial multi-tenant para distribuidoras y comercializadoras.",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' }
    ]
  }
};

// Viewport meta tag explícito: crítico para que el responsive funcione en mobile.
// Sin esto, Safari/Chrome iOS renderizan la página como si fuera desktop de 980px
// y la escalan, rompiendo todos los breakpoints de Tailwind.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0515" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://yygiwznhxmnytbbvohfx.supabase.co" />
        <link rel="dns-prefetch" href="https://yygiwznhxmnytbbvohfx.supabase.co" />
      </head>
      <body
        className={`${montserrat.variable} ${jetbrainsMono.variable} antialiased font-sans transition-colors duration-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
