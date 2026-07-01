import { motion } from "framer-motion";

interface SectionTitleProps {
  eyebrow?: string;

  title: string;

  description?: string;

  align?: "left" | "center";
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionTitleProps) {
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
      transition={{
        duration: 0.6,
      }}
      className={
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"
      }
    >
      {eyebrow && (
        <span className="badge badge-violet mb-5 inline-flex">{eyebrow}</span>
      )}

      <h2 className="text-4xl font-medium leading-tight tracking-[-0.04em] text-zinc-50 md:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-5 text-base leading-8 text-zinc-400">{description}</p>
      )}
    </motion.div>
  );
}
