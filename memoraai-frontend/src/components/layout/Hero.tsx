import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "../common/Button";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(0.625rem)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0rem)",
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  return (
    <section className="relative w-full">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="container mx-auto px-6 pt-32 md:pt-40 lg:pt-48"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            variants={fadeUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 backdrop-blur-xl shadow-[0_0.25rem_1.5rem_rgba(0,0,0,0.2)] transition-colors hover:bg-white/10 cursor-pointer"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500">
              <Play className="h-2.5 w-2.5 text-white ml-[0.0625rem]" fill="currentColor" />
            </span>
            <span className="text-sm font-medium text-zinc-300">
              Introducing Cinematic Generation
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="max-w-4xl text-5xl font-medium tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem] lg:leading-[1.05]"
          >
            Turn memories into
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-500 pb-2">
              emotional stories
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-lg tracking-tight text-zinc-400 sm:text-xl"
          >
            Upload your favorite moments and let our AI craft breathtaking visual
            narratives filled with nostalgia, atmosphere, and timeless beauty.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              type="button"
              variant="light"
              className="!h-12 !px-8 !text-base text-white"
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={() =>
                document.getElementById("create")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Start Creating
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!h-12 !px-8 !text-base"
              onClick={() =>
                document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Gallery
            </Button>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          className="relative mx-auto mt-20 max-w-5xl md:mt-28"
        >
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl md:rounded-[2rem] bg-zinc-900 ring-1 ring-white/10 shadow-[0_0_6.25rem_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=2000&auto=format&fit=crop"
              alt="Cinematic memory presentation"
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 mix-blend-lighten"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-20" />

            <div className="absolute inset-x-0 bottom-0 z-30 p-8 md:p-12">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400/80 ring-4 ring-emerald-400/20" />
                <span className="text-xs font-medium tracking-wide text-zinc-300 uppercase">
                  AI Generated
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-medium tracking-tight text-white md:text-4xl max-w-2xl">
                Every photo becomes an emotional visual chapter.
              </h3>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
