import { fireEvent, render, screen } from "@testing-library/react";
import Home from "./Home";
import { LanguageProvider } from "../../components/i18n/LanguageContext";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) =>
    require("react").createElement("a", { href: to, ...props }, children),
}));

test("the header language selector changes page copy and persists the selected language", () => {
  localStorage.clear();
  render(
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );

  expect(screen.getByText("Beauty and tattoo studios rooted in Reykjavík.")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Select language" }), {
    target: { value: "is" },
  });

  expect(screen.getByText("Snyrti- og húðflúrstofur með rætur í Reykjavík.")).toBeInTheDocument();
  expect(localStorage.getItem("site_language")).toBe("is");
  expect(document.documentElement).toHaveAttribute("lang", "is");
});
