import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  className = "w-full h-4",
  variant = "rectangular",
}: SkeletonProps) {
  const baseClass = "bg-zinc-800/50 overflow-hidden";

  let variantClass = "";
  switch (variant) {
    case "circular":
      variantClass = "rounded-full";
      break;
    case "text":
      variantClass = "rounded";
      break;
    default:
      variantClass = "rounded-lg";
  }

  return (
    <motion.div
      className={`${baseClass} ${variantClass} ${className}`}
      animate={{
        background: [
          "linear-gradient(90deg, rgb(39, 39, 42) 0%, rgb(63, 63, 70) 50%, rgb(39, 39, 42) 100%)",
        ],
        backgroundPosition: ["0% 0%", "100% 0%"],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
    />
  );
}

interface SkeletonGroupProps {
  count?: number;
  className?: string;
}

export function SkeletonGroup({ count = 3, className = "" }: SkeletonGroupProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="w-full h-12" />
      ))}
    </div>
  );
}
