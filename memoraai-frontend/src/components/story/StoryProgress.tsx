import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useStoryStore } from "../../store/story-store";

const atmosphericMessages = [
  "Analyzing the emotional undertones...",
  "Synthesizing atmospheric lighting...",
  "Crafting visual narratives...",
  "Composing cinematic framing...",
  "Finalizing emotional resonance...",
];

export function StoryProgress() {
  const { generationStatus, progressMessage, memoryCards } = useStoryStore();

  if (
    generationStatus === "idle" ||
    generationStatus === "completed" ||
    generationStatus === "failed"
  ) {
    return null;
  }

  // Choose an abstract message based on how many cards are generated
  const messageIndex = Math.min(memoryCards.length, atmosphericMessages.length - 1);
  const displayMessage = progressMessage || atmosphericMessages[messageIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(0.625rem)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0rem)" }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const }}
      className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 p-12 ring-1 ring-white/5 shadow-[0_2.5rem_5rem_rgba(0,0,0,0.8)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)] opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center mb-10">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-violet-500/30 blur-3xl h-32 w-32 mx-auto"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-[0_0_3.125rem_rgba(139,92,246,0.2)]"
          >
            <div className="absolute inset-2 rounded-full border-t border-r border-violet-400/50" />
            <Sparkles className="h-8 w-8 text-violet-300 animate-pulse" />
          </motion.div>
        </div>

        <motion.div
          key={displayMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-white">
            {displayMessage}
          </h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Please wait while our AI engine carefully renders your memories into a cinematic sequence.
          </p>
        </motion.div>

        <div className="mt-12 w-full max-w-md mx-auto h-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-80"
          />
        </div>
      </div>
    </motion.div>
  );
}
