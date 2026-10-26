import { useCallback, useState } from "react";

const STORAGE_KEY = "gabv2_workspace_theme";

function readSavedTheme() {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  return savedTheme === "dark" ? "dark" : "light";
}

function useWorkspaceTheme() {
  const [theme, setTheme] = useState(readSavedTheme);

  const changeTheme = useCallback((nextTheme) => {
    if (nextTheme !== "light" && nextTheme !== "dark") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }, []);

  return [theme, changeTheme];
}

export default useWorkspaceTheme;
