import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://condominio.api.diangogavidia.com:3000/:path*',
      },
    ];
  },
};

export default nextConfig;
