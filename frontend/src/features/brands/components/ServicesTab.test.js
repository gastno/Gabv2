import { fireEvent, render, screen } from "@testing-library/react";
import ServicesTab from "./ServicesTab";

jest.mock("../../../components/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (key) => key }),
}));

test("service categories expand accessibly and open the selected booking flow", () => {
  const onSelectService = jest.fn();
  const service = {
    id: 11,
    name: "Lash refill",
    description: "A maintenance appointment",
    duration: "60 min",
    price: "8,000 kr",
  };

  render(
    <ServicesTab
      categories={[
        {
          id: 4,
          title: "Lash services",
          subtitle: "Extensions and refills",
          services: [service],
        },
      ]}
      isLoading={false}
      error=""
      onSelectService={onSelectService}
    />
  );

  const categoryToggle = screen.getByRole("button", { name: /Lash services/ });
  const categoryContent = document.getElementById("studio-category-4");

  expect(categoryToggle).toHaveAttribute("aria-expanded", "true");
  expect(categoryToggle).toHaveAttribute("aria-controls", "studio-category-4");
  expect(categoryContent).not.toHaveAttribute("inert");

  fireEvent.click(categoryToggle);

  expect(categoryToggle).toHaveAttribute("aria-expanded", "false");
  expect(categoryContent).toHaveAttribute("inert");

  fireEvent.click(categoryToggle);

  expect(categoryToggle).toHaveAttribute("aria-expanded", "true");
  expect(categoryContent).not.toHaveAttribute("inert");

  fireEvent.click(screen.getByRole("button", { name: /Lash refill/ }));
  expect(onSelectService).toHaveBeenCalledWith(service);
});

test("sale pricing is emphasized above the regular price", () => {
  render(
    <ServicesTab
      categories={[{
        id: 4,
        title: "Lash services",
        subtitle: "Extensions and refills",
        services: [{
          id: 12,
          name: "Lash refill",
          duration: "60 min",
          price: "9,000 kr",
          regularPrice: "9,000 kr",
          salePrice: "7,000 kr",
        }],
      }]}
      isLoading={false}
      error=""
      onSelectService={jest.fn()}
    />
  );

  const salePrice = screen.getByText("7,000 kr").closest(".service-sale-price-bubble");
  const regularPrice = screen.getByText("9,000 kr");

  expect(salePrice).toBeInTheDocument();
  expect(salePrice.compareDocumentPosition(regularPrice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(regularPrice.tagName).toBe("DEL");
});
