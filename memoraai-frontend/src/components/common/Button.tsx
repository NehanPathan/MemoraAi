import { motion } from "framer-motion";

import type { ReactNode } from "react";

import type { HTMLMotionProps } from "framer-motion";

import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "light";

interface Props extends HTMLMotionProps<"button"> {
  children: ReactNode;

  variant?: ButtonVariant;

  loading?: boolean;

  icon?: ReactNode;

  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  loading,
  icon,
  fullWidth,
  className,
  ...props
}: Props) {
  return (
    <motion.button
      whileTap={{
        scale: 0.98,
      }}
      whileHover={{
        y: -1,
      }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border px-6 py-3 text-sm font-medium transition-all duration-300",
        "disabled:pointer-events-none disabled:opacity-50",
        fullWidth && "w-full",
        variant === "primary" &&
          "border-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-[0_0.75rem_3.125rem_rgba(139,92,246,0.35)]",
        variant === "secondary" &&
          "border-white/10 bg-white/5 text-zinc-100 backdrop-blur-xl hover:bg-white/10",
        variant === "ghost" &&
          "border-transparent bg-transparent text-zinc-300 hover:bg-white/5",
        variant === "light" &&
          "bg-white text-zinc-950 border-transparent hover:bg-zinc-200 shadow-[0_0_1.875rem_rgba(255,255,255,0.2)]",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-0 bg-white/[0.06] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      ) : (
        icon
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
