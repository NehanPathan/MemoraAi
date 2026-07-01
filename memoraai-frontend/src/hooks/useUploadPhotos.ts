import { useCallback } from "react";
import { toast } from "sonner";
import { uploadMemoryPhoto, deleteMemoryPhoto } from "../api";
import { MAX_UPLOAD_FILE_BYTES } from "../constants/story";
import { useStoryStore } from "../store/story-store";
import type { UploadedPhoto } from "../types/story";

const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function useUploadPhotos() {
  const addPhoto = useStoryStore((s) => s.addPhoto);
  const updatePhoto = useStoryStore((s) => s.updatePhoto);
  const removePhotoFromStore = useStoryStore((s) => s.removePhoto);

  const uploadPhotos = useCallback(
    async (files: File[]) => {
      // Validate batch total size
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > 100 * 1024 * 1024) {
        toast.error("Total batch size cannot exceed 100MB");
        return;
      }

      for (const file of files) {
        // Validate file type
        if (!ALLOWED_FORMATS.includes(file.type)) {
          toast.error(
            `${file.name} format not supported. Use JPG, PNG, WebP, or GIF.`
          );
          continue;
        }

        // Validate file size
        if (file.size > MAX_UPLOAD_FILE_BYTES) {
          toast.error(
            `${file.name} is too large (max 10MB per file)`
          );
          continue;
        }

        const id = crypto.randomUUID();
        const preview = URL.createObjectURL(file);

        const localPhoto: UploadedPhoto = {
          id,
          file,
          preview,
          progress: 0,
          status: "uploading",
        };

        addPhoto(localPhoto);

        try {
          updatePhoto(id, { progress: 30 });

          const response = await uploadMemoryPhoto(file);

          updatePhoto(id, {
            progress: 100,
            status: "uploaded",
            uploadedUrl: response.url,
            fileId: response.file_id,
          });

          toast.success(`${file.name} uploaded successfully`);
        } catch (error) {
          let message = "Upload failed. Please try again.";

          if (error instanceof Error) {
            message = error.message;
            // Provide more specific error messages
            if (message.includes("413")) {
              message = `${file.name} is too large`;
            } else if (message.includes("400")) {
              message = `${file.name} is not a valid image`;
            } else if (message.includes("401")) {
              message = "Authentication failed. Please reload the page.";
            } else if (message.includes("502")) {
              message = "Upload service is unavailable. Please try again later.";
            }
          }

          updatePhoto(id, {
            status: "error",
            error: message,
          });

          toast.error(message);
        }
      }
    },
    [addPhoto, updatePhoto]
  );

  const removePhoto = useCallback(
    async (id: string) => {
      const photo = useStoryStore
        .getState()
        .uploadedPhotos.find((p) => p.id === id);

      if (!photo) {
        return;
      }

      // Set deleting state
      updatePhoto(id, { isDeleting: true });

      try {
        // Revoke preview URL
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview);
        }

        // Delete from ImageKit if it was successfully uploaded
        if (photo.fileId && photo.status === "uploaded") {
          try {
            await deleteMemoryPhoto(photo.fileId);
            toast.success(`${photo.file?.name ?? photo.fileName ?? "Photo"} removed from storage`);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to remove from storage";
            toast.error(message);
            console.error("Failed to delete from ImageKit:", error);
            // Reset deleting state on error
            updatePhoto(id, { isDeleting: false });
            return;
          }
        }

        // Remove from store
        removePhotoFromStore(id);
      } catch (error) {
        console.error("Error removing photo:", error);
        updatePhoto(id, { isDeleting: false });
      }
    },
    [removePhotoFromStore, updatePhoto]
  );

  return {
    uploadPhotos,
    removePhoto,
  };
}
