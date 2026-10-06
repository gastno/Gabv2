import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import CreateServiceModal from "./CreateServiceModal";

describe("CreateServiceModal", () => {
  const brandsList = [
    { id: 1, name: "Gabbablu" },
    { id: 2, name: "Amor Tattoo" },
  ];
  const categories = [
    { id: 10, brand_id: 1, brand: "Gabbablu", title: "Popular" },
    { id: 11, brand_id: 1, brand: "Gabbablu", title: "Lashes" },
    { id: 20, brand_id: 2, brand: "Amor Tattoo", title: "Popular" },
  ];

  function renderModal(categoryList = categories) {
    function ModalHarness() {
      const [newService, setNewService] = React.useState({
        brand: "Gabbablu",
        category: "Popular",
      });
      return (
        <CreateServiceModal
          newService={newService}
          setNewService={setNewService}
          brandsList={brandsList}
          categories={categoryList}
          createServiceImagePreview={null}
          setCreateServiceImagePreview={jest.fn()}
          setCreateServiceImageFile={jest.fn()}
          setServiceModalOpen={jest.fn()}
          handleAddService={jest.fn()}
        />
      );
    }
    return render(<ModalHarness />);
  }

  it("shows and updates categories for the selected brand", () => {
    renderModal();
    const categorySelect = screen.getByRole("combobox", { name: "Category" });

    expect(within(categorySelect).getAllByRole("option").map((option) => option.value))
      .toEqual(["Popular", "Lashes"]);

    fireEvent.change(screen.getByRole("combobox", { name: "Target Brand" }), {
      target: { value: "Amor Tattoo" },
    });

    expect(screen.getByRole("combobox", { name: "Target Brand" })).toHaveValue("Amor Tattoo");
    expect(within(categorySelect).getAllByRole("option").map((option) => option.value))
      .toEqual(["Popular"]);
  });

  it("disables service creation when the selected brand has no categories", () => {
    renderModal(categories.filter((category) => category.brand_id === 2));

    expect(screen.getByRole("combobox", { name: "Category" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create Service" })).toBeDisabled();
  });
});
