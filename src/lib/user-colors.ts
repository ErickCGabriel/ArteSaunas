const PALETTE = [
  { dot: "bg-blue-500", badge: "bg-blue-500/15 text-blue-400" },
  { dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-400" },
  { dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-400" },
  { dot: "bg-purple-500", badge: "bg-purple-500/15 text-purple-400" },
  { dot: "bg-pink-500", badge: "bg-pink-500/15 text-pink-400" },
  { dot: "bg-cyan-500", badge: "bg-cyan-500/15 text-cyan-400" },
] as const;

function paletteIndex(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) % PALETTE.length;
  }
  return hash;
}

export function userColor(userId: string) {
  return PALETTE[paletteIndex(userId)];
}
