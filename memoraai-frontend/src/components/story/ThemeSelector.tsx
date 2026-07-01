import { motion } from "framer-motion";
import { BACKEND_THEMES, THEME_LABELS } from "../../constants/story";
import type { MemoryTheme } from "../../types/story";

interface ThemeSelectorProps {
  value: MemoryTheme;
  onChange: (theme: MemoryTheme) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <motion.div
      role="radiogroup"
      aria-label="Visual aesthetic"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {BACKEND_THEMES.map((themeKey, index) => {
        const theme = THEME_LABELS[themeKey];
        const active = value === themeKey;

        return (
          <motion.button
            key={themeKey}
            type="button"
            role="radio"
            aria-checked={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            onClick={() => onChange(themeKey)}
            className={`group relative flex min-h-35 flex-col justify-center overflow-hidden rounded-3xl border p-8 text-center transition-all duration-300 ${
              active
                ? "border-violet-400/40 bg-violet-500/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-70`}
            />

            <motion.div className="relative z-10 mt-auto w-full">
              <h3 className="text-base font-semibold tracking-tight text-zinc-100">
                <div
                  className={`mb-4 h-4 w-4 rounded-full shadow-[0_0_0.625rem_rgba(255,255,255,0.2)] ${
                    active ? "bg-violet-300" : "bg-zinc-600"
                  }`}
                />
                {theme.title}
              </h3>

              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                {theme.description}
              </p>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
