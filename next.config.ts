import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que o Next procure lockfiles fora do repositório
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
};

export default nextConfig;
