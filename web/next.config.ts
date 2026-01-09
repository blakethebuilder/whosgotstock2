import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Use webpack for all builds (Turbopack disabled via NEXT_PRIVATE_DISABLE_TURBOPACK env var)
  webpack: (config, { dev, isServer }) => {
    // Optimize for production builds
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
