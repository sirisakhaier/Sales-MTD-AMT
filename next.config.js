/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  }
};

module.exports = nextConfig;
