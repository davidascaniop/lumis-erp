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
  },
};

export default nextConfig;
