const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Optimized for Vercel serverless
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "**",
      },
    ],
  },
  experimental: {
    scrollRestoration: true,
    // serverActions: true, // Removed: Server Actions are enabled by default in Next.js 14+
    typedRoutes: true,
    serverComponentsExternalPackages: ['@supabase/*'],
  },
  modularizeImports: {
    lodash: {
      transform: "lodash/{{member}}",
    },
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

// 🔐 Validate required environment variables at build time
const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_RUNPOD_LLM_ENDPOINT',
  'NEXT_PUBLIC_RUNPOD_API_KEY',
  'RUNPOD_LLM_ENDPOINT',
  'RUNPOD_API_KEY',
  'MODEL_NAME',
  'TOKENIZER_NAME',
  'FINN_KEY',
  'HF_TOKEN',
  'NEXT_PUBLIC_SITE_URL',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
];

requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
});

module.exports = nextConfig;
