import axios, { AxiosRequestConfig } from "axios";
import FormData from "form-data";
import { env } from "./env.js";
import { getContext } from "./context.js";

export type MedusaAuth = {
  type: "basic" | "bearer";
  token: string;
};

export function getAuthHeaders(): Record<string, string> {
  const ctx = getContext();

  // 1) Per-request override (sent by the agent/client as headers to this MCP server)
  const override = ctx?.medusaAuthOverride;
  if (override) {
    if ("authorizationHeader" in override) {
      return { Authorization: override.authorizationHeader };
    }
    return {
      Authorization: override.type === "bearer" ? `Bearer ${override.token}` : `Basic ${override.token}`,
    };
  }

  // 2) Default server env auth
  const token = env.medusaAuthToken;
  if (!token) return {};
  if (env.medusaAuthType === "bearer") return { Authorization: `Bearer ${token}` };
  // Medusa v2 docs: API token is sent via Authorization: Basic <token> (base64 optional)
  return { Authorization: `Basic ${token}` };
}

export async function medusaRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  opts: {
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = `${env.medusaBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const config: AxiosRequestConfig = {
    method,
    url,
    params: opts.query,
    data: opts.body,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(opts.headers || {}),
    },
    timeout: 30_000,
    validateStatus: () => true,
  };

  const res = await axios(config);
  if (res.status >= 200 && res.status < 300) {
    return res.data as T;
  }

  const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  throw new Error(`Medusa request failed (${res.status}) ${method} ${path}: ${msg}`);
}

export async function medusaUploadBase64(
  file: { filename: string; contentType: string; base64: string },
  opts: { isPrivate?: boolean } = {}
) {
  const url = `${env.medusaBaseUrl}/admin/uploads`;
  const fd = new FormData();

  const buffer = Buffer.from(file.base64, "base64");
  fd.append("files", buffer, { filename: file.filename, contentType: file.contentType });

  // Some providers support passing "is_private" or similar flags; keep optional.
  if (typeof opts.isPrivate === "boolean") {
    fd.append("is_private", String(opts.isPrivate));
  }

  const res = await axios.post(url, fd, {
    headers: {
      ...fd.getHeaders(),
      ...getAuthHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60_000,
    validateStatus: () => true,
  });

  if (res.status >= 200 && res.status < 300) return res.data;
  const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  throw new Error(`Upload failed (${res.status}): ${msg}`);
}
