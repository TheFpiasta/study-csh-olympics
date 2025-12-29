/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile globe.gl for compatibility
  transpilePackages: ['globe.gl', 'three-globe'],
};

export default nextConfig;
