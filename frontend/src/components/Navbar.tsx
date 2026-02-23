import React, { useState, useEffect, useCallback } from "react";
import {
  SparklesIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  HomeIcon,
  FolderIcon,
  CodeIcon,
  StarIcon,
} from "./Icons";
import { useTheme } from "../contexts/ThemeContext";
import type { PageName } from "../types";

interface Props {
  onLogout: () => void;
  setPage: (page: PageName) => void;
  page: PageName;
  isGuest: boolean;
  onSignInClick: () => void;
}

const NAV_ITEMS: {
  key: PageName;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { key: "home", label: "Home", Icon: HomeIcon },
  { key: "projects", label: "Projects", Icon: FolderIcon },
  { key: "snippets", label: "Snippets", Icon: CodeIcon },
  { key: "starred", label: "Starred", Icon: StarIcon },
];

export const Navbar: React.FC<Props> = React.memo(
  ({ onLogout, setPage, page, isGuest, onSignInClick }) => {
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
      const handleScroll = () => setIsScrolled(window.scrollY > 10);
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogoutClick = useCallback(() => setShowLogoutConfirm(true), []);
    const confirmLogout = useCallback(() => {
      setShowLogoutConfirm(false);
      onLogout();
    }, [onLogout]);
    const cancelLogout = useCallback(() => setShowLogoutConfirm(false), []);

    return (
      <>
        <nav
          className={`sticky top-0 z-50 transition-all duration-300 animate-fade-in-down ${
            isScrolled
              ? "bg-bg/30 backdrop-blur-md border-b border-white/5 shadow-sm"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-primary" />
              <span className="text-[18px] font-bold gradient-text tracking-tight">
                sonicxcode
              </span>
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-1 bg-bg-card/50 rounded-full p-1 border border-border/50 pt-2">
              {NAV_ITEMS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    page === key
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-text-muted hover:text-text hover:bg-bg-elevated/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-text-muted hover:text-text hover:bg-bg-elevated/50 transition-all duration-200"
                title={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
              >
                {theme === "dark" ? (
                  <SunIcon className="w-4 h-4" />
                ) : (
                  <MoonIcon className="w-4 h-4" />
                )}
              </button>

              {isGuest ? (
                <button
                  onClick={onSignInClick}
                  className="px-4 py-1.5 btn-primary rounded-full text-xs"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-error hover:bg-error/5 rounded-full transition-all duration-200 border border-transparent hover:border-error/20"
                >
                  <LogoutIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg-overlay animate-fade-in"
            onClick={cancelLogout}
          >
            <div
              className="glass-strong rounded-2xl p-6 shadow-2xl max-w-xs w-full animate-scale-in text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-text mb-2">
                Confirm Logout
              </h3>
              <p className="text-text-muted text-sm mb-5">
                Are you sure you want to log out?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelLogout}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-bg-elevated/50 rounded-md transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 bg-error text-white text-sm font-bold rounded-md hover:bg-red-600 transition-all active:scale-95"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);
