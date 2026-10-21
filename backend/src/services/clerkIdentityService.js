const { createClerkClient, verifyToken } = require('@clerk/backend');
const {
  isClerkAPIResponseError,
  TokenVerificationErrorReason,
} = require('@clerk/backend/errors');

const tokenVerificationReasons = new Set(Object.values(TokenVerificationErrorReason));
const providerVerificationFailureReasons = new Set([
  TokenVerificationErrorReason.InvalidSecretKey,
  TokenVerificationErrorReason.LocalJWKMissing,
  TokenVerificationErrorReason.RemoteJWKFailedToLoad,
  TokenVerificationErrorReason.RemoteJWKInvalid,
  TokenVerificationErrorReason.RemoteJWKMissing,
  TokenVerificationErrorReason.JWKFailedToResolve,
]);

class InvalidClerkIdentityError extends Error {
  constructor() {
    super('The Clerk session is invalid or does not contain a verified email address.');
    this.status = 401;
  }
}

class ClerkIdentityProviderError extends Error {
  constructor() {
    super('Clerk identity verification is not configured or temporarily unavailable.');
    this.status = 503;
  }
}

const createClerkIdentityVerifier = ({
  verify = verifyToken,
  createClient = createClerkClient,
  env = process.env,
} = {}) => {
  const getConfiguration = () => {
    const secretKey = env.CLERK_SECRET_KEY;
    const issuer = env.CLERK_ISSUER;
    const authorizedParties = (env.CLERK_AUTHORIZED_PARTIES || '')
      .split(',')
      .map(party => party.trim())
      .filter(Boolean);

    if (!secretKey || !issuer || authorizedParties.length === 0) {
      throw new ClerkIdentityProviderError();
    }

    return { secretKey, issuer, authorizedParties };
  };

  return async token => {
    const configuration = getConfiguration();
    let payload;
    try {
      payload = await verify(token, configuration);
    } catch (error) {
      if (!tokenVerificationReasons.has(error?.reason)
          || providerVerificationFailureReasons.has(error.reason)) {
        throw new ClerkIdentityProviderError();
      }
      throw new InvalidClerkIdentityError();
    }

    if (!payload || payload.iss !== configuration.issuer
        || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255
        || typeof payload.sid !== 'string' || !payload.sid
        || !configuration.authorizedParties.includes(payload.azp)) {
      throw new InvalidClerkIdentityError();
    }

    let user;
    try {
      user = await createClient({ secretKey: configuration.secretKey }).users.getUser(payload.sub);
    } catch (error) {
      if (isClerkAPIResponseError(error) && error.status === 404) {
        throw new InvalidClerkIdentityError();
      }
      throw new ClerkIdentityProviderError();
    }

    if (user.id !== payload.sub || user.banned || !Array.isArray(user.emailAddresses)) {
      throw new InvalidClerkIdentityError();
    }

    const primaryEmail = user.emailAddresses.find(
      address => address.id === user.primaryEmailAddressId
    );
    const email = primaryEmail?.emailAddress?.trim();
    if (!primaryEmail || primaryEmail.verification?.status !== 'verified'
        || !email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new InvalidClerkIdentityError();
    }

    return {
      subject: user.id,
      email: email.toLowerCase(),
      fullName: user.fullName || '',
    };
  };
};

const verifyClerkIdentity = createClerkIdentityVerifier();

module.exports = {
  ClerkIdentityProviderError,
  InvalidClerkIdentityError,
  createClerkIdentityVerifier,
  verifyClerkIdentity,
};
