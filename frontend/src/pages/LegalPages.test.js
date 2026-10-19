import { render, screen } from "@testing-library/react";
import CookieSettingsPage from "./CookieSettingsPage";
import PrivacyPolicyPage from "./PrivacyPolicyPage";

jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    Link: ({ to, children, ...props }) =>
      React.createElement("a", { href: to, ...props }, children),
  };
});

test("explains the cancellation policy and tattoo safety in the privacy policy", () => {
  render(<PrivacyPolicyPage />);

  expect(screen.getByRole("heading", { name: "Privacy policy" })).toBeInTheDocument();
  expect(screen.getByText(/fewer than 48 hours/)).toBeInTheDocument();
  expect(screen.getAllByText(/5,000 ISK fee/).length).toBeGreaterThan(0);
  expect(screen.getByText(/cancellation-policy acceptance associated/)).toBeInTheDocument();
  expect(screen.getByText(/Tattoos are permanent body modifications/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Persónuvernd" })).toHaveAttribute(
    "href",
    "https://www.personuvernd.is/"
  );
});

test("describes essential browser storage and links to the privacy policy", () => {
  render(<CookieSettingsPage />);

  expect(screen.getByRole("heading", { name: "Cookie settings" })).toBeInTheDocument();
  expect(screen.getByText("Always active")).toBeInTheDocument();
  expect(screen.getAllByText(/local storage/).length).toBeGreaterThan(0);
  expect(
    screen
      .getAllByRole("link", { name: "Privacy policy" })
      .some((link) => link.getAttribute("href") === "/privacy-policy")
  ).toBe(true);
});
