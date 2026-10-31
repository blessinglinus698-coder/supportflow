import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark" | "ocean";

const THEMES: Theme[] = ["light", "dark", "ocean"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("supportflow-theme");
    return THEMES.includes(saved as Theme) ? (saved as Theme) : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("supportflow-theme", theme);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
  }

  // Cycles light -> dark -> ocean -> light. Kept for any existing quick-toggle
  // button elsewhere in the app; Settings now uses setTheme directly so each
  // of the three options can be picked explicitly.
  function toggleTheme() {
    setThemeState((prev) => {
      const nextIndex = (THEMES.indexOf(prev) + 1) % THEMES.length;
      return THEMES[nextIndex];
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}