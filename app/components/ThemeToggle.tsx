import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "~/lib/theme";
import {
  AiOutlineSun,
  AiOutlineMoon,
  AiOutlineDesktop,
  AiOutlineCheck,
} from "react-icons/ai";

export interface ThemeToggleProps {
  variant?: "button" | "dropdown" | "segmented";
  size?: "sm" | "md";
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle = ({
  variant = "button",
  size = "md",
  className = "",
  showLabel = false,
}: ThemeToggleProps) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const isDark = resolvedTheme === "dark";

  // Segmented control variant (useful in settings, modals, or footers)
  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
          title="Light theme"
        >
          <AiOutlineSun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
          title="Dark theme"
        >
          <AiOutlineMoon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === "system"
              ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-xs"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
          title="Match system preference"
        >
          <AiOutlineDesktop className="w-3.5 h-3.5" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  // Dropdown variant with Light, Dark, System
  if (variant === "dropdown") {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer ${
            size === "sm" ? "p-1.5 text-xs" : "p-2 text-sm"
          }`}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label={`Toggle theme (currently ${theme})`}
        >
          {isDark ? (
            <AiOutlineMoon className="w-4 h-4 text-indigo-400" />
          ) : (
            <AiOutlineSun className="w-4 h-4 text-amber-500" />
          )}
          {showLabel && (
            <span className="capitalize font-medium text-xs">
              {theme}
            </span>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                setDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AiOutlineSun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </div>
              {theme === "light" && (
                <AiOutlineCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                setDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AiOutlineMoon className="w-4 h-4 text-indigo-400" />
                <span>Dark</span>
              </div>
              {theme === "dark" && (
                <AiOutlineCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme("system");
                setDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border-t border-gray-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-2">
                <AiOutlineDesktop className="w-4 h-4 text-gray-400" />
                <span>System</span>
              </div>
              {theme === "system" && (
                <AiOutlineCheck className="w-3.5 h-3.5 text-gray-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default button variant (direct toggle with animated Sun / Moon icon)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative rounded-full border border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center ${
        size === "sm" ? "w-8 h-8" : "w-9 h-9 sm:w-10 sm:h-10"
      } ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <AiOutlineSun
          className={`absolute transition-all duration-300 transform ${
            isDark
              ? "opacity-0 rotate-90 scale-50 pointer-events-none text-amber-400"
              : "opacity-100 rotate-0 scale-100 text-amber-500"
          } ${size === "sm" ? "w-4 h-4" : "w-5 h-5"}`}
        />

        {/* Moon Icon */}
        <AiOutlineMoon
          className={`absolute transition-all duration-300 transform ${
            isDark
              ? "opacity-100 rotate-0 scale-100 text-indigo-400"
              : "opacity-0 -rotate-90 scale-50 pointer-events-none text-indigo-500"
          } ${size === "sm" ? "w-4 h-4" : "w-5 h-5"}`}
        />
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-semibold capitalize hidden sm:inline">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
