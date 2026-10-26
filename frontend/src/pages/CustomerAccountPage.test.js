import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerAccountPage from "./CustomerAccountPage";
import { apptApi, notificationApi } from "../services/api";

jest.mock("../services/api", () => ({
  apptApi: { listCustomerAppointments: jest.fn() },
  notificationApi: {
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    list: jest.fn(),
  },
}));

jest.mock("../components/layout/CustomerLayout/CustomerLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

beforeEach(() => {
  localStorage.setItem("customer_auth_token", "registered-customer-token");
  apptApi.listCustomerAppointments.mockResolvedValue({
    appointments: [{
      id: 4,
      service_name: "Lash lift",
      brand_name: "Gabbablu",
      start_time: "2026-11-01T12:00:00Z",
      status: "confirmed",
      price_snapshot_isk: "9000",
    }],
  });
  notificationApi.getPreferences.mockResolvedValue({ preferences: { email_enabled: false } });
  notificationApi.list.mockResolvedValue({ notifications: [{
    id: 8,
    notification_type: "reminder_24h",
    delivery_status: "sent",
    service_name: "Lash lift",
    start_time: "2026-11-01T12:00:00Z",
    is_read: false,
  }] });
  notificationApi.updatePreferences.mockResolvedValue({ preferences: { email_enabled: true } });
});

afterEach(() => localStorage.clear());

const renderPage = () => render(<CustomerAccountPage />);

test("shows customer appointment price snapshots, notification history, and saved email preferences", async () => {
  renderPage();

  expect(apptApi.listCustomerAppointments).toHaveBeenCalledWith({ period: "upcoming" });
  expect(await screen.findByText("Lash lift")).toBeInTheDocument();
  expect(screen.getByText(/9[.,]000\s+kr/)).toBeInTheDocument();
  expect(screen.getByText("Appointment reminder")).toBeInTheDocument();
  expect(screen.getByText("sent")).toBeInTheDocument();
  expect(screen.getByText("Unread")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("checkbox", { name: /receive appointment emails/i }));
  fireEvent.click(screen.getByRole("button", { name: "Save preference" }));

  await waitFor(() => expect(notificationApi.updatePreferences).toHaveBeenCalledWith({
    email_enabled: true,
  }));
  expect(await screen.findByText("Your email preference has been saved.")).toBeInTheDocument();
});

test("requires customer sign-in before showing personal history", async () => {
  localStorage.removeItem("customer_auth_token");
  renderPage();
  expect(screen.getByRole("heading", { name: "Sign in to view your account" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/customer/sign-in?returnTo=%2Fcustomer%2Faccount"
  );
  expect(apptApi.listCustomerAppointments).not.toHaveBeenCalled();
});

test("shows API failures instead of reporting a false save or load success", async () => {
  apptApi.listCustomerAppointments.mockRejectedValueOnce(new Error("Account unavailable."));
  renderPage();
  expect(await screen.findByRole("alert")).toHaveTextContent("Account unavailable.");
  expect(screen.queryByText("Your email preference has been saved.")).not.toBeInTheDocument();
});

test("previous appointments page requests only past visits and links back to the account", async () => {
  apptApi.listCustomerAppointments.mockResolvedValueOnce({ appointments: [] });
  render(<CustomerAccountPage previousOnly />);

  expect(await screen.findByRole("heading", { name: "Previous appointments" })).toBeInTheDocument();
  expect(apptApi.listCustomerAppointments).toHaveBeenCalledWith({ period: "previous" });
  expect(await screen.findByRole("link", { name: "Back to your account" })).toHaveAttribute(
    "href",
    "/customer/account"
  );
  expect(notificationApi.getPreferences).not.toHaveBeenCalled();
  expect(notificationApi.list).not.toHaveBeenCalled();
});
