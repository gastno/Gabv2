import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PortfolioTab from "./PortfolioTab";
import { brandPortfolioApi } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  brandPortfolioApi: {
    get: jest.fn(),
    uploadLogo: jest.fn(),
    uploadCover: jest.fn(),
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
    save: jest.fn(),
  },
  getAssetUrl: (path) => path,
}));

const brand = { id: 1, name: "Gabbablu", slug: "gabbablu" };
const initialPortfolio = {
  brand_id: 1,
  layout: "grid",
  available_layouts: [
    { id: "grid", name: "Classic grid" },
    { id: "mosaic", name: "Mixed-size grid" },
  ],
  images: [
    { id: "10", image_url: "/uploads/brands/one.webp", display_order: 0 },
    { id: "11", image_url: "/uploads/brands/two.webp", display_order: 1 },
  ],
};

describe("PortfolioTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    brandPortfolioApi.get.mockResolvedValue(initialPortfolio);
    brandPortfolioApi.save.mockImplementation((brandId, changes) => Promise.resolve({
      ...initialPortfolio,
      layout: changes.layout,
      images: changes.imageIds.map((id, display_order) => ({
        ...initialPortfolio.images.find((image) => String(image.id) === String(id)),
        display_order,
      })),
    }));
  });

  it("saves a selected layout and the updated image order", async () => {
    render(<PortfolioTab brands={[brand]} />);

    await screen.findByAltText("Gabbablu portfolio 1");
    expect(screen.queryByLabelText("Layout")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Classic grid" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Mixed-size grid" }));
    fireEvent.click(screen.getByRole("button", { name: "Move image 2 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Save gallery" }));

    await waitFor(() => {
      expect(brandPortfolioApi.save).toHaveBeenCalledWith("1", {
        layout: "mosaic",
        imageIds: ["11", "10"],
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Gallery layout and image order saved.");
  });

  it("fades in the editor when switching to another studio", async () => {
    const secondBrand = { id: 2, name: "Amor Tattoo", slug: "amor-tattoo" };
    render(<PortfolioTab brands={[brand, secondBrand]} />);

    await screen.findByAltText("Gabbablu portfolio 1");
    fireEvent.change(screen.getByLabelText("Studio"), { target: { value: "2" } });

    await waitFor(() => {
      expect(brandPortfolioApi.get).toHaveBeenLastCalledWith("2");
    });
    expect(await screen.findByAltText("Amor Tattoo portfolio 1")).toBeInTheDocument();
    expect(document.querySelector(".portfolio-studio-content")).toHaveClass("portfolio-studio-content");
    expect(screen.queryByLabelText("Layout")).not.toBeInTheDocument();
  });

  it("uploads a portfolio image and shows it in the editor", async () => {
    brandPortfolioApi.uploadImage.mockResolvedValue({
      image: { id: "12", image_url: "/uploads/brands/three.webp", display_order: 2 },
    });
    render(<PortfolioTab brands={[brand]} />);

    await screen.findByAltText("Gabbablu portfolio 1");
    const file = new File(["image"], "portfolio.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Add image"), { target: { files: [file] } });

    await waitFor(() => {
      expect(brandPortfolioApi.uploadImage).toHaveBeenCalledWith("1", file);
    });
    expect(await screen.findByAltText("Gabbablu portfolio 3")).toHaveAttribute(
      "src",
      "/uploads/brands/three.webp"
    );
  });
});
