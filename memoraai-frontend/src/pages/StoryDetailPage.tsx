import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { deleteStoryJob, getStoryJob } from "../api";
import { EmptyState } from "../components/common/EmptyState";
import { SectionTitle } from "../components/common/SectionTitle";
import { MemoryCard } from "../components/story/MemoryCard";
import type { MemoryCard as MemoryCardType } from "../types/story";

export function StoryDetailPage() {
  const { storyJobId } = useParams<{ storyJobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: story, isLoading } = useQuery({
    queryKey: ["story-job", storyJobId],
    queryFn: () => getStoryJob(storyJobId as string),
    enabled: !!storyJobId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStoryJob,
    onSuccess: () => {
      toast.success("Story deleted");
      queryClient.invalidateQueries({ queryKey: ["story-jobs"] });
      navigate("/stories");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete story");
    },
  });

  const memoryCards: MemoryCardType[] =
    story?.memory_cards.map((card) => ({
      id: card.id,
      imageUrl: card.image_url || "",
      themeName: card.theme_name,
      status: card.status,
      variants: card.variants || undefined,
      errorMessage: card.error_message || undefined,
      createdAt: "",
    })) ?? [];

  return (
    <section className="section">
      <div className="container flex flex-col gap-12">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/stories")}
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Stories
          </button>

          {story && (
            <button
              onClick={() => {
                if (confirm(`Delete "${story.title}"? This can't be undone.`)) {
                  deleteMutation.mutate(story.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors duration-200 hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Story
            </button>
          )}
        </div>

        {isLoading && (
          <p className="text-center text-sm text-zinc-500">Loading story…</p>
        )}

        {story && (
          <SectionTitle
            eyebrow={story.status}
            title={story.title}
            description={story.description || undefined}
          />
        )}

        {story && memoryCards.length === 0 && (
          <EmptyState
            title="No memory cards in this story"
            description="This story doesn't have any generated cards yet."
          />
        )}

        {memoryCards.length > 0 && (
          <div className="masonry-grid">
            <AnimatePresence>
              {memoryCards.map((card, index) => (
                <div key={card.id} className="masonry-item">
                  <MemoryCard card={card} index={index} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
