import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/tts/:path*",
        destination: `${BACKEND_URL}/api/tts/:path*`,
      },
      {
        source: "/api/py/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      {
        source: "/predict",
        destination: `${BACKEND_URL}/predict`,
      },
    ];
  },
};

export default nextConfig;
