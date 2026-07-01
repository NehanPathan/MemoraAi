import { toast } from "sonner";
import { createStoryJob } from "../api";
import { useStoryStore } from "../store/story-store";
import type { StoryFormValues } from "../types/story";

export function useCreateStory() {
  const uploadedPhotos = useStoryStore((s) => s.uploadedPhotos);
  const setGenerationStatus = useStoryStore((s) => s.setGenerationStatus);
  const setStoryJobId = useStoryStore((s) => s.setStoryJobId);
  const setGenerationError = useStoryStore((s) => s.setGenerationError);
  const clearMemoryCards = useStoryStore((s) => s.clearMemoryCards);

  async function createStory(values: StoryFormValues) {
    const hasUploading = uploadedPhotos.some((p) => p.status === "uploading");
    if (hasUploading) {
      const message = "Please wait for all photos to finish uploading.";
      toast.error(message);
      throw new Error(message);
    }

    const photoUrls = uploadedPhotos
      .filter((photo) => photo.status === "uploaded" && photo.uploadedUrl)
      .map((photo) => photo.uploadedUrl as string);

    if (photoUrls.length === 0) {
      const message = "Upload at least one photo before generating a story.";
      toast.error(message);
      throw new Error(message);
    }

    const hasErrors = uploadedPhotos.some((p) => p.status === "error");
    if (hasErrors) {
      const message = "Remove or re-upload failed photos before continuing.";
      toast.error(message);
      throw new Error(message);
    }

    try {
      setGenerationStatus("creating");
      setGenerationError(undefined);
      clearMemoryCards();

      const response = await createStoryJob({
        title: values.title,
        description: values.description,
        memoryType: values.memoryType,
        themeName: values.themeName,
        photoUrls,
        numMemoryCards: values.numMemoryCards,
      });

      setStoryJobId(response.story_job_id);
      setGenerationStatus("streaming");
      toast.success("Story generation started");

      return response.story_job_id;
    } catch (error) {
      setGenerationStatus("failed");

      const message =
        error instanceof Error ? error.message : "Failed to create story";

      setGenerationError(message);
      toast.error(message);
      throw error;
    }
  }

  return {
    createStory,
  };
}
