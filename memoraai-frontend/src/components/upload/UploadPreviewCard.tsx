import { motion } from "framer-motion";
import { AlertCircle, Check, Trash2, UploadCloud, Loader2 } from "lucide-react";
import type { UploadedPhoto } from "../../types/story";

interface UploadPreviewCardProps {
  photo: UploadedPhoto;
  onRemove: (id: string) => void;
}

export function UploadPreviewCard({ photo, onRemove }: UploadPreviewCardProps) {
  const fileName = photo.file?.name ?? photo.fileName ?? "Uploaded photo";
  const fileSize = photo.file?.size ?? photo.fileSize;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, filter: "blur(0.25rem)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0rem)" }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(0.25rem)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.4)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={photo.preview}
          alt={fileName}
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />

        {/* Soft elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-zinc-950/20 opacity-80" />

        <button
          type="button"
          onClick={() => onRemove(photo.id)}
          disabled={photo.isDeleting}
          className="absolute right-8 top-8 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-red-500/80 group-hover:opacity-100 shadow-[0_0_1.25rem_rgba(0,0,0,0.3)] disabled:bg-red-500/50 disabled:hover:bg-red-500/50 disabled:cursor-not-allowed"
        >
          {photo.isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="absolute bottom-0 inset-x-0 p-9">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-sm font-medium tracking-tight text-white shadow-black text-shadow-sm">
                {fileName}
              </p>
              {fileSize !== undefined && (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {(fileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>

            <div className="flex-shrink-0">
              {photo.status === "uploading" && (
                <div className="flex h-7 items-center justify-center rounded-full bg-white/10 px-3 text-xs font-medium text-zinc-200 backdrop-blur-md ring-1 ring-white/20">
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                  Uploading
                </div>
              )}

              {photo.status === "uploaded" && (
                <div className="flex h-7 items-center justify-center rounded-full bg-emerald-500/20 px-3 text-xs font-medium text-emerald-300 backdrop-blur-md ring-1 ring-emerald-500/30">
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Ready
                </div>
              )}

              {photo.status === "error" && (
                <div className="flex h-7 items-center justify-center rounded-full bg-red-500/20 px-3 text-xs font-medium text-red-300 backdrop-blur-md ring-1 ring-red-500/30">
                  <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                  Failed
                </div>
              )}
            </div>
          </div>

          {photo.status === "uploading" && (
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${photo.progress}%` }}
                transition={{ ease: "linear" }}
                className="h-full rounded-full bg-white shadow-[0_0_0.625rem_rgba(255,255,255,0.5)]"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
