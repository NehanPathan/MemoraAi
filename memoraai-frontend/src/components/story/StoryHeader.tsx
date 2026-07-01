import { motion } from "framer-motion";

import { Images, Sparkles } from "lucide-react";

interface StoryHeaderProps {
  totalCards: number;
}

export function StoryHeader({ totalCards }: StoryHeaderProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
    >
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2">
          <Sparkles className="h-4 w-4 text-violet-300" />

          <span className="text-sm text-violet-200">
            Generated Story Gallery
          </span>
        </div>

        <h2 className="mt-5 text-3xl font-medium leading-tight tracking-[-0.05em] text-zinc-50 md:text-5xl">
          Your memories transformed into emotional cinematic frames
        </h2>

        <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
          Every image below has been emotionally interpreted and artistically
          generated to create a timeless storytelling experience.
        </p>
      </div>

      <div className="glass flex items-center gap-4 self-start rounded-3xl px-8 py-8 md:self-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-orange-400/20">
          <Images className="h-6 w-6 text-violet-200" />
        </div>

        <div>
          <p className="text-2xl font-medium text-zinc-100">{totalCards}</p>

          <p className="text-sm text-zinc-400">cinematic scenes generated</p>
        </div>
      </div>
    </motion.div>
  );
}
