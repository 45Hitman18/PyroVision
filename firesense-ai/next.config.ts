import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/predict",
        destination: "http://localhost:8000/predict",
      },
    ];
  },
};

export default nextConfig;

