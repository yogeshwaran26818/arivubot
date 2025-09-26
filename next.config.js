/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'cheerio']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('undici');
    }
    return config;
  }
}

module.exports = nextConfig