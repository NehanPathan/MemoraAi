import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth-store";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function GoogleLoginButton({
  onSuccess,
  className = "",
}: GoogleLoginButtonProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    // Wait for Google script to load
    const loadGoogleScript = () => {
      if (!window.google) {
        setTimeout(loadGoogleScript, 100);
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("VITE_GOOGLE_CLIENT_ID not set");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleLogin,
      });

      // Render the button
      const buttonContainer = document.getElementById("google-signin-button");
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "dark",
          size: "large",
          width: "100%",
        });
      }
    };

    loadGoogleScript();
  }, []);

  const handleGoogleLogin = async (response: any) => {
    try {
      if (!response.credential) {
        toast.error("Failed to get Google credentials");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        toast.error("API URL not configured");
        return;
      }

      // Send token to backend
      const backendResponse = await fetch(`${apiUrl}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: response.credential,
        }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Authentication failed");
      }

      const data = await backendResponse.json();

      // Store token and user
      setToken(data.access_token);
      setUser(data.user);

      toast.success(`Welcome, ${data.user.name}!`);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
      console.error("Google login error:", error);
    }
  };

  return <div id="google-signin-button" className={className} />;
}
