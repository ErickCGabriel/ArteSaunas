import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deployment target is a resource-constrained LXC container with no
  // Docker — standalone output keeps the copied node_modules subset (and
  // therefore disk/RAM footprint) to only what the server actually needs.
  output: "standalone",
};

export default nextConfig;
