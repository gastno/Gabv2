import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ThemeSelector from "../../../components/common/ThemeSelector/ThemeSelector";
import useWorkspaceTheme from "./useWorkspaceTheme";

function ThemeHarness() {
  const [theme, changeTheme] = useWorkspaceTheme();
  return (
    <div data-testid="workspace" data-theme={theme}>
      <ThemeSelector theme={theme} onChange={changeTheme} />
    </div>
  );
}

describe("workspace theme selection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to light mode and persists the selected theme", () => {
    render(<ThemeHarness />);
    const workspace = screen.getByTestId("workspace");

    expect(workspace).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(workspace).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("gabv2_workspace_theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute("aria-pressed", "true");
  });

  it("restores the saved theme on mount", () => {
    window.localStorage.setItem("gabv2_workspace_theme", "dark");
    render(<ThemeHarness />);

    expect(screen.getByTestId("workspace")).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute("aria-pressed", "true");
  });
});
