/** @type {import('next').NextConfig} */
const nextConfig = {
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dl.dropboxusercontent.com',
        // Permite todos os caminhos do Dropbox
      },
    ],
    // Para melhor performance, você pode especificar os tamanhos:
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações de segurança e desempenho
  poweredByHeader: false,
  generateEtags: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;