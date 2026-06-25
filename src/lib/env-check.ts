// Validate required environment variables at startup.
// Called from instrumentation.ts or layout.tsx server side.

const REQUIRED_PRODUCTION_VARS = ["DATABASE_URL", "MM_SECRET"] as const;

export function validateEnv() {
  if (process.env.NODE_ENV !== "production") return; // Skip in dev

  const missing = REQUIRED_PRODUCTION_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(", ")}\n` +
        `See .env.example for reference.`
    );
  }

  // Warn about weak secrets
  const secret = process.env.MM_SECRET!;
  if (secret.length < 32) {
    console.warn(
      "[security] MM_SECRET should be at least 32 characters. " +
        "Generate with: openssl rand -hex 32"
    );
  }
}
