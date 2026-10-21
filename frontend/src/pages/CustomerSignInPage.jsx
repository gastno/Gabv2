import React, { useCallback, useEffect, useRef, useState } from "react";
import { SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CustomerLayout from "../components/layout/CustomerLayout/CustomerLayout";
import { useLanguage } from "../components/i18n/LanguageContext";
import customerClerkAppearance from "../components/auth/customerClerkAppearance";
import { authApi } from "../services/api";
import { clearCustomerSession, saveCustomerSession } from "../services/customerSession";
import "./CustomerSignInPage.css";

const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function getDestination(location) {
  const requested = location.state?.from
    || new URLSearchParams(location.search).get("returnTo");
  return typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/";
}

function CustomerSignInPage() {
  return clerkPublishableKey
    ? <ClerkCustomerSignIn />
    : <ClerkConfigurationRequired />;
}

function ClerkConfigurationRequired() {
  const { t } = useLanguage();
  return (
    <CustomerLayout pageClassName="customer-sign-in-page">
      <main className="customer-sign-in-shell">
        <section className="customer-sign-in-card" aria-labelledby="customer-sign-in-title">
          <p className="customer-sign-in-eyebrow">{t("customerSignIn.eyebrow")}</p>
          <h1 id="customer-sign-in-title">{t("customerSignIn.title")}</h1>
          <p role="alert" className="customer-sign-in-error">
            {t("customerSignIn.notConfigured")}
          </p>
          <Link className="customer-sign-in-back" to="/">
            {t("customerSignIn.back")}
          </Link>
        </section>
      </main>
    </CustomerLayout>
  );
}

function ClerkCustomerSignIn() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const destination = getDestination(location);
  const isSignUp = location.pathname === "/customer/sign-up";
  const authSearch = destination !== "/"
    ? `?returnTo=${encodeURIComponent(destination)}`
    : "";
  const customerSignInUrl = `/customer/sign-in${authSearch}`;
  const customerSignUpUrl = `/customer/sign-up${authSearch}`;
  const forceRedirectUrl = customerSignInUrl;
  const [profile, setProfile] = useState({ full_name: "", email: "", phone_number: "", kennitala: "" });
  const [needsProfile, setNeedsProfile] = useState(false);
  const [busy, setBusy] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const sessionInFlight = useRef(false);
  const sessionAttempted = useRef(false);

  const finishCustomerSignIn = useCallback((response) => {
    if (response?.status !== "authenticated") {
      throw new Error(t("customerSignIn.unexpectedResponse"));
    }
    saveCustomerSession(response.token, response.customer);
    navigate(destination, { replace: true });
  }, [destination, navigate, t]);

  const exchangeClerkSession = useCallback(async () => {
    if (sessionInFlight.current || sessionAttempted.current || !isSignedIn) return;
    sessionInFlight.current = true;
    sessionAttempted.current = true;
    setBusy("session");
    setErrorMessage("");

    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error(t("customerSignIn.missingClerkToken"));
      const response = await authApi.customerClerkSession(clerkToken);
      if (response?.status === "profile_required") {
        setProfile((current) => ({
          ...current,
          full_name: response.profile?.full_name || "",
          email: response.profile?.email || "",
        }));
        setNeedsProfile(true);
        return;
      }
      finishCustomerSignIn(response);
    } catch (error) {
      sessionAttempted.current = false;
      setErrorMessage(
        error.status === 409
          ? error.message || t("customerSignIn.conflict")
          : error.message || t("customerSignIn.signInFailed")
      );
    } finally {
      sessionInFlight.current = false;
      setBusy("");
    }
  }, [finishCustomerSignIn, getToken, isSignedIn, t]);

  useEffect(() => {
    if (isLoaded && isSignedIn) exchangeClerkSession();
  }, [exchangeClerkSession, isLoaded, isSignedIn]);

  const handleCompleteProfile = async (event) => {
    event.preventDefault();
    setBusy("profile");
    setErrorMessage("");
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error(t("customerSignIn.missingClerkToken"));
      const response = await authApi.customerClerkCompleteProfile(clerkToken, {
        full_name: profile.full_name.trim(),
        phone_number: profile.phone_number.trim(),
        kennitala: profile.kennitala.trim(),
      });
      finishCustomerSignIn(response);
    } catch (error) {
      setErrorMessage(
        error.status === 409
          ? error.message || t("customerSignIn.conflict")
          : error.message || t("customerSignIn.profileFailed")
      );
    } finally {
      setBusy("");
    }
  };

  const handleCancelProfile = async () => {
    setBusy("cancel");
    setErrorMessage("");
    try {
      await signOut();
      clearCustomerSession();
      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(error.message || t("customerSignIn.signOutFailed"));
      setBusy("");
    }
  };

  const isBusy = Boolean(busy);

  return (
    <CustomerLayout pageClassName="customer-sign-in-page">
      <main className="customer-sign-in-shell">
        <section className="customer-sign-in-card" aria-labelledby="customer-sign-in-title">
          <p className="customer-sign-in-eyebrow">{t("customerSignIn.eyebrow")}</p>
          <h1 id="customer-sign-in-title">
            {needsProfile
              ? t("customerSignIn.completeTitle")
              : isSignUp
                ? t("customerSignIn.signupTitle")
                : t("customerSignIn.title")}
          </h1>
          <p className="customer-sign-in-intro">
            {needsProfile
              ? t("customerSignIn.completeDescription")
                : isSignUp
                  ? t("customerSignIn.signupDescription")
                  : t("customerSignIn.description")}
          </p>

          {errorMessage && <p role="alert" className="customer-sign-in-error">{errorMessage}</p>}

          {needsProfile ? (
            <form className="customer-profile-form" onSubmit={handleCompleteProfile}>
              <label>
                {t("customerSignIn.email")}
                <input type="email" value={profile.email} readOnly />
              </label>
              <label>
                {t("customerSignIn.fullName")}
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={profile.full_name}
                  onChange={(event) => setProfile({ ...profile, full_name: event.target.value })}
                />
              </label>
              <label>
                {t("customerSignIn.phone")}
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={profile.phone_number}
                  onChange={(event) => setProfile({ ...profile, phone_number: event.target.value })}
                />
              </label>
              <label>
                {t("customerSignIn.kennitala")}
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={profile.kennitala}
                  onChange={(event) => setProfile({ ...profile, kennitala: event.target.value })}
                />
              </label>
              <button className="customer-sign-in-submit" type="submit" disabled={isBusy}>
                {busy === "profile" ? t("customerSignIn.saving") : t("customerSignIn.completeButton")}
              </button>
              <button
                className="customer-sign-in-cancel"
                type="button"
                onClick={handleCancelProfile}
                disabled={isBusy}
              >
                {t("customerSignIn.cancel")}
              </button>
            </form>
          ) : (
            <div className="customer-provider-options">
              {!isLoaded || (isSignedIn && busy === "session") ? (
                <p role="status" className="customer-sign-in-status">
                  {t("customerSignIn.loading")}
                </p>
              ) : isSignedIn ? (
                <button
                  className="customer-provider-button"
                  type="button"
                  onClick={() => {
                    sessionAttempted.current = false;
                    exchangeClerkSession();
                  }}
                  disabled={isBusy}
                >
                  {t("customerSignIn.retry")}
                </button>
              ) : (
                <div className="customer-clerk-auth">
                  {isSignUp ? (
                    <SignUp
                      appearance={customerClerkAppearance}
                      forceRedirectUrl={forceRedirectUrl}
                      routing="hash"
                      signInUrl={customerSignInUrl}
                    />
                  ) : (
                    <SignIn
                      appearance={customerClerkAppearance}
                      forceRedirectUrl={forceRedirectUrl}
                      routing="hash"
                      signUpUrl={customerSignUpUrl}
                    />
                  )}
                  <p className="customer-sign-in-note">{t("customerSignIn.providerNote")}</p>
                </div>
              )}
            </div>
          )}

          <Link className="customer-sign-in-back" to={destination}>
            {t("customerSignIn.back")}
          </Link>
        </section>
      </main>
    </CustomerLayout>
  );
}

export default CustomerSignInPage;
