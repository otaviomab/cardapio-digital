import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Desabilita o ESLint durante o build de produção
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desabilita a verificação de tipos durante o build
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vvwihgsstdfoszepafgp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Adicionado o padrão para seu-projeto-supabase
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
