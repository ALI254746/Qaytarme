import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Exclude telegram mini app from main build
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Exclude telegram mini app qaytarme folder from build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/telegram mini app qaytarme/**'],
    };
    return config;
  },
};

export default nextConfig;
