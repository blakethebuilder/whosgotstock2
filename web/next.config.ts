import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Explicitly set empty turbopack config to use webpack instead
  // This silences the Next.js 16 warning about webpack config without turbopack config
  turbopack: {},
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
