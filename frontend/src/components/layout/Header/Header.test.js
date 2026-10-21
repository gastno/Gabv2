import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

const originalClerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = "pk_test_customer_sign_in";

jest.mock("./ClerkAuthForm", () => ({
  __esModule: true,
  default: (props) => require("react").createElement(
    "section",
    {
      "data-testid": props.authMode === "login" ? "clerk-sign-in" : "clerk-sign-up",
      "data-redirect-url": props.customerSignInUrl,
      className: `header-clerk-auth auth-form-slide-in-${props.authMode === "login" ? "left" : "right"}`,
    },
    props.authMode === "login" ? "Sign in to your account" : "Create your customer account"
  ),
}));

jest.mock("../../../services/api", () => ({
  authApi: {
    getMe: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) =>
    require("react").createElement("a", { href: to, ...props }, children),
}));

const Header = require("./Header").default;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/studios/gabbablu?service=12");
  jest.clearAllMocks();
});

afterAll(() => {
  if (originalClerkPublishableKey === undefined) {
    delete process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  } else {
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = originalClerkPublishableKey;
  }
});

test("links the text brand to home without showing the logo in the top bar", () => {
  render(<Header language="en" />);

  expect(screen.getByRole("link", { name: "gbb & co" })).toHaveAttribute("href", "/");
  expect(document.querySelector(".main-header .logo-space img")).not.toBeInTheDocument();
});

test("shows the Clerk sign-in modal and returns users to the page that opened it", async () => {
  render(<Header language="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));

  expect(await screen.findByText("Sign in to your account")).toBeInTheDocument();
  expect(await screen.findByTestId("clerk-sign-in")).toHaveAttribute(
    "data-redirect-url",
    "/customer/sign-in?returnTo=%2Fstudios%2Fgabbablu%3Fservice%3D12"
  );
});

test("shows the Clerk sign-up modal with a link back to sign in", async () => {
  render(<Header language="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
  fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

  expect(await screen.findByText("Create your customer account")).toBeInTheDocument();
  expect(await screen.findByTestId("clerk-sign-up")).toHaveAttribute(
    "data-redirect-url",
    "/customer/sign-in?returnTo=%2Fstudios%2Fgabbablu%3Fservice%3D12"
  );
});

test("switches between the Clerk sign-in and sign-up modals", async () => {
  render(<Header language="en" />);
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));

  fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
  expect(await screen.findByTestId("clerk-sign-up")).toBeInTheDocument();
  expect(document.querySelector(".header-clerk-auth")).toHaveClass("auth-form-slide-in-right");

  fireEvent.click(screen.getByRole("button", { name: "Log In" }));
  expect(await screen.findByTestId("clerk-sign-in")).toBeInTheDocument();
  expect(document.querySelector(".header-clerk-auth")).toHaveClass("auth-form-slide-in-left");
});
