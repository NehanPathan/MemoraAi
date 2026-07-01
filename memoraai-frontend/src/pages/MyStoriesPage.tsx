import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trash2, ImageOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { deleteStoryJob, listStoryJobs } from "../api";
import { EmptyState } from "../components/common/EmptyState";
import { SectionTitle } from "../components/common/SectionTitle";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    failed: "bg-red-500/15 text-red-300 border-red-500/20",
    processing: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    pending: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}

export function MyStoriesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: stories, isLoading } = useQuery({
    queryKey: ["story-jobs"],
    queryFn: listStoryJobs,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStoryJob,
    onSuccess: () => {
      toast.success("Story deleted");
      queryClient.invalidateQueries({ queryKey: ["story-jobs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete story");
    },
  });

  return (
    <section className="section">
      <div className="container flex flex-col gap-12">
        <SectionTitle
          eyebrow="My Stories"
          title="Your past cinematic memories"
          description="Every story you've generated lives here. Remove the ones you no longer want to keep."
        />

        {isLoading && (
          <p className="text-center text-sm text-zinc-500">Loading your stories…</p>
        )}

        {!isLoading && (!stories || stories.length === 0) && (
          <EmptyState
            title="No stories yet"
            description="Generate your first cinematic memory story and it will appear here."
          />
        )}

        {!isLoading && stories && stories.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card flex flex-col overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className="relative aspect-[4/3] w-full bg-zinc-900/60 text-left"
                >
                  {story.thumbnail_url ? (
                    <img
                      src={story.thumbnail_url}
                      alt={story.title}
                      className="img-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  {story.total_cards > 1 && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      +{story.total_cards - 1} more
                    </span>
                  )}
                </button>

                <div className="flex flex-1 flex-col gap-3 p-10">
                  <button
                    type="button"
                    onClick={() => navigate(`/stories/${story.id}`)}
                    className="flex items-start justify-between gap-3 text-left"
                  >
                    <h3 className="text-base font-medium text-zinc-100 line-clamp-2">
                      {story.title}
                    </h3>
                    <StatusBadge status={story.status} />
                  </button>

                  <p className="text-xs text-zinc-500">
                    {story.completed_cards}/{story.total_cards} cards &middot;{" "}
                    {new Date(story.created_at).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${story.title}"? This can't be undone.`)) {
                        deleteMutation.mutate(story.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors duration-200 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
