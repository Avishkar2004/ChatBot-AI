import logger from "../lib/logger.js";

/**
 * Centralised secret resolution.
 *
 * The JWT signing key used to fall back to a string committed in this repo. Any
 * deployment missing the env var was therefore signing tokens with a publicly
 * known secret — enough for anyone to mint a token for any account. Production
 * now refuses to boot without a real one; development gets a loud warning and a
 * throwaway key so `npm run dev` still works out of the box.
 */

const isProduction = process.env.NODE_ENV === "production";
const DEV_FALLBACK_SECRET = "dev-only-insecure-jwt-secret-change-me";

const resolveJwtSecret = () => {
  const configured = process.env.JWT_SECRET?.trim();

  if (configured) {
    if (isProduction && configured === DEV_FALLBACK_SECRET) {
      throw new Error(
        "JWT_SECRET is set to the development placeholder. Generate a real one: " +
          "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
      );
    }
    if (isProduction && configured.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters in production. Generate one: " +
          "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
      );
    }
    return configured;
  }

  if (isProduction) {
    throw new Error(
      "JWT_SECRET is required in production. Refusing to start with a default " +
        "signing key, which would let anyone forge a session for any account.",
    );
  }

  logger.warn("jwt_secret_missing", {
    impact: "using an insecure development key; tokens are not safe to trust",
    fix: "set JWT_SECRET in server/.env",
  });
  return DEV_FALLBACK_SECRET;
};

export const JWT_SECRET = resolveJwtSecret();
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/** Where the browser app lives, used to build links inside emails. */
export const APP_URL = (
  process.env.APP_URL ||
  process.env.CLIENT_ORIGINS?.split(",")[0] ||
  "http://localhost:3000"
).trim().replace(/\/+$/, "");
