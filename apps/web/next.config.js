const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Docker/Railawy deployments (smaller container size)
  output: 'standalone',

  // Set the root for output file tracing in monorepo
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Transpile workspace packages for production builds
  transpilePackages: ['@magic-system/auth', '@magic-system/schemas'],

  // Ignore ESLint errors during build (warnings about import order won't block deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/f/**',
      },
      {
        protocol: 'https',
        hostname: '*.ufs.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
