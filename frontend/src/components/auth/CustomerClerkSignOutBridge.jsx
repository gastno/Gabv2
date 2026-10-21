import { useEffect } from "react";
import { useAuth, useClerk } from "@clerk/react";
import { getClerkSignOutEventName } from "../../services/customerSession";

function CustomerClerkSignOutBridge() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleSignOut = (event) => {
      event.preventDefault();
      if (!isLoaded) {
        event.detail.reject(new Error("Customer sign-out is still loading. Please try again."));
        return;
      }
      if (!isSignedIn) {
        event.detail.resolve();
        return;
      }
      Promise.resolve()
        .then(() => signOut())
        .then(event.detail.resolve, event.detail.reject);
    };
    const eventName = getClerkSignOutEventName();
    window.addEventListener(eventName, handleSignOut);
    return () => window.removeEventListener(eventName, handleSignOut);
  }, [isLoaded, isSignedIn, signOut]);

  return null;
}

export default CustomerClerkSignOutBridge;
