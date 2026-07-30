/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  }
};

module.exports = nextConfig;
