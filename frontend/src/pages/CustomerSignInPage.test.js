import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
import { authApi } from "../services/api";
import { LanguageProvider } from "../components/i18n/LanguageContext";

const originalClerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = "pk_test_customer_sign_in";
const CustomerSignInPage = require("./CustomerSignInPage").default;

jest.mock("@clerk/react", () => ({
  SignIn: jest.fn(({ signUpUrl, forceRedirectUrl }) =>
    require("react").createElement("div", {
      "data-testid": "clerk-sign-in",
      "data-sign-up-url": signUpUrl,
      "data-redirect-url": forceRedirectUrl,
    })
  ),
  SignUp: jest.fn(({ signInUrl, forceRedirectUrl }) =>
    require("react").createElement("div", {
      "data-testid": "clerk-sign-up",
      "data-sign-in-url": signInUrl,
      "data-redirect-url": forceRedirectUrl,
    })
  ),
  useAuth: jest.fn(),
  useClerk: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) =>
    require("react").createElement("a", { href: to, ...props }, children),
  useLocation: () => globalThis.__customerRouterLocation,
  useNavigate: () => globalThis.__customerRouterNavigate,
}));

jest.mock("../services/api", () => ({
  authApi: {
    customerClerkSession: jest.fn(),
    customerClerkCompleteProfile: jest.fn(),
    getMe: jest.fn(),
  },
  notificationApi: {
    list: () => Promise.resolve({ notifications: [], unread_count: 0 }),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

function renderSignIn(initialEntry = "/customer/sign-in") {
  const location = new URL(initialEntry, "http://localhost");
  window.__customerRouterLocation = {
    pathname: location.pathname,
    search: location.search,
    state: null,
  };
  window.__customerRouterNavigate = jest.fn();
  return render(
    <LanguageProvider>
      <CustomerSignInPage />
    </LanguageProvider>
  );
}

describe("customer Clerk sign-in", () => {
  const getToken = jest.fn();
  const signOut = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    getToken.mockResolvedValue("clerk-session-token");
    signOut.mockResolvedValue(undefined);
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, getToken });
    useClerk.mockReturnValue({ signOut });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalClerkPublishableKey === undefined) {
      delete process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
    } else {
      process.env.REACT_APP_CLERK_PUBLISHABLE_KEY = originalClerkPublishableKey;
    }
  });

  it("exchanges the Clerk session and stores only the returned Gabv2 app JWT", async () => {
    authApi.customerClerkSession.mockResolvedValue({
      status: "authenticated",
      token: "gabv2-customer-jwt",
      customer: { id: 8, full_name: "Taylor Customer", email: "taylor@example.com" },
    });

    renderSignIn("/customer/sign-in?returnTo=%2Fstudios%2Fgabbablu");

    await waitFor(() => expect(authApi.customerClerkSession).toHaveBeenCalledWith("clerk-session-token"));
    expect(await screen.findByText("Welcome, Taylor Customer!")).toBeInTheDocument();
    expect(localStorage.getItem("customer_auth_token")).toBe("gabv2-customer-jwt");
    expect(localStorage.getItem("customer_auth_token")).not.toBe("clerk-session-token");
    expect(globalThis.__customerRouterNavigate).toHaveBeenCalledWith(
      "/studios/gabbablu",
      { replace: true }
    );
  });

  it("shows profile completion only when the backend requests it, then sends the required profile fields", async () => {
    authApi.customerClerkSession.mockResolvedValue({
      status: "profile_required",
      profile: { full_name: "Taylor Customer", email: "taylor@example.com" },
    });
    authApi.customerClerkCompleteProfile.mockResolvedValue({
      status: "authenticated",
      token: "completed-customer-jwt",
      customer: { id: 9, full_name: "Taylor Customer", email: "taylor@example.com" },
    });

    renderSignIn();

    expect(await screen.findByDisplayValue("Taylor Customer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("taylor@example.com")).toHaveAttribute("readonly");
    expect(localStorage.getItem("customer_auth_token")).toBeNull();

    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+354 555 0100" } });
    fireEvent.change(screen.getByLabelText("Kennitala"), { target: { value: "010190-1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Complete profile" }));

    await waitFor(() => expect(authApi.customerClerkCompleteProfile).toHaveBeenCalledWith(
      "clerk-session-token",
      {
        full_name: "Taylor Customer",
        phone_number: "+354 555 0100",
        kennitala: "010190-1234",
      }
    ));
    expect(await screen.findByText("Welcome, Taylor Customer!")).toBeInTheDocument();
    expect(localStorage.getItem("customer_auth_token")).toBe("completed-customer-jwt");
  });

  it("displays backend conflicts without creating an app session", async () => {
    const conflict = Object.assign(new Error("This email is linked to another account."), { status: 409 });
    authApi.customerClerkSession.mockRejectedValue(conflict);

    renderSignIn();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This email is linked to another account."
    );
    expect(localStorage.getItem("customer_auth_token")).toBeNull();
  });

  it("lets an authenticated Clerk user retry a failed backend session exchange", async () => {
    authApi.customerClerkSession
      .mockRejectedValueOnce(new Error("Network unavailable."))
      .mockResolvedValueOnce({
        status: "authenticated",
        token: "retried-customer-jwt",
        customer: { id: 10, full_name: "Taylor Customer", email: "taylor@example.com" },
      });

    renderSignIn();
    expect(await screen.findByRole("alert")).toHaveTextContent("Network unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Retry customer sign-in" }));

    expect(await screen.findByText("Welcome, Taylor Customer!")).toBeInTheDocument();
    expect(authApi.customerClerkSession).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("customer_auth_token")).toBe("retried-customer-jwt");
  });

  it("renders Clerk sign-in with a sign-up link and preserves the requested destination", () => {
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false, getToken });

    renderSignIn("/customer/sign-in?returnTo=%2Fstudios%2Fgabbablu");

    expect(SignIn.mock.calls[0][0]).toEqual(expect.objectContaining({
      routing: "hash",
      signUpUrl: "/customer/sign-up?returnTo=%2Fstudios%2Fgabbablu",
      forceRedirectUrl: "/customer/sign-in?returnTo=%2Fstudios%2Fgabbablu",
    }));
  });

  it("renders Clerk sign-up and links back to sign-in", () => {
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false, getToken });

    renderSignIn("/customer/sign-up?returnTo=%2Fstudios%2Famortattoo");

    expect(SignUp.mock.calls[0][0]).toEqual(expect.objectContaining({
      routing: "hash",
      signInUrl: "/customer/sign-in?returnTo=%2Fstudios%2Famortattoo",
      forceRedirectUrl: "/customer/sign-in?returnTo=%2Fstudios%2Famortattoo",
    }));
  });

  it("shows Clerk's sign-in buttons for a provider request instead of waiting on a redirect", () => {
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false, getToken });
    renderSignIn("/customer/sign-in?provider=google&returnTo=%2Fstudios%2Fgabbablu");

    expect(SignIn).toHaveBeenCalled();
    expect(screen.queryByText("Connecting securely…")).not.toBeInTheDocument();
    expect(SignIn.mock.calls[0][0]).toEqual(expect.objectContaining({
      forceRedirectUrl: "/customer/sign-in?returnTo=%2Fstudios%2Fgabbablu",
    }));
  });

  it("shows Clerk's sign-up buttons for a provider request instead of waiting on a redirect", () => {
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false, getToken });
    renderSignIn("/customer/sign-up?provider=apple");

    expect(SignUp).toHaveBeenCalled();
    expect(screen.queryByText("Connecting securely…")).not.toBeInTheDocument();
  });

  it("signs out of Clerk when profile completion is cancelled", async () => {
    authApi.customerClerkSession.mockResolvedValue({
      status: "profile_required",
      profile: { full_name: "Taylor Customer", email: "taylor@example.com" },
    });
    renderSignIn();

    fireEvent.click(await screen.findByRole("button", { name: "Cancel and sign out" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem("customer_auth_token")).toBeNull();
  });

  it("keeps profile completion open and reports sign-out errors instead of implying cancellation", async () => {
    authApi.customerClerkSession.mockResolvedValue({
      status: "profile_required",
      profile: { full_name: "Taylor Customer", email: "taylor@example.com" },
    });
    signOut.mockRejectedValue(new Error("Could not sign out."));
    renderSignIn();

    fireEvent.click(await screen.findByRole("button", { name: "Cancel and sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign out.");
    expect(screen.getByRole("button", { name: "Complete profile" })).toBeInTheDocument();
    expect(localStorage.getItem("customer_auth_token")).toBeNull();
  });
});
