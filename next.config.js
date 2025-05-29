/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable React StrictMode for now to avoid double rendering issues
  reactStrictMode: false,
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Enable build indicator
  buildIndicator: {
    autoPrerender: false,
  },
}

module.exports = nextConfig 