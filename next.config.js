/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set compatibility with Cloudflare Workers
  reactStrictMode: true,
  // Disable ESLint for builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable image optimization for static export
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Required for Cloudflare Workers compatibility
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Ensure transpilation works correctly
  transpilePackages: ['mapbox-gl'],
  // Static export doesn't support App Router dynamic features
  experimental: {
    // appDocumentPreloading: true, // Less relevant without static export
  }
};

module.exports = nextConfig; 