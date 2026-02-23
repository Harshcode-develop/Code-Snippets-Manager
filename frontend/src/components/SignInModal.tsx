import React, { useState, useEffect } from "react";
import { EmailIcon, LockIcon, GoogleIcon, CloseIcon } from "./Icons";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, refreshToken: string) => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export const SignInModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  showNotification,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await apiFetch<{
          token: string;
          refresh_token: string;
          message: string;
        }>("/auth/login", "POST", { email, password });
        onAuthSuccess(data.token, data.refresh_token);
        showNotification(data.message, "success");
        onClose();
      } else {
        if (password.length < 6) {
          showNotification("Password must be at least 6 characters.", "error");
          return;
        }
        const data = await apiFetch<{ message: string }>(
          "/auth/signup",
          "POST",
          { email, password },
        );
        showNotification(data.message + " You can now log in.", "success");
        setIsLogin(true);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      showNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      console.error("Google Auth Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Google sign-in failed. Check the console.";
      showNotification(message, "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-bg-overlay backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-bg-card/15 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-strong">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-elevated/30 transition-colors z-20"
          >
            <CloseIcon className="w-4 h-4" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-text mb-1">
                {isLogin ? "Welcome back!" : "Create Account"}
              </h2>
              <p className="text-sm text-text-muted">
                {isLogin
                  ? "Sign in to save and sync your snippets"
                  : "Sign up to start organizing your code"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-xs font-medium text-text-muted mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EmailIcon className="h-4 w-4 text-text-muted" />
                  </div>
                  <input
                    type="email"
                    id="signin-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="block w-full pl-9 pr-3 py-2.5 bg-bg-input border border-border rounded-md text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-xs font-medium text-text-muted mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-4 w-4 text-text-muted" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="block w-full pl-9 pr-10 py-2.5 bg-bg-input border border-border rounded-md text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        <path
                          fillRule="evenodd"
                          d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                        <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                        <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.702 7.69 10.677 7.69.612 0 1.209-.048 1.791-.14l-3.097-3.097A5.25 5.25 0 016.75 12z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              {isLogin && (
                <div className="flex items-center mt-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 bg-white border border-black/20 rounded accent-primary cursor-pointer appearance-none checked:bg-primary checked:border-primary relative"
                    style={{
                      backgroundImage: rememberMe
                        ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`
                        : "none",
                      backgroundSize: "100% 100%",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-xs cursor-pointer text-text-muted select-none"
                  >
                    Remember me for 30 days
                  </label>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 btn-primary text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-transparent backdrop-blur-md rounded-full text-text-muted">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-bg-input border border-border rounded-md text-sm font-medium text-text hover:bg-bg-elevated transition-all hover:border-border-hover"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>

            {/* Toggle */}
            <p className="mt-5 text-center text-xs text-text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1.5 font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
