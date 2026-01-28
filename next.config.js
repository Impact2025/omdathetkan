const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { dev }) => {
    // Add case-sensitive paths plugin to prevent Windows casing issues
    if (dev) {
      config.plugins.push(new CaseSensitivePathsPlugin());
    }

    // Disable symlinks resolution to prevent path confusion
    config.resolve.symlinks = false;

    return config;
  },
};

module.exports = nextConfig;
