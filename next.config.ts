import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `output: "standalone"` (used for the self-hosted Proxmox deploy) is
  // deliberately NOT set here — it conflicts with Vercel's own build/
  // packaging pipeline (breaks with an ENOENT on next-server.js.nft.json).
  // Re-add it in "Migrando de volta pro Proxmox" (see README) when this
  // temporary Vercel bridge ends.
  experimental: {
    serverActions: {
      // Default is 1MB, too small for contact file uploads (photos/plans).
      // Keep in sync with MAX_FILE_BYTES in contatos/[id]/actions.ts.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
