import React from "react";
import { render, waitFor } from "@testing-library/react";
import CustomerClerkSignOutBridge from "./CustomerClerkSignOutBridge";
import { requestClerkSignOut } from "../../services/customerSession";
import { useAuth, useClerk } from "@clerk/react";

jest.mock("@clerk/react", () => ({
  useAuth: jest.fn(),
  useClerk: jest.fn(),
}));

describe("customer Clerk sign-out bridge", () => {
  const signOut = jest.fn();

  beforeEach(() => {
    signOut.mockResolvedValue(undefined);
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    useClerk.mockReturnValue({ signOut });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("waits for Clerk sign-out to complete", async () => {
    render(<CustomerClerkSignOutBridge />);

    const result = requestClerkSignOut();
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await expect(result).resolves.toBeUndefined();
  });

  it("rejects when Clerk sign-out is not mounted", async () => {
    await expect(requestClerkSignOut()).rejects.toThrow("Customer sign-out is not available.");
  });

  it("preserves email/password logout when there is no Clerk session", async () => {
    useAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    render(<CustomerClerkSignOutBridge />);

    await expect(requestClerkSignOut()).resolves.toBeUndefined();
    expect(signOut).not.toHaveBeenCalled();
  });
});
