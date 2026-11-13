import { render, screen } from "@testing-library/react";
import ParallaxStars from "./ParallaxStars";
import Home from "./Home";
import { LanguageProvider } from "../../components/i18n/LanguageContext";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) =>
    require("react").createElement("a", { href: to, ...props }, children),
}));

test("renders stable decorative layers at different speeds", () => {
  const { container, rerender } = render(<ParallaxStars speed={2} />);
  const background = container.firstChild;
  const layers = background.children;
  const shadows = Array.from(layers, (layer) => layer.style.boxShadow);

  expect(background).toHaveAttribute("aria-hidden", "true");
  expect(layers).toHaveLength(3);
  expect(Array.from(layers, (layer) => layer.style.animationDuration)).toEqual([
    "25s", "50s", "75s",
  ]);
  expect(shadows.map((shadow) => shadow.split(", ").length)).toEqual([700, 200, 100]);
  expect(shadows.every((shadow) => shadow.split(", ").every((star) =>
    /^\d+\.\d+vw \d+\.\d+vh #f2f3ee$/.test(star)
  ))).toBe(true);

  rerender(<ParallaxStars speed={1} />);
  expect(Array.from(layers, (layer) => layer.style.boxShadow)).toEqual(shadows);
});

test("places the decorative background behind the entire home layout without affecting navigation", () => {
  const { container } = render(
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );

  const background = container.querySelector(".parallax-stars");
  expect(background.parentElement).toHaveClass("home-page");
  expect(background).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByRole("heading", { name: "gbb & co" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Choose a studio" })).toHaveAttribute("href", "#studio-choices");
  expect(screen.getByRole("link", { name: "Gabbablu" })).toHaveAttribute("href", "/studios/gabbablu");
  expect(screen.getByRole("link", { name: "Amor Tattoo" })).toHaveAttribute("href", "/studios/amortattoo");
});
