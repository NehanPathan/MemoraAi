import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, ShieldCheck, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/auth-store";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "AI-directed chapters",
    description: "Your photos become a cinematic, theme-driven narrative.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "Your memories and account data are never shared.",
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    // Redirect to home if already authenticated
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    navigate("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900/40 p-11 sm:p-12 ring-1 ring-white/10 shadow-[0_2rem_4rem_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-orange-400/5" />

          <div className="relative z-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-[0_0.5rem_1.875rem_rgba(139,92,246,0.4)]">
                <Film className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Welcome to MemoraAI
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Sign in to create your cinematic memory stories
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {title}
                    </p>
                    <p className="text-xs text-zinc-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-1.5 shadow-[0_0.75rem_1.875rem_rgba(0,0,0,0.25)]">
                <GoogleLoginButton
                  onSuccess={handleLoginSuccess}
                  className="w-full [&_iframe]:!w-full"
                />
              </div>

              <p className="text-xs leading-relaxed text-zinc-500 text-center">
                By continuing, you agree to sign in securely with your Google
                account. Your data is protected and never shared.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
