/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA)
  distDir: './dist', // Changes the build output directory to ./dist/
  images: {
    unoptimized: true, // Required for static export
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
