import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PortfolioWorkspace from "./PortfolioWorkspace";
import { brandApi, brandPortfolioApi } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  brandApi: { getManageable: jest.fn() },
  brandPortfolioApi: { get: jest.fn(), uploadLogo: jest.fn() },
  getAssetUrl: (path) => path,
}));

describe("PortfolioWorkspace", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    brandPortfolioApi.get.mockResolvedValue({
      layout: "grid",
      available_layouts: [{ id: "grid", name: "Classic grid" }],
      images: [],
    });
  });

  it("shows loading, surfaces errors, and retries", async () => {
    brandApi.getManageable
      .mockRejectedValueOnce(new Error("Access denied"))
      .mockResolvedValueOnce([{ id: 1, name: "Gabbablu" }]);
    render(<PortfolioWorkspace />);
    expect(screen.getByText("Loading studios...")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
    expect(screen.queryByText("No studios are available to edit.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("option", { name: "Gabbablu" })).toBeInTheDocument();
  });

  it("shows empty and malformed responses distinctly", async () => {
    brandApi.getManageable.mockResolvedValueOnce([]);
    const { unmount } = render(<PortfolioWorkspace />);
    expect(await screen.findByText("No studios are available to edit.")).toBeInTheDocument();
    unmount();
    brandApi.getManageable.mockResolvedValueOnce({});
    render(<PortfolioWorkspace />);
    expect(await screen.findByRole("alert")).toHaveTextContent("The studios response was incomplete.");
  });

  it("updates the logo preview after an upload", async () => {
    brandApi.getManageable.mockResolvedValue([{ id: 1, name: "Gabbablu", slug: "gabbablu" }]);
    brandPortfolioApi.uploadLogo.mockResolvedValue({ brand: { logo_url: "/uploads/brands/logo.webp" } });
    const onBrandUpdate = jest.fn();
    render(<PortfolioWorkspace onBrandUpdate={onBrandUpdate} />);
    await screen.findByRole("button", { name: "Classic grid" });
    const image = new File(["image"], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getAllByLabelText("Change image")[0], { target: { files: [image] } });
    await waitFor(() => expect(screen.getByAltText("Studio logo preview")).toHaveAttribute("src", "/uploads/brands/logo.webp"));
    expect(onBrandUpdate).toHaveBeenCalledWith("1", { logo_url: "/uploads/brands/logo.webp" });
  });
});
