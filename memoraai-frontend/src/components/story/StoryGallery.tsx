import { AnimatePresence } from "framer-motion";

import { MemoryCard } from "./MemoryCard";
import { useStoryStore } from "../../store/story-store";
import { EmptyState } from "../common/EmptyState";

export function StoryGallery() {
  const { memoryCards } = useStoryStore();

  if (memoryCards.length === 0) {
    return (
      <EmptyState
        title="Your generated story gallery is empty"
        description="As AI crafts emotional visual scenes, your cinematic memory cards will appear beautifully here."
      />
    );
  }

  return (
    <div className="masonry-grid">
      <AnimatePresence>
        {memoryCards.map((card, index) => (
          <div key={card.id} className="masonry-item">
            <MemoryCard card={card} index={index} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
