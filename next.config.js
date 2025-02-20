/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Desabilita o ESLint durante o build de produção
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vvwihgsstdfoszepafgp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: ['your-supabase-project.supabase.co'], // ajuste conforme seu projeto
  },
}

module.exports = nextConfig 