import type { NextConfig } from "next";

/**
 * Next.js config – proxies all /api/* requests to the Spring Boot backend.
 * The Spring Boot backend is the single API authority (auth, RBAC, DB access).
 * Next.js only serves the UI and forwards API calls.
 */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '10.36.238.206',
    '10.36.238.206:3000',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
