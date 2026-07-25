import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deployment target is a resource-constrained LXC container with no
  // Docker — standalone output keeps the copied node_modules subset (and
  // therefore disk/RAM footprint) to only what the server actually needs.
  output: "standalone",
  experimental: {
    serverActions: {
      // Default is 1MB, too small for contact file uploads (photos/plans).
      // Keep in sync with MAX_FILE_BYTES in contatos/[id]/actions.ts.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
