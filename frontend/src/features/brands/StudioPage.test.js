import { fireEvent, render, screen } from "@testing-library/react";
import StudioPage, { PortfolioGallery } from "./StudioPage";

jest.mock("../../services/api", () => ({
  brandApi: { getAll: jest.fn() },
  brandPortfolioApi: { get: jest.fn() },
  categoryApi: { getAll: jest.fn() },
  getAssetUrl: (path) => path,
  serviceApi: { getAll: jest.fn() },
  staffServiceApi: { getByServiceId: jest.fn() },
}));

const images = [
  { id: "1", image_url: "/uploads/brands/one.webp" },
  { id: "2", image_url: "/uploads/brands/two.webp" },
];

describe("PortfolioGallery", () => {
  it("shows one image at a time and allows carousel navigation", () => {
    render(<PortfolioGallery images={images} layout="carousel" brandName="Gabbablu" />);

    expect(screen.getByAltText("Gabbablu portfolio 1")).toHaveAttribute(
      "src",
      "/uploads/brands/one.webp"
    );
    fireEvent.click(screen.getByRole("button", { name: "Next portfolio image" }));

    expect(screen.getByAltText("Gabbablu portfolio 2")).toHaveAttribute(
      "src",
      "/uploads/brands/two.webp"
    );
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("renders the featured layout in the saved image order", () => {
    render(<PortfolioGallery images={images} layout="feature" brandName="Amor Tattoo" />);

    expect(screen.getByAltText("Amor Tattoo portfolio 1")).toHaveAttribute(
      "src",
      "/uploads/brands/one.webp"
    );
    expect(screen.getByAltText("Amor Tattoo portfolio 2")).toHaveAttribute(
      "src",
      "/uploads/brands/two.webp"
    );
  });

  it("loads saved logo, cover, and portfolio images for the Amor Tattoo studio route", async () => {
    const { brandApi, brandPortfolioApi, categoryApi, serviceApi } = require("../../services/api");
    brandApi.getAll.mockResolvedValue([
      {
        id: 2,
        name: "Amor Tattoo",
        location: "Reykjavík, Iceland",
        logo_url: "/uploads/brands/amor-logo.webp",
        cover_image_url: "/uploads/brands/amor-cover.webp",
      },
    ]);
    brandPortfolioApi.get.mockResolvedValue({
      layout: "grid",
      images: [{ id: "4", image_url: "/uploads/brands/amor-portfolio.webp" }],
    });
    categoryApi.getAll.mockResolvedValue([]);
    serviceApi.getAll.mockResolvedValue([]);

    render(<StudioPage brandId={2} />);

    expect(await screen.findByAltText("Amor Tattoo studio")).toHaveAttribute(
      "src",
      "/uploads/brands/amor-cover.webp"
    );
    expect(screen.getByAltText("Amor Tattoo logo")).toHaveAttribute(
      "src",
      "/uploads/brands/amor-logo.webp"
    );
    expect(await screen.findByAltText("Amor Tattoo portfolio 1")).toHaveAttribute(
      "src",
      "/uploads/brands/amor-portfolio.webp"
    );
  });
});
