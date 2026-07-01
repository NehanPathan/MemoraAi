import { useAuthStore } from "./store/auth-store";

const API_BASE = "/api";

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type MemoryCardReadyEvent = {
  id: string;
  theme_name: string;
  status: string;
  image_url: string;
  variants?: Record<string, string>;
};

export type MemoryCardFailedEvent = {
  id: string;
  theme_name: string;
  status: string;
  error_message: string;
};

export type StoryCompletedEvent = {
  message: string;
};

export type StoryErrorEvent = {
  error: string;
};

type SubscribeHandlers = {
  onMemoryCardReady: (data: MemoryCardReadyEvent) => void;
  onMemoryCardFailed: (data: MemoryCardFailedEvent) => void;
  onStoryCompleted: (data: StoryCompletedEvent) => void;
  onStoryError: (data: StoryErrorEvent) => void;
  onConnectionClosed: () => void;
};

async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string | { msg: string }[] };
    if (typeof body.detail === "string") {
      return body.detail;
    }
    if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg;
    }
  } catch {
    // ignore parse errors
  }
  return response.statusText || "Request failed";
}

export type UploadedPhotoRecord = {
  file_id: string;
  url: string;
  created_at: string;
};

export async function listUploadedPhotos(): Promise<UploadedPhotoRecord[]> {
  const response = await fetch(`${API_BASE}/photos`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export async function uploadMemoryPhoto(file: File): Promise<{ url: string; file_id: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload-memory-photo`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export async function deleteMemoryPhoto(fileId: string): Promise<void> {
  const params = new URLSearchParams({ file_id: fileId });
  const response = await fetch(`${API_BASE}/photos?${params}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function createStoryJob({
  title,
  description,
  memoryType,
  themeName,
  photoUrls,
  numMemoryCards,
}: {
  title: string;
  description?: string;
  memoryType: string;
  themeName: string;
  photoUrls: string[];
  numMemoryCards: number;
}): Promise<{ story_job_id: string }> {
  const response = await fetch(`${API_BASE}/story-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      title,
      description,
      memory_type: memoryType,
      theme_name: themeName,
      photo_urls: photoUrls,
      num_memory_cards: numMemoryCards,
    }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export type StoryJobDetail = {
  id: string;
  title: string;
  description: string | null;
  memory_type: string;
  theme_name: string;
  status: string;
  memory_cards: {
    id: string;
    card_type: string;
    theme_name: string;
    status: string;
    caption: string | null;
    image_url: string | null;
    error_message: string | null;
    variants: Record<string, string> | null;
  }[];
};

export async function getStoryJob(storyJobId: string): Promise<StoryJobDetail> {
  const response = await fetch(`${API_BASE}/story-jobs/${storyJobId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export type StoryJobSummary = {
  id: string;
  title: string;
  theme_name: string;
  status: string;
  created_at: string;
  thumbnail_url: string | null;
  completed_cards: number;
  total_cards: number;
};

export async function listStoryJobs(): Promise<StoryJobSummary[]> {
  const response = await fetch(`${API_BASE}/story-jobs`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export async function deleteStoryJob(storyJobId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/story-jobs/${storyJobId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

function parseEventData<T>(event: MessageEvent, fallbackMessage: string): T {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

export function subscribeToStoryJob(
  storyJobId: string,
  handlers: SubscribeHandlers,
): EventSource {
  // Pass the JWT as a query param since EventSource can't set custom headers
  const token = useAuthStore.getState().token;
  const url = token
    ? `${API_BASE}/story-jobs/${storyJobId}/stream?token=${encodeURIComponent(token)}`
    : `${API_BASE}/story-jobs/${storyJobId}/stream`;

  const es = new EventSource(url);

  es.addEventListener("memory_card_ready", (event: MessageEvent) => {
    handlers.onMemoryCardReady(
      parseEventData(event, "Invalid memory_card_ready payload"),
    );
  });

  es.addEventListener("memory_card_failed", (event: MessageEvent) => {
    handlers.onMemoryCardFailed(
      parseEventData(event, "Invalid memory_card_failed payload"),
    );
  });

  es.addEventListener("story_completed", (event: MessageEvent) => {
    handlers.onStoryCompleted(
      parseEventData(event, "Invalid story_completed payload"),
    );
    es.close();
  });

  es.addEventListener("story_error", (event: MessageEvent) => {
    handlers.onStoryError(parseEventData(event, "Invalid story_error payload"));
    es.close();
  });

  es.addEventListener("error", () => {
    if (es.readyState === EventSource.CLOSED) {
      handlers.onConnectionClosed();
    }
  });

  return es;
}
