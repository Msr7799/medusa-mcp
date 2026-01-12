import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  // Medusa
  medusaBaseUrl: (process.env.MEDUSA_BASE_URL || "").replace(/\/+$/, ""),
  // Backward compatible env var names:
  // - MEDUSA_AUTH_MODE (old) or MEDUSA_AUTH_TYPE (new)
  medusaAuthType: ((process.env.MEDUSA_AUTH_TYPE || process.env.MEDUSA_AUTH_MODE || "basic").toLowerCase() as
    | "basic"
    | "bearer"),
  // Backward compatible env var names:
  // - MEDUSA_AUTH_TOKEN (old) or MEDUSA_SECRET_API_KEY (preferred)
  medusaAuthToken: (process.env.MEDUSA_SECRET_API_KEY || process.env.MEDUSA_AUTH_TOKEN || "").trim(),

  // Security for this MCP server endpoint itself
  // If set, every /mcp request must include either:
  // - Authorization: Bearer <MCP_API_KEY>
  // - x-mcp-api-key: <MCP_API_KEY>
  mcpApiKey: (process.env.MCP_API_KEY || "").trim(),

  // CORS
  // Backward compatible env var names:
  // - CORS_ORIGINS (preferred)
  // - ALLOWED_ORIGINS (legacy)
  corsOrigins: ((process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)),

  // Express JSON body limit (note: Vercel has its own hard cap ~4.5MB)
  jsonBodyLimit: (process.env.JSON_BODY_LIMIT || "10mb").trim(),

  // Confirm gate
  requireConfirm: (process.env.REQUIRE_CONFIRM || "true").toLowerCase() !== "false",
  confirmSecret: (process.env.CONFIRM_SECRET || "").trim(),
  confirmTtlSeconds: Number(process.env.CONFIRM_TTL_SECONDS || 300),
};

export function assertEnv() {
  const missing: string[] = [];
  if (!env.medusaBaseUrl) missing.push("MEDUSA_BASE_URL");
  if (!env.medusaAuthToken) missing.push("MEDUSA_SECRET_API_KEY (or MEDUSA_AUTH_TOKEN)");
  if (env.requireConfirm && !env.confirmSecret) missing.push("CONFIRM_SECRET");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}
