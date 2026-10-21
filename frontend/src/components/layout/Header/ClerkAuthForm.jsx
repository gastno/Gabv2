import React from "react";
import { SignIn, SignUp } from "@clerk/react";
import customerClerkAppearance from "../../auth/customerClerkAppearance";

function ClerkAuthForm({ authMode, customerSignInUrl, customerSignUpUrl, t }) {
  return (
    <section className={`header-clerk-auth auth-form-slide-in-${authMode === "login" ? "left" : "right"}`}>
      <h2>
        {authMode === "login"
          ? t("customerSignIn.title")
          : t("customerSignIn.signupTitle")}
      </h2>
      {authMode === "login" ? (
        <SignIn
          appearance={customerClerkAppearance}
          forceRedirectUrl={customerSignInUrl}
          routing="hash"
          signUpUrl={customerSignUpUrl}
        />
      ) : (
        <SignUp
          appearance={customerClerkAppearance}
          forceRedirectUrl={customerSignInUrl}
          routing="hash"
          signInUrl={customerSignInUrl}
        />
      )}
    </section>
  );
}

export default ClerkAuthForm;
