import { motion } from "framer-motion";
import { ImagePlus } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { MAX_UPLOAD_FILE_BYTES } from "../../constants/story";
import { useUploadPhotos } from "../../hooks/useUploadPhotos";

export function UploadZone() {
  const { uploadPhotos } = useUploadPhotos();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxSize: MAX_UPLOAD_FILE_BYTES,
    multiple: true,
    onDrop: async (acceptedFiles) => {
      console.log("FILES DROPPED", acceptedFiles);
      await uploadPhotos(acceptedFiles);
    },
  });

  return (
    <div
      {...getRootProps()}
      className="relative w-full max-w-4xl mx-auto cursor-pointer group"
    >
      <input {...getInputProps()} />

      <motion.div
        animate={{ scale: isDragActive ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`relative overflow-hidden rounded-[2rem] p-12 transition-all duration-500 ease-out ${
          isDragActive
            ? "bg-violet-500/10 ring-2 ring-violet-500/50 shadow-[0_0_5rem_rgba(139,92,246,0.2)]"
            : "bg-zinc-900/40 ring-1 ring-white/10 hover:bg-zinc-900/60 hover:ring-white/20 shadow-[0_0.5rem_2rem_rgba(0,0,0,0.4)]"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-orange-400/5 opacity-50" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-transform duration-500 group-hover:scale-110 shadow-[0_0_1.875rem_rgba(255,255,255,0.05)]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <ImagePlus className="h-8 w-8 text-zinc-300 transition-colors duration-500 group-hover:text-white" />
          </div>

          <h3 className="mt-8 text-3xl font-medium tracking-tight text-zinc-100">
            {isDragActive ? "Drop to upload" : "Select or drop memories"}
          </h3>

          <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-400">
            High-resolution photos work best. Let AI carefully analyze and craft
            your cinematic visual story.
          </p>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
            <span>Supports</span>
            <span className="h-1 w-1 rounded-full bg-zinc-600" />
            <span>JPG, PNG, WEBP</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
