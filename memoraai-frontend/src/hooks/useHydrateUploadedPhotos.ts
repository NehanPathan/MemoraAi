import { useEffect, useRef } from "react";
import { listUploadedPhotos } from "../api";
import { useStoryStore } from "../store/story-store";

export function useHydrateUploadedPhotos() {
  const setUploadedPhotos = useStoryStore((s) => s.setUploadedPhotos);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Guard with a ref (set synchronously, before the async fetch starts)
    // rather than a store-state check, so React StrictMode's double-invoke
    // of effects in dev can't trigger two concurrent fetches that each
    // append and double the list.
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    // No isMounted guard here: hasStartedRef already guarantees this fetch
    // only ever happens once, so the result should always be applied once
    // it resolves — including across StrictMode's dev-only mount → cleanup
    // → remount dance, which would otherwise cause the result to be
    // silently dropped right when it arrives.
    listUploadedPhotos()
      .then((photos) => {
        setUploadedPhotos(
          photos.map((photo) => ({
            id: photo.file_id,
            preview: photo.url,
            uploadedUrl: photo.url,
            fileId: photo.file_id,
            fileName: photo.url.split("/").pop() || "Uploaded photo",
            progress: 100,
            status: "uploaded" as const,
          })),
        );
      })
      .catch((error) => {
        console.error("Failed to load previously uploaded photos:", error);
      });
  }, [setUploadedPhotos]);
}
