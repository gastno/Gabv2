import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

test("renders the studio social links and legal pages", () => {
  render(<Footer />);

  expect(screen.getByRole("heading", { name: "Find Us" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Instagram · Gabbablu" })).toHaveAttribute(
    "href",
    "https://www.instagram.com/gabbablu/"
  );
  expect(screen.getByRole("link", { name: "Facebook · Gabbablu" })).toHaveAttribute(
    "href",
    "https://www.facebook.com/gabbablu"
  );
  expect(screen.getByRole("link", { name: "Instagram · Amor Tattoo" })).toHaveAttribute(
    "href",
    "https://www.instagram.com/amorttt.is/"
  );
  expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
    "href",
    "/privacy-policy"
  );
  expect(screen.getByRole("link", { name: "Cookie settings" })).toHaveAttribute(
    "href",
    "/cookie-settings"
  );
  expect(screen.getByRole("link", { name: "Staff" })).toHaveAttribute(
    "href",
    "/staff-login"
  );
});
