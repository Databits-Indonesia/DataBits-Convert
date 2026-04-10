/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_WASM_PYMUPDF_URL: 'https://cdn.jsdelivr.net/npm/@bentopdf/pymupdf-wasm@0.11.16/',
    NEXT_PUBLIC_WASM_GS_URL: 'https://cdn.jsdelivr.net/npm/@bentopdf/gs-wasm/assets/',
    NEXT_PUBLIC_WASM_CPDF_URL: 'https://cdn.jsdelivr.net/npm/coherentpdf/dist/',
  },
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
