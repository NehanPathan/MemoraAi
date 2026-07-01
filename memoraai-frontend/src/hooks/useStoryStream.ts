import { useEffect } from "react";
import { toast } from "sonner";
import { subscribeToStoryJob } from "../api";
import { useStoryStore } from "../store/story-store";

export function useStoryStream(storyJobId?: string) {
  const addMemoryCard = useStoryStore((s) => s.addMemoryCard);
  const setGenerationStatus = useStoryStore((s) => s.setGenerationStatus);
  const setProgressMessage = useStoryStore((s) => s.setProgressMessage);
  const setGenerationError = useStoryStore((s) => s.setGenerationError);

  useEffect(() => {
    if (!storyJobId) {
      return;
    }

    let isMounted = true;

    const es = subscribeToStoryJob(storyJobId, {
      onMemoryCardReady(data) {
        if (!isMounted) {
          return;
        }

        addMemoryCard({
          id: data.id,
          imageUrl: data.image_url,
          themeName: data.theme_name,
          status: data.status,
          variants: data.variants,
          createdAt: new Date().toISOString(),
        });

        setProgressMessage("A new memory has been beautifully generated.");
        toast.success("Memory card ready");
      },

      onMemoryCardFailed(data) {
        if (!isMounted) {
          return;
        }

        addMemoryCard({
          id: data.id,
          imageUrl: "",
          themeName: data.theme_name,
          status: "failed",
          errorMessage: data.error_message,
          createdAt: new Date().toISOString(),
        });

        toast.error(data.error_message || "A memory card failed to generate");
      },

      onStoryCompleted() {
        if (!isMounted) {
          return;
        }

        setGenerationStatus("completed");
        setProgressMessage("Your cinematic memory story is complete.");
        toast.success("Story generation complete");
      },

      onStoryError(data) {
        if (!isMounted) {
          return;
        }

        setGenerationStatus("failed");
        setGenerationError(data.error);
        toast.error(data.error);
      },

      onConnectionClosed() {
        if (!isMounted) {
          return;
        }

        const status = useStoryStore.getState().generationStatus;
        if (status === "streaming") {
          setGenerationStatus("failed");
          setGenerationError("The storytelling stream disconnected. Please try again.");
          toast.error("Story stream disconnected");
        }
      },
    });

    return () => {
      isMounted = false;
      es.close();
    };
  }, [
    storyJobId,
    addMemoryCard,
    setGenerationStatus,
    setProgressMessage,
    setGenerationError,
  ]);
}
