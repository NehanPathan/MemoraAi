import { create } from "zustand";
import type {
  MemoryCard,
  StoryGenerationStatus,
  UploadedPhoto,
} from "../types/story";

type StoryStore = {
  uploadedPhotos: UploadedPhoto[];
  memoryCards: MemoryCard[];
  generationStatus: StoryGenerationStatus;
  currentStoryJobId?: string;
  progressMessage?: string;
  generationError?: string;
  addPhoto: (photo: UploadedPhoto) => void;
  setUploadedPhotos: (photos: UploadedPhoto[]) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, partial: Partial<UploadedPhoto>) => void;
  clearPhotos: () => void;
  addMemoryCard: (card: MemoryCard) => void;
  clearMemoryCards: () => void;
  setGenerationStatus: (status: StoryGenerationStatus) => void;
  setStoryJobId: (id: string) => void;
  setProgressMessage: (message: string) => void;
  setGenerationError: (message?: string) => void;
  clearError: () => void;
  resetStory: () => void;
};

export const useStoryStore = create<StoryStore>((set) => ({
  uploadedPhotos: [],
  memoryCards: [],
  generationStatus: "idle",

  addPhoto: (photo) =>
    set((state) => ({
      uploadedPhotos: [...state.uploadedPhotos, photo],
    })),

  setUploadedPhotos: (photos) => set({ uploadedPhotos: photos }),

  removePhoto: (id) =>
    set((state) => ({
      uploadedPhotos: state.uploadedPhotos.filter((photo) => photo.id !== id),
    })),

  updatePhoto: (id, partial) =>
    set((state) => ({
      uploadedPhotos: state.uploadedPhotos.map((photo) =>
        photo.id === id ? { ...photo, ...partial } : photo,
      ),
    })),

  clearPhotos: () => {
    const photos = useStoryStore.getState().uploadedPhotos;
    for (const photo of photos) {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    }
    set({ uploadedPhotos: [] });
  },

  addMemoryCard: (card) =>
    set((state) => {
      const exists = state.memoryCards.some((c) => c.id === card.id);
      if (exists) {
        return {
          memoryCards: state.memoryCards.map((c) =>
            c.id === card.id ? { ...c, ...card } : c,
          ),
        };
      }
      return { memoryCards: [card, ...state.memoryCards] };
    }),

  clearMemoryCards: () => set({ memoryCards: [] }),

  setGenerationStatus: (status) => set({ generationStatus: status }),

  setStoryJobId: (id) => set({ currentStoryJobId: id }),

  setProgressMessage: (message) => set({ progressMessage: message }),

  setGenerationError: (message) => set({ generationError: message }),

  clearError: () => set({ generationError: undefined }),

  resetStory: () =>
    set({
      memoryCards: [],
      generationStatus: "idle",
      currentStoryJobId: undefined,
      progressMessage: undefined,
      generationError: undefined,
    }),
}));
