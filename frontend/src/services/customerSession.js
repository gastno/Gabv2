const CUSTOMER_TOKEN_KEY = "customer_auth_token";
const CUSTOMER_NAME_KEY = "customer_auth_user_name";
const CUSTOMER_SESSION_EVENT = "customer-session-change";
const CLERK_SIGN_OUT_EVENT = "customer-clerk-sign-out";

export function saveCustomerSession(token, customer) {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("The customer session response did not include an app token.");
  }

  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);

  const name = customer?.full_name || customer?.name;
  if (name) {
    localStorage.setItem(CUSTOMER_NAME_KEY, name);
  } else {
    localStorage.removeItem(CUSTOMER_NAME_KEY);
  }

  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_EVENT, {
    detail: { customer: customer || null },
  }));
}

export function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_NAME_KEY);
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_EVENT, {
    detail: { customer: null },
  }));
}

export function getCustomerSessionEventName() {
  return CUSTOMER_SESSION_EVENT;
}

export function requestClerkSignOut() {
  return new Promise((resolve, reject) => {
    const event = new CustomEvent(CLERK_SIGN_OUT_EVENT, {
      cancelable: true,
      detail: { resolve, reject },
    });
    const handled = !window.dispatchEvent(event);
    if (!handled) {
      reject(new Error("Customer sign-out is not available."));
    }
  });
}

export function getClerkSignOutEventName() {
  return CLERK_SIGN_OUT_EVENT;
}
