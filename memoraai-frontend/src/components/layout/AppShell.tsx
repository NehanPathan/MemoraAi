import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* Cinematic atmospheric blobs moved to AppShell for global effect */}
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      <Navbar />

      <main className="relative z-10 flex min-h-screen flex-col pt-32 pb-24">
        {children}
      </main>
    </div>
  );
}
