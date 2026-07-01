import { motion } from "framer-motion";
import { AlertCircle, Download, Share2, Sparkles } from "lucide-react";
import { THEME_LABELS, type MemoryTheme } from "../../constants/story";
import type { MemoryCard as MemoryCardType } from "../../types/story";

interface MemoryCardProps {
  card: MemoryCardType;
  index?: number;
}

function themeLabel(themeName: string): string {
  if (themeName in THEME_LABELS) {
    return THEME_LABELS[themeName as MemoryTheme].title;
  }
  return themeName.replace(/_/g, " ");
}

export function MemoryCard({ card, index = 0 }: MemoryCardProps) {
  const isFailed = card.status === "failed";

  async function downloadImage() {
    if (!card.imageUrl) {
      return;
    }

    try {
      const response = await fetch(card.imageUrl);
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — user can retry
    }
  }

  async function shareCard() {
    if (!card.imageUrl || !navigator.share) {
      return;
    }

    await navigator.share({
      title: "MemoraAI Story",
      text: "Generated with MemoraAI",
      url: card.imageUrl,
    });
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: index * 0.1,
      }}
      whileHover={isFailed ? undefined : { y: -8 }}
      className={`group relative overflow-hidden rounded-[2rem] bg-zinc-900 ring-1 shadow-[0_1rem_2rem_rgba(0,0,0,0.4)] transition-all duration-500 ${
        isFailed
          ? "ring-red-500/30"
          : "ring-white/10 hover:shadow-[0_1.5rem_3rem_rgba(139,92,246,0.15)] hover:ring-white/20"
      }`}
    >
      <motion.div className="relative aspect-[3/4] w-full overflow-hidden">
        {isFailed ? (
          <motion.div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-950/80 p-11 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-zinc-300">This chapter failed to generate</p>
            {card.errorMessage && (
              <p className="line-clamp-3 break-words text-xs text-zinc-500">{card.errorMessage}</p>
            )}
          </motion.div>
        ) : (
          <img
            src={card.imageUrl}
            alt={themeLabel(card.themeName)}
            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          />
        )}

        <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

        <motion.div className="absolute inset-x-0 top-0 flex items-center justify-between p-11">
          <motion.div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3 w-3 text-violet-300" />
            <span className="text-[0.625rem] font-medium uppercase tracking-wider text-zinc-300">
              {themeLabel(card.themeName)}
            </span>
          </motion.div>
        </motion.div>

        {!isFailed && (
          <motion.div className="absolute inset-x-0 bottom-0 p-11 opacity-90 transition-opacity duration-300 group-hover:opacity-100">
            <motion.div className="flex items-end justify-between gap-4">
              <motion.div className="min-w-0 flex-1">
                <h4 className="break-words text-lg font-medium tracking-tight text-white">
                  {themeLabel(card.themeName)}
                </h4>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-300">
                  Emotionally generated visual frame from your memory.
                </p>
              </motion.div>

              <motion.div className="flex flex-shrink-0 flex-col gap-2 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                <motion.button
                  type="button"
                  aria-label="Download memory card"
                  whileTap={{ scale: 0.9 }}
                  onClick={downloadImage}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </motion.button>

                <motion.button
                  type="button"
                  aria-label="Share memory card"
                  whileTap={{ scale: 0.9 }}
                  onClick={shareCard}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <Share2 className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.article>
  );
}
