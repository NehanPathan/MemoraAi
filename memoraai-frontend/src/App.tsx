import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyStoriesPage } from "./pages/MyStoriesPage";
import { StoryDetailPage } from "./pages/StoryDetailPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { useAuthStore } from "./store/auth-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on client errors
        if (error?.status === 400 || error?.status === 401 || error?.status === 404) {
          return false;
        }
        // Retry up to 2 times on server errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },

    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell>
                <HomePage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <AppShell>
                <MyStoriesPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories/:storyJobId"
          element={
            <ProtectedRoute>
              <AppShell>
                <StoryDetailPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster position="top-right" richColors closeButton theme="dark" />

      {!import.meta.env.PROD && <ReactQueryDevtools initialIsOpen={false} />}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
