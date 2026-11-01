import type { NextConfig } from "next";

/**
 * Next.js config – proxies all /api/* requests to the Spring Boot backend.
 * The Spring Boot backend is the single API authority (auth, RBAC, DB access).
 * Next.js only serves the UI and forwards API calls.
 */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
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
