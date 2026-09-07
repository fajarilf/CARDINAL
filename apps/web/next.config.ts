import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // ponytail: dev proxy to the local API; point destination at the deployed API URL for prod.
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3333/api/:path*",
      },
    ];
  },
};

export default nextConfig;
