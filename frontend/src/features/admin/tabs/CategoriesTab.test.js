import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CategoriesTab from "./CategoriesTab";

describe("CategoriesTab", () => {
  const props = {
    brands: [
      { id: 1, name: "Gabbablu" },
      { id: 2, name: "Amor Tattoo" },
    ],
    categories: [
      { id: 10, brand_id: 1, brand: "Gabbablu", title: "Popular", subtitle: "Beauty" },
      { id: 20, brand_id: 2, brand: "Amor Tattoo", title: "Popular", subtitle: "Tattoo" },
    ],
    services: [
      { id: 100, category_id: 10, category: "Popular", brand_id: 1 },
      { id: 200, category_id: 20, category: "Popular", brand_id: 2 },
    ],
    loadingCategories: false,
    setCategoryModalOpen: jest.fn(),
    setInspectCategory: jest.fn(),
    setIsEditMode: jest.fn(),
  };

  it("shows categories for all brands and filters by the selected brand", () => {
    render(<CategoriesTab {...props} />);

    expect(screen.getAllByText("Popular")).toHaveLength(2);
    expect(screen.getAllByText("1 Services Assigned")).toHaveLength(2);

    fireEvent.change(screen.getByRole("combobox", { name: "Filter categories by brand" }), {
      target: { value: "2" },
    });

    expect(screen.getAllByText("Popular")).toHaveLength(1);
    expect(screen.getByText("Tattoo")).toBeInTheDocument();
    expect(screen.queryByText("Beauty")).not.toBeInTheDocument();
  });
});
