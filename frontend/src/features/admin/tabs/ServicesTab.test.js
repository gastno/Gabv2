import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ServicesTab from "./ServicesTab";

describe("ServicesTab", () => {
  const props = {
    brands: [
      { id: 1, name: "Gabbablu" },
      { id: 2, name: "Amor Tattoo" },
    ],
    services: [
      { id: 10, brand_id: 1, brand: "Gabbablu", name: "Popular Service", category: "Beauty" },
      { id: 20, brand_id: 2, brand: "Amor Tattoo", name: "Popular Service", category: "Tattoo" },
    ],
    loadingServices: false,
    setInspectService: jest.fn(),
    setIsEditMode: jest.fn(),
    setServiceModalOpen: jest.fn(),
  };

  it("shows services for all brands and filters by the selected brand", () => {
    render(<ServicesTab {...props} />);

    expect(screen.getAllByText("Popular Service")).toHaveLength(2);

    fireEvent.change(screen.getByRole("combobox", { name: "Filter services by brand" }), {
      target: { value: "2" },
    });

    expect(screen.getAllByText("Popular Service")).toHaveLength(1);
    expect(screen.getByText("Tattoo")).toBeInTheDocument();
    expect(screen.queryByText("Beauty")).not.toBeInTheDocument();
  });
});
