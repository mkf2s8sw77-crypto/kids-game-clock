import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/kids-game-clock",
  assetPrefix: "/kids-game-clock",
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
