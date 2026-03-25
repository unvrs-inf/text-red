import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Turbopack config (Next.js 16 default)
  turbopack: {
    resolveAlias: {
      // Исправляет ошибку с canvas в react-pdf (pdf.js зависимость)
      canvas: { browser: './empty-module.js' },
    },
  },
};

export default nextConfig;
