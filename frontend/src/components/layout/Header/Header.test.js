import { render, screen } from "@testing-library/react";
import Header from "./Header";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) =>
    require("react").createElement("a", { href: to, ...props }, children),
}));

test("links the text brand to home without showing the logo in the top bar", () => {
  localStorage.clear();

  render(<Header language="en" />);

  expect(screen.getByRole("link", { name: "gbb & co" })).toHaveAttribute("href", "/");
  expect(document.querySelector(".main-header .logo-space img")).not.toBeInTheDocument();
});
