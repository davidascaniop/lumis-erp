import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
    ],
    // ─── Client Router Cache ──────────────────────────────────────────────
    // Cachea páginas dinámicas (como /dashboard) en el router cache del
    // cliente. Si el user navega fuera y vuelve dentro de `dynamic` segundos,
    // Next muestra la versión cacheada INSTANTÁNEAMENTE sin refetch del
    // server. Esto mata el skeleton flash que aparecía al volver al
    // dashboard.
    //
    //   dynamic: cuánto dura el cache para páginas con datos dinámicos
    //            (dashboard, listas con fetch, etc.) — 30s es un buen
    //            balance entre frescura y UX.
    //   static : páginas prerender-eadas estáticamente. 3 min es safe.
    //
    // Si necesitas data FRESCA después de una acción (ej: una venta),
    // usa `router.refresh()` explícitamente desde el componente.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
