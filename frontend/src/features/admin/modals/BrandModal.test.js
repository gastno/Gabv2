import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import BrandModal from "./BrandModal";

function BrandModalHarness() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [brand, setBrand] = useState({
    id: 1,
    name: "Gabbablu",
    slug: "gabbablu",
    location: "Studio",
    about_description: "A beauty studio",
    description_en: "A beauty studio",
    description_is: "Fegurðarstofa",
  });

  return (
    <BrandModal
      tempInspectBrand={brand}
      setTempInspectBrand={setBrand}
      isEditMode={isEditMode}
      setIsEditMode={setIsEditMode}
      closeInspectModal={() => {}}
      handleSaveBrandEdit={(event) => event.preventDefault()}
      handleDiscardBrandChanges={() => setIsEditMode(false)}
    />
  );
}

describe("BrandModal", () => {
  it("keeps the shared modal width when entering edit mode", () => {
    render(<BrandModalHarness />);
    const modal = screen.getByRole("heading", { name: "Brand Details" }).parentElement;
    const initialModalClasses = modal.className;

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(modal.className).toBe(initialModalClasses);
    expect(modal).toHaveClass("admin-modal-box");
    expect(screen.getByDisplayValue("Gabbablu").closest("form"))
      .toHaveClass("full-width-modal-form");
  });

  it("shows English and Icelandic descriptions for viewing and editing", () => {
    render(<BrandModalHarness />);

    expect(screen.getByText("A beauty studio")).toBeInTheDocument();
    expect(screen.getByText("Fegurðarstofa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText("Description (English)")).toHaveValue("A beauty studio");
    expect(screen.getByLabelText("Description (Icelandic)")).toHaveValue("Fegurðarstofa");

    fireEvent.change(screen.getByLabelText("Description (English)"), {
      target: { value: "Updated English" },
    });
    fireEvent.change(screen.getByLabelText("Description (Icelandic)"), {
      target: { value: "Uppfærð íslenska" },
    });
    expect(screen.getByLabelText("Description (English)")).toHaveValue("Updated English");
    expect(screen.getByLabelText("Description (Icelandic)")).toHaveValue("Uppfærð íslenska");
  });
});
