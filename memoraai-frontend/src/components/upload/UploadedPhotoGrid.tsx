import { AnimatePresence } from "framer-motion";

import { UploadPreviewCard } from "./UploadPreviewCard";
import { useUploadPhotos } from "../../hooks/useUploadPhotos";
import { useStoryStore } from "../../store/story-store";
import { EmptyState } from "../common/EmptyState";

export function UploadedPhotoGrid() {
  const { uploadedPhotos } = useStoryStore();

  const { removePhoto } = useUploadPhotos();

  if (uploadedPhotos.length === 0) {
    return (
      <EmptyState
        title="No memories uploaded yet"
        description="Your uploaded moments will appear beautifully here before becoming cinematic AI stories."
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence>
        {uploadedPhotos.map((photo) => (
          <UploadPreviewCard
            key={photo.id}
            photo={photo}
            onRemove={removePhoto}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
