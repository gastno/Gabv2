import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminDashboard from "./Admin";
import { brandApi, categoryApi, serviceApi, staffApi, staffServiceApi } from "../../services/api";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("../../services/api", () => ({
  brandApi: { getAll: jest.fn() },
  categoryApi: { getAll: jest.fn() },
  serviceApi: { getAll: jest.fn() },
  staffApi: { getAll: jest.fn() },
  staffServiceApi: {
    getByServiceId: jest.fn(),
    syncServiceWorkers: jest.fn(),
  },
  getAssetUrl: (path) => path,
}));

jest.mock("./layout/AdminSidebar", () => {
  const React = require("react");
  return function MockAdminSidebar({ handleTabSelect }) {
    return React.createElement(
      "button",
      { onClick: () => handleTabSelect("staff_services") },
      "Staff Services"
    );
  };
});

jest.mock("./layout/AdminTopBar", () => () => null);

describe("AdminDashboard staff service modal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    brandApi.getAll.mockResolvedValue([{ id: 1, name: "Gabbablu" }]);
    categoryApi.getAll.mockResolvedValue([
      { id: 1, brand_id: 1, brand: "Gabbablu", title: "Beauty" },
    ]);
    serviceApi.getAll.mockResolvedValue([
      { id: 10, brand_id: 1, category_id: 1, brand: "Gabbablu", category: "Beauty", name: "Service" },
    ]);
    staffApi.getAll.mockResolvedValue([
      {
        id: 2,
        username: "worker",
        full_name: "Worker",
        assigned_brands: [{ name: "Gabbablu" }],
      },
    ]);
    staffServiceApi.getByServiceId.mockResolvedValue([]);
    staffServiceApi.syncServiceWorkers.mockResolvedValue({});
  });

  it("keeps the worker list modal open after saving assignments", async () => {
    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Staff Services" }));
    fireEvent.click(await screen.findByText("Service"));
    fireEvent.click(await screen.findByRole("button", { name: "Edit Worker List" }));
    fireEvent.click(screen.getByText("Worker"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(staffServiceApi.syncServiceWorkers).toHaveBeenCalledWith(10, [2]);
    });
    expect(screen.getByText("Assigned Workers for Service")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Edit Worker List" })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText("Worker")).toBeInTheDocument();
  });

  it("enters edit mode without saving when Edit Worker List is clicked", async () => {
    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Staff Services" }));
    fireEvent.click(await screen.findByText("Service"));
    fireEvent.click(await screen.findByRole("button", { name: "Edit Worker List" }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(staffServiceApi.syncServiceWorkers).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("keeps edits active when saving assignments fails", async () => {
    const alert = jest.spyOn(window, "alert").mockImplementation(() => {});
    staffServiceApi.syncServiceWorkers.mockRejectedValue(new Error("Could not save"));
    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Staff Services" }));
    fireEvent.click(await screen.findByText("Service"));
    fireEvent.click(await screen.findByRole("button", { name: "Edit Worker List" }));
    fireEvent.click(screen.getByText("Worker"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("Could not save");
    });
    expect(screen.getByText("Assigned Workers for Service")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });
});
