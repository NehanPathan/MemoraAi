import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Edit3 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BACKEND_THEMES, MAX_MEMORY_CARDS } from "../../constants/story";
import { useCreateStory } from "../../hooks/useCreateStory";
import { useStoryStore } from "../../store/story-store";
import type { StoryFormValues } from "../../types/story";
import { Button } from "../common/Button";
import { ThemeSelector } from "./ThemeSelector";

const schema = z.object({
  title: z.string().min(3, "Please add a meaningful title"),
  description: z.string().optional(),
  memoryType: z.string().min(2, "Memory type is required"),
  themeName: z.enum(BACKEND_THEMES),
  numMemoryCards: z.number().min(1).max(MAX_MEMORY_CARDS),
});

export function StoryForm() {
  const { createStory } = useCreateStory();
  const uploadedPhotos = useStoryStore((s) => s.uploadedPhotos);
  const generationStatus = useStoryStore((s) => s.generationStatus);

  const uploadedCount = uploadedPhotos.filter(
    (p) => p.status === "uploaded",
  ).length;
  const isUploading = uploadedPhotos.some((p) => p.status === "uploading");
  const canSubmit =
    uploadedCount > 0 && !isUploading && generationStatus !== "streaming";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      memoryType: "life moments",
      themeName: "nostalgic_film",
      numMemoryCards: MAX_MEMORY_CARDS,
    },
  });

  // Once a story finishes, clear the form so the same uploaded photos can be
  // reused for another story without re-uploading.
  useEffect(() => {
    if (generationStatus === "completed") {
      reset();
    }
  }, [generationStatus, reset]);

  async function onSubmit(values: StoryFormValues) {
    await createStory(values);
  }

  const inputClass =
    "w-full bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 rounded-2xl border-0 ring-1 ring-white/10 focus:ring-2 focus:ring-violet-500/50 focus:bg-zinc-900/80 transition-all duration-300 outline-none";

  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit(onSubmit)}
      className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900/40 p-12 md:p-14 ring-1 ring-white/10 shadow-[0_2rem_4rem_rgba(0,0,0,0.5)] backdrop-blur-2xl max-w-5xl mx-auto"
    >
      <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-orange-400/5" />

      <motion.div className="relative z-10 mb-10 flex flex-col items-start gap-3">
        <motion.div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md shadow-sm">
          <Edit3 className="h-4 w-4 text-zinc-300" />
          <span className="text-sm font-medium tracking-wide text-zinc-300">
            Story Director
          </span>
        </motion.div>

        <h2 className="text-3xl font-medium tracking-tight text-white md:text-4xl">
          Direct your narrative
        </h2>
        <p className="max-w-xl text-base text-zinc-400">
          Shape the emotion, tone, and pacing of your memories. We&apos;ll
          handle the cinematic generation.
        </p>
      </motion.div>

      <div className="relative z-10 grid gap-10">
        <div className="space-y-3">
          <label
            htmlFor="story-title"
            className="ml-1 text-sm font-medium text-zinc-300"
          >
            Story Title
          </label>
          <input
            id="story-title"
            {...register("title")}
            placeholder="e.g. A Summer We Never Forgot..."
            className={`${inputClass} h-14 px-5 text-lg`}
          />
          {errors.title && (
            <p className="ml-1 text-sm text-red-400/90">
              {errors.title.message}
            </p>
          )}
        </div>

        <motion.div className="space-y-2">
          <label
            htmlFor="story-description"
            className="ml-1 text-sm font-medium text-zinc-300"
          >
            Emotional Context
          </label>
          <textarea
            id="story-description"
            {...register("description")}
            placeholder="Describe the feelings, the atmosphere, the subtle details..."
            className={`${inputClass} min-h-35 resize-none px-5 py-4`}
          />
        </motion.div>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-3">
            <label
              htmlFor="memory-type"
              className="ml-1 text-sm font-medium text-zinc-300"
            >
              Focus Subject
            </label>
            <input
              id="memory-type"
              {...register("memoryType")}
              placeholder="e.g. Travel, Family, Solitude"
              className={`${inputClass} h-14 px-5`}
            />
          </div>

          <motion.div className="space-y-3">
            <label className="ml-1 text-sm font-medium text-zinc-300">
              Story Chapters
            </label>
            <div className="flex h-14 items-center gap-2 rounded-2xl bg-zinc-900/50 p-1.5 ring-1 ring-white/10">
              {Array.from({ length: MAX_MEMORY_CARDS }, (_, i) => i + 1).map(
                (count) => {
                  const active = watch("numMemoryCards") === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setValue("numMemoryCards", count)}
                      className={`flex-1 h-full rounded-xl text-sm font-medium transition-all duration-300 ${
                        active
                          ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-[0_0.25rem_1.25rem_rgba(139,92,246,0.35)]"
                          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                      }`}
                    >
                      {count}
                    </button>
                  );
                },
              )}
            </div>
            <p className="ml-1 text-xs text-zinc-500">
              Up to {MAX_MEMORY_CARDS} chapters (one per visual theme).
            </p>
          </motion.div>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-4">
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-zinc-200">
              Visual Aesthetic
            </h3>
            <p className="text-sm text-zinc-400">
              Your first chapter uses this theme; additional chapters cycle
              through related styles.
            </p>
          </div>
          <ThemeSelector
            value={watch("themeName")}
            onChange={(theme) => setValue("themeName", theme)}
          />
        </div>
      </div>

      <div className="relative z-10 mt-12 space-y-3">
        {!canSubmit && !isSubmitting && (
          <p className="text-center text-sm text-zinc-500">
            {isUploading
              ? "Waiting for uploads to finish…"
              : "Upload at least one photo to enable generation."}
          </p>
        )}

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!canSubmit || isSubmitting}
          fullWidth
          className="!h-14 !rounded-2xl !text-lg shadow-[0_0_2.5rem_rgba(139,92,246,0.3)]"
        >
          Generate Cinematic Story
        </Button>
      </div>
    </motion.form>
  );
}
