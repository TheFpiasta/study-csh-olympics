/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle globe.gl and three.js dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // Handle ES modules for globe.gl
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },
  // Enable ES modules
  experimental: {
    esmExternals: 'loose',
  },
  // Transpile globe.gl for compatibility
  transpilePackages: ['globe.gl', 'three-globe'],
};

export default nextConfig;
