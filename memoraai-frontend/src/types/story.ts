import type { MemoryTheme } from "../constants/story";

export type { MemoryTheme } from "../constants/story";

export type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

export type StoryGenerationStatus =
  | "idle"
  | "creating"
  | "streaming"
  | "completed"
  | "failed";

export interface UploadedPhoto {
  id: string;
  file?: File;
  fileName?: string;
  fileSize?: number;
  preview: string;
  uploadedUrl?: string;
  fileId?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  isDeleting?: boolean;
}

export interface MemoryCard {
  id: string;
  imageUrl: string;
  themeName: string;
  status: string;
  variants?: Record<string, string>;
  errorMessage?: string;
  createdAt: string;
}

export interface StoryFormValues {
  title: string;
  description?: string;
  memoryType: string;
  themeName: MemoryTheme;
  numMemoryCards: number;
}

export interface StoryState {
  uploadedPhotos: UploadedPhoto[];
  memoryCards: MemoryCard[];
  currentStoryJobId?: string;
  generationStatus: StoryGenerationStatus;
  progressMessage?: string;
  error?: string;
}
