import { motion } from "framer-motion";

interface LoaderProps {
  label?: string;
}

export function Loader({ label = "Crafting memories..." }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12">
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "linear",
          }}
          className="h-20 w-20 rounded-full border border-white/10"
        />

        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
            ease: "linear",
          }}
          className="absolute h-14 w-14 rounded-full border border-violet-400/30 border-t-violet-400"
        />

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
          className="absolute h-4 w-4 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 blur-[0.0625rem]"
        />
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-zinc-100">{label}</p>

        <p className="text-xs text-zinc-500">
          AI is transforming your moments into cinematic memories
        </p>
      </div>
    </div>
  );
}
