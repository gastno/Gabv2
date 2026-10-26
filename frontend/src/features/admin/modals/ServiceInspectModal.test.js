import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ServiceInspectModal from "./ServiceInspectModal";

test("public booking is an accessible toggle while editing a service", () => {
  function ModalHarness() {
    const [inspectService, setInspectService] = React.useState({
      id: 10,
      brand: "Gabbablu",
      category: "Beauty",
      name: "Lash refill",
      duration: "60 min",
      price: "8,000 kr",
      is_active: true,
    });

    return (
      <ServiceInspectModal
        inspectService={inspectService}
        setInspectService={setInspectService}
        brandsList={[{ id: 1, name: "Gabbablu" }]}
        categories={[{ id: 2, title: "Beauty" }]}
        isEditMode
        setIsEditMode={jest.fn()}
        editServiceImagePreview={null}
        setEditServiceImagePreview={jest.fn()}
        setEditServiceImageFile={jest.fn()}
        closeInspectModal={jest.fn()}
        handleSaveServiceEdit={jest.fn()}
      />
    );
  }

  render(<ModalHarness />);

  const publicBookingToggle = screen.getByRole("checkbox", { name: "Public booking" });
  expect(publicBookingToggle).toBeChecked();

  fireEvent.click(publicBookingToggle);
  expect(publicBookingToggle).not.toBeChecked();
});
