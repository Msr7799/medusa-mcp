import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  medusaBaseUrl: (process.env.MEDUSA_BASE_URL || "").replace(/\/$/, ""),
  medusaAuthType: (process.env.MEDUSA_AUTH_TYPE || "basic").toLowerCase() as "basic" | "bearer",
  medusaAuthToken: process.env.MEDUSA_AUTH_TOKEN || "",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
  requireConfirm: (process.env.REQUIRE_CONFIRM || "true").toLowerCase() === "true",
  confirmSecret: process.env.CONFIRM_SECRET || "",
  confirmTtlSeconds: Number(process.env.CONFIRM_TTL_SECONDS || 300),
  DATABASE_URL: process.env.DATABASE_URL || "",
  STOREFRONT_URL: (process.env.STOREFRONT_URL || "").replace(/\/$/, ""),
};

export function assertEnv() {
  const missing: string[] = [];
  if (!env.medusaBaseUrl) missing.push("MEDUSA_BASE_URL");
  if (!env.medusaAuthToken) missing.push("MEDUSA_AUTH_TOKEN");
  if (env.requireConfirm && !env.confirmSecret) missing.push("CONFIRM_SECRET");
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}
