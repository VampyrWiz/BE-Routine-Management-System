// ThemeProvider enables dark/light theme toggling across the app.
// It sets a data-theme attribute on <html> so our CSS can swap
// CSS custom properties (Gruvbox palette) via attribute selectors.
import { createContext, useContext, useState, useEffect } from 'react';

// ThemeContext: the React context object carrying theme state + toggle().
// Components consume it via the useTheme() hook below.
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Initialise theme from localStorage (default to 'dark') so the user's
  // preference persists across sessions.
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Every time the theme changes, update the data-theme attribute on the
  // document root (triggers CSS variable swap) and persist the choice.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
