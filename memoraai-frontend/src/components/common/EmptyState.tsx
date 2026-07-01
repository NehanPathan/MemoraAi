import { motion } from "framer-motion";

import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  title: string;

  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="glass-card flex flex-col items-center justify-center gap-5 px-8 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Sparkles className="h-7 w-7 text-violet-300" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-medium text-zinc-100">{title}</h3>

        <p className="mx-auto max-w-md text-sm leading-7 text-zinc-400">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
