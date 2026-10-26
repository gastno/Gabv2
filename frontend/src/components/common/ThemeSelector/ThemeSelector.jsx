import React from "react";
import "./ThemeSelector.css";

function ThemeSelector({ theme, onChange }) {
  const nextTheme = theme === "light" ? "dark" : "light";
  const actionLabel = `Switch to ${nextTheme} mode`;

  return (
    <div className="theme-selector" role="group" aria-label="Color theme">
      <button
        type="button"
        aria-label={actionLabel}
        aria-pressed={theme === "dark"}
        title={actionLabel}
        onClick={() => onChange(nextTheme)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18h6M10 22h4M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1.2 1.3-1.3 2h-4.4c-.1-.7-.5-1.4-1.3-2Z" />
          <path d="M12 2v1M4.93 4.93l.7.7M2 12h1M20 12h1M18.37 5.63l.7-.7" />
        </svg>
      </button>
    </div>
  );
}

export default ThemeSelector;
