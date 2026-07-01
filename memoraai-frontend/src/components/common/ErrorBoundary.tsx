import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error) || (
          <div
            className="flex items-center justify-center min-h-screen bg-zinc-950 p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="w-full max-w-md rounded-lg border border-red-500/30 bg-red-950/20 p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-red-200 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-100/70 mb-4">
                {this.state.error.message || "An unexpected error occurred"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
              >
                Reload page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
