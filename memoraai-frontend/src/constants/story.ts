/** Must match backend `THEME_ORDER` / `MEMORY_THEMES` keys */
export const BACKEND_THEMES = [
  "nostalgic_film",
  "cinematic_travel",
  "warm_family",
] as const;

export type MemoryTheme = (typeof BACKEND_THEMES)[number];

export const MAX_MEMORY_CARDS = BACKEND_THEMES.length;

export const MAX_UPLOAD_FILE_BYTES = 20 * 1024 * 1024;

export const THEME_LABELS: Record<
  MemoryTheme,
  { title: string; description: string; gradient: string }
> = {
  nostalgic_film: {
    title: "Nostalgic Film",
    description: "Vintage warm tones with soft cinematic scrapbook styling.",
    gradient: "from-orange-400/30 via-amber-300/20 to-yellow-200/10",
  },
  cinematic_travel: {
    title: "Cinematic Travel",
    description: "Luxury editorial scenery with vibrant depth and emotion.",
    gradient: "from-violet-500/30 via-fuchsia-500/20 to-orange-400/20",
  },
  warm_family: {
    title: "Warm Family",
    description: "Cozy candid moments with heartfelt storytelling light.",
    gradient: "from-rose-500/20 via-fuchsia-500/20 to-violet-500/20",
  },
};
