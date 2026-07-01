import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store";
import { Button } from "../common/Button";

export function Navbar() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 100], [0, -10]);
  const opacity = useTransform(scrollY, [0, 100], [1, 0.95]);

  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.header
      style={{ y, opacity }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const }}
      className="mx-auto px-6"
    >
      <div className="flex h-16 items-center justify-between rounded-full border border-white/10 bg-zinc-950/85 px-6 backdrop-blur-3xl shadow-[0_0.5rem_2rem_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 shadow-[0_0_1.25rem_rgba(139,92,246,0.15)] transition-all duration-500 group-hover:shadow-[0_0_1.875rem_rgba(139,92,246,0.3)]">
            <Sparkles className="h-5 w-5 text-violet-300 transition-transform duration-500 group-hover:scale-110" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm font-medium tracking-tight text-zinc-100">
              MemoraAI
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {isAuthenticated && (
            <>
              <button
                onClick={() => navigate("/stories")}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                My Stories
              </button>
              <span className="text-sm text-zinc-400">
                {user?.name || user?.email}
              </span>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="!h-9 !px-4 !text-xs !bg-white/5 hover:!bg-white/10 !border-white/5 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
          {!isAuthenticated && (
            <Button
              variant="secondary"
              onClick={() => navigate("/login")}
              className="!h-9 !px-4 !text-xs !bg-white/5 hover:!bg-white/10 !border-white/5"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
