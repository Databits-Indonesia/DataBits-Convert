/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable middleware support for Vercel deployment
  distDir: './dist', // Changes the build output directory to ./dist/
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      fs: './empty-module.js',
      path: './empty-module.js',
      crypto: './empty-module.js',
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
