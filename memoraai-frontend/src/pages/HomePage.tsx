import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useStoryStore } from "../store/story-store";
import { useStoryStream } from "../hooks/useStoryStream";
import { useHydrateUploadedPhotos } from "../hooks/useHydrateUploadedPhotos";
import { Hero } from "../components/layout/Hero";
import { SectionTitle } from "../components/common/SectionTitle";
import { UploadZone } from "../components/upload/UploadZone";
import { UploadedPhotoGrid } from "../components/upload/UploadedPhotoGrid";
import { StoryForm } from "../components/story/StoryForm";
import { StoryProgress } from "../components/story/StoryProgress";
import { StoryHeader } from "../components/story/StoryHeader";
import { StoryGallery } from "../components/story/StoryGallery";
import { ErrorAlert } from "../components/common/ErrorAlert";

export function HomePage() {
  const currentStoryJobId = useStoryStore((s) => s.currentStoryJobId);
  const memoryCards = useStoryStore((s) => s.memoryCards);
  const generationStatus = useStoryStore((s) => s.generationStatus);
  const generationError = useStoryStore((s) => s.generationError);
  const clearError = useStoryStore((s) => s.clearError);

  const [showError, setShowError] = useState(false);

  const galleryRef = useRef<HTMLElement>(null);
  const prevCardCount = useRef(0);

  useStoryStream(currentStoryJobId);
  useHydrateUploadedPhotos();

  useEffect(() => {
    if (generationError) {
      setShowError(true);
    }
  }, [generationError]);

  useEffect(() => {
    if (
      memoryCards.length > 0 &&
      memoryCards.length > prevCardCount.current &&
      galleryRef.current
    ) {
      galleryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevCardCount.current = memoryCards.length;
  }, [memoryCards.length]);

  return (
    <>
      {showError && generationError && (
        <ErrorAlert
          message={generationError}
          onDismiss={() => {
            setShowError(false);
            clearError();
          }}
          duration={8000}
        />
      )}

      <div className="my-12">
        <Hero />
      </div>

      <section id="create" className="section">
        <div className="container flex flex-col gap-16">
          <SectionTitle
            eyebrow="Upload Memories"
            title="Bring your moments into the storytelling engine"
            description="Upload beautiful life moments and prepare them for cinematic AI transformation."
          />

          <UploadZone />
          <UploadedPhotoGrid />
        </div>
      </section>

      <section className="section-sm pt-0">
        <div className="container">
          <StoryForm />
        </div>
      </section>

      {generationStatus !== "idle" && generationStatus !== "failed" && (
        <section className="section-sm">
          <div className="container">
            <StoryProgress />
          </div>
        </section>
      )}

      <section id="gallery" ref={galleryRef} className="section">
        <div className="container flex flex-col gap-12 md:gap-16">
          <StoryHeader totalCards={memoryCards.length} />
          <motion.div layout className="relative">
            <StoryGallery />
          </motion.div>
        </div>
      </section>
    </>
  );
}
