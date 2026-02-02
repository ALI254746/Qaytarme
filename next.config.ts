import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set workspace root to silence lockfile warning
  outputFileTracingRoot: require('path').join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https', // or http, depending on backend. Usually http for localhost
        hostname: 'localhost',
      },
      {
        protocol: 'http', 
        hostname: 'localhost',
      },
       {
        protocol: 'https', 
        hostname: 'musodara-backend.onrender.com', // Just in case they use this
      }
    ],
  },
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  // Turbopack configuration (Next.js 16+)
  // Empty config to silence the error - telegram mini app is already excluded via tsconfig.json
  turbopack: {},
};

export default nextConfig;
