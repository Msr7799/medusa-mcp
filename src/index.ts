import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import crypto from "crypto";
import axios, { AxiosError, Method } from "axios";
import FormData from "form-data";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);

const REQUIRE_CONFIRM = (process.env.REQUIRE_CONFIRM || "true").toLowerCase() !== "false";
const CONFIRM_SECRET = process.env.CONFIRM_SECRET || "change_me";
const CONFIRM_TTL_SECONDS = Number(process.env.CONFIRM_TTL_SECONDS || 300);

const MEDUSA_BASE_URL = (process.env.MEDUSA_BASE_URL || "").replace(/\/+$/, "");
const MEDUSA_AUTH_MODE = (process.env.MEDUSA_AUTH_MODE || "basic").toLowerCase(); // basic | bearer
const MEDUSA_AUTH_TOKEN = process.env.MEDUSA_AUTH_TOKEN || "";

if (!MEDUSA_BASE_URL) {
  console.warn("[WARN] MEDUSA_BASE_URL is not set. Tools that call Medusa will fail until it's configured.");
}
if (!MEDUSA_AUTH_TOKEN) {
  console.warn("[WARN] MEDUSA_AUTH_TOKEN is not set. Tools that call Medusa will fail until it's configured.");
}

function buildAuthHeader(): Record<string, string> {
  if (!MEDUSA_AUTH_TOKEN) return {};
  if (MEDUSA_AUTH_MODE === "bearer") return { Authorization: `Bearer ${MEDUSA_AUTH_TOKEN}` };
  // Medusa v2 docs: API token can be passed via Authorization: Basic <token>
  return { Authorization: `Basic ${MEDUSA_AUTH_TOKEN}` };
}

const http = axios.create({
  baseURL: MEDUSA_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    ...buildAuthHeader(),
  },
});

function base64UrlEncode(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlDecodeToBuffer(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

type ConfirmPayload = {
  exp: number;
  iat: number;
  method: Method;
  path: string;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
};

function signConfirmPayload(payload: ConfirmPayload): string {
  const json = JSON.stringify(payload);
  const msg = base64UrlEncode(Buffer.from(json, "utf-8"));
  const sig = crypto.createHmac("sha256", CONFIRM_SECRET).update(msg).digest();
  return `${msg}.${base64UrlEncode(sig)}`;
}

function verifyConfirmToken(token: string): ConfirmPayload {
  const [msg, sig] = token.split(".");
  if (!msg || !sig) throw new Error("Invalid token format");

  const expected = crypto.createHmac("sha256", CONFIRM_SECRET).update(msg).digest();
  const expectedSig = base64UrlEncode(expected);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error("Invalid token signature");
  }

  const payloadJson = base64UrlDecodeToBuffer(msg).toString("utf-8");
  const payload = JSON.parse(payloadJson) as ConfirmPayload;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Confirm token expired");

  return payload;
}

function toolText(data: any) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] as any[] };
}

function axiosErrorToObject(err: any) {
  const ax = err as AxiosError;
  return {
    message: ax?.message || String(err),
    status: ax?.response?.status,
    data: ax?.response?.data,
  };
}

async function medusaAdminRequest(params: {
  method: Method;
  path: string;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}) {
  const path = params.path.startsWith("/") ? params.path : `/${params.path}`;
  if (!path.startsWith("/admin") && !path.startsWith("/auth")) {
    throw new Error("Only /admin or /auth routes are allowed from this MCP server.");
  }

  const res = await http.request({
    method: params.method,
    url: path,
    params: params.query,
    data: params.body,
    headers: {
      ...params.headers,
      ...buildAuthHeader(),
    },
  });

  return res.data;
}

function makeConfirmToken(method: Method, path: string, query?: Record<string, any>, body?: any, headers?: Record<string, string>) {
  const now = Math.floor(Date.now() / 1000);
  const payload: ConfirmPayload = {
    iat: now,
    exp: now + CONFIRM_TTL_SECONDS,
    method,
    path,
    query,
    body,
    headers,
  };
  return signConfirmPayload(payload);
}

function writeToolResponsePreview(params: { method: Method; path: string; query?: any; body?: any; headers?: any }) {
  const token = makeConfirmToken(params.method, params.path, params.query, params.body, params.headers);
  return toolText({
    ok: true,
    mode: "dry_run",
    preview: params,
    confirm: {
      required: true,
      token,
      ttl_seconds: CONFIRM_TTL_SECONDS,
      how_to: "Call tool `admin_confirm` with confirm_token لتنفيذ العملية فعليًا.",
    },
  });
}

async function createServer() {
  const server = new McpServer({
    name: "medusa-admin-mcp",
    version: "0.1.0",
  });

  // ---------- READ: Store/Config helpers ----------
  server.tool(
    "admin_list_products",
    "List products (Admin API).",
    {
      q: z.string().optional().describe("Search query"),
      limit: z.number().int().min(1).max(200).optional().describe("Max items (default 20)"),
      offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
      fields: z.string().optional().describe("Comma-separated fields selection"),
      expand: z.string().optional().describe("Comma-separated relations to expand"),
    },
    async (input) => {
      try {
        const data = await medusaAdminRequest({
          method: "GET",
          path: "/admin/products",
          query: {
            q: input.q,
            limit: input.limit ?? 20,
            offset: input.offset ?? 0,
            fields: input.fields,
            expand: input.expand,
          },
        });
        return toolText(data);
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  server.tool(
    "admin_get_product",
    "Get a product by id (Admin API).",
    {
      id: z.string().min(1).describe("Product ID"),
      fields: z.string().optional(),
      expand: z.string().optional(),
    },
    async (input) => {
      try {
        const data = await medusaAdminRequest({
          method: "GET",
          path: `/admin/products/${encodeURIComponent(input.id)}`,
          query: { fields: input.fields, expand: input.expand },
        });
        return toolText(data);
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  server.tool(
    "admin_list_categories",
    "List product categories (Admin API).",
    {
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
    },
    async (input) => {
      try {
        const data = await medusaAdminRequest({
          method: "GET",
          path: "/admin/product-categories",
          query: { limit: input.limit ?? 100, offset: input.offset ?? 0 },
        });
        return toolText(data);
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  server.tool(
    "admin_list_regions",
    "List regions (Admin API).",
    {
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
    },
    async (input) => {
      try {
        const data = await medusaAdminRequest({
          method: "GET",
          path: "/admin/regions",
          query: { limit: input.limit ?? 100, offset: input.offset ?? 0 },
        });
        return toolText(data);
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  server.tool(
    "admin_list_sales_channels",
    "List sales channels (Admin API).",
    {
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
    },
    async (input) => {
      try {
        const data = await medusaAdminRequest({
          method: "GET",
          path: "/admin/sales-channels",
          query: { limit: input.limit ?? 100, offset: input.offset ?? 0 },
        });
        return toolText(data);
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  // ---------- WRITE: Products (Dry-run + Confirm) ----------
  server.tool(
    "admin_create_product",
    "Create product (Admin API) — requires confirm unless dry_run=false and REQUIRE_CONFIRM=false.",
    {
      product: z.any().describe("Medusa product create payload (as per Admin API)"),
      dry_run: z.boolean().optional().describe("Default true when REQUIRE_CONFIRM is enabled"),
    },
    async (input) => {
      try {
        const dryRun = input.dry_run ?? REQUIRE_CONFIRM;
        if (dryRun) {
          return writeToolResponsePreview({
            method: "POST",
            path: "/admin/products",
            body: input.product,
          });
        }
        const data = await medusaAdminRequest({
          method: "POST",
          path: "/admin/products",
          body: input.product,
        });
        return toolText({ ok: true, result: data });
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  server.tool(
    "admin_update_product",
    "Update product (Admin API) — requires confirm unless dry_run=false and REQUIRE_CONFIRM=false.",
    {
      id: z.string().min(1).describe("Product ID"),
      update: z.any().describe("Update payload"),
      dry_run: z.boolean().optional(),
    },
    async (input) => {
      try {
        const dryRun = input.dry_run ?? REQUIRE_CONFIRM;
        const path = `/admin/products/${encodeURIComponent(input.id)}`;
        if (dryRun) {
          return writeToolResponsePreview({
            method: "POST",
            path,
            body: input.update,
          });
        }
        const data = await medusaAdminRequest({
          method: "POST",
          path,
          body: input.update,
        });
        return toolText({ ok: true, result: data });
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  server.tool(
    "admin_delete_product",
    "Delete product (Admin API) — requires confirm unless dry_run=false and REQUIRE_CONFIRM=false.",
    {
      id: z.string().min(1).describe("Product ID"),
      dry_run: z.boolean().optional(),
    },
    async (input) => {
      try {
        const dryRun = input.dry_run ?? REQUIRE_CONFIRM;
        const path = `/admin/products/${encodeURIComponent(input.id)}`;
        if (dryRun) {
          return writeToolResponsePreview({
            method: "DELETE",
            path,
          });
        }
        const data = await medusaAdminRequest({
          method: "DELETE",
          path,
        });
        return toolText({ ok: true, result: data });
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  // ---------- WRITE: Uploads ----------
  server.tool(
    "admin_upload_file_base64",
    "Upload a file to Medusa (Admin API /admin/uploads) using base64. Requires confirm by default.",
    {
      filename: z.string().min(1).describe("File name, e.g. image.png"),
      mime_type: z.string().min(1).describe("MIME type, e.g. image/png"),
      base64_data: z.string().min(1).describe("Base64 (without data: prefix)"),
      protected: z.boolean().optional().describe("If true, upload as protected (if supported by your file provider)"),
      dry_run: z.boolean().optional(),
    },
    async (input) => {
      try {
        const dryRun = input.dry_run ?? REQUIRE_CONFIRM;

        const path = input.protected ? "/admin/uploads/protected" : "/admin/uploads";
        const body = {
          filename: input.filename,
          mime_type: input.mime_type,
          base64_len: Math.ceil(input.base64_data.length / 4) * 3,
        };

        if (dryRun) {
          return writeToolResponsePreview({
            method: "POST",
            path,
            body: { note: "multipart/form-data upload", ...body },
          });
        }

        const buffer = Buffer.from(input.base64_data, "base64");

        const form = new FormData();
        form.append("files", buffer, {
          filename: input.filename,
          contentType: input.mime_type,
        });

        const res = await axios.request({
          method: "POST",
          baseURL: MEDUSA_BASE_URL,
          url: path,
          headers: {
            ...form.getHeaders(),
            ...buildAuthHeader(),
          },
          data: form,
          maxContentLength: 50 * 1024 * 1024,
          maxBodyLength: 50 * 1024 * 1024,
          timeout: 60000,
        });

        return toolText({ ok: true, result: res.data });
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  // ---------- SAFE UI ACTIONS (no side-effects) ----------
  server.tool(
    "ui_navigate_to",
    "Return a UI navigation action for your dashboard (client should interpret it).",
    {
      path: z.string().min(1).describe("Dashboard internal path, e.g. /products, /orders, /settings"),
    },
    async (input) => {
      return toolText({
        ok: true,
        action: "NAVIGATE",
        path: input.path,
        note: "This tool does not change anything server-side. Your UI should read this action and navigate.",
      });
    }
  );

  server.tool(
    "ui_toast",
    "Return a UI toast/notification action.",
    {
      message: z.string().min(1),
      kind: z.enum(["success", "info", "warning", "error"]).default("info"),
    },
    async (input) => {
      return toolText({ ok: true, action: "TOAST", kind: input.kind, message: input.message });
    }
  );

  // ---------- GENERIC REQUEST (escape hatch) ----------
  server.tool(
    "admin_request",
    "Generic Admin API request (GET/POST/DELETE) with confirm for writes.",
    {
      method: z.enum(["GET", "POST", "DELETE"]).describe("HTTP method"),
      path: z.string().min(1).describe("Must start with /admin or /auth"),
      query: z.record(z.any()).optional(),
      body: z.any().optional(),
      dry_run: z.boolean().optional(),
    },
    async (input) => {
      try {
        const method = input.method as Method;
        const isWrite = method !== "GET";
        const dryRun = input.dry_run ?? (isWrite && REQUIRE_CONFIRM);

        if (isWrite && dryRun) {
          return writeToolResponsePreview({
            method,
            path: input.path,
            query: input.query,
            body: input.body,
          });
        }

        const data = await medusaAdminRequest({
          method,
          path: input.path,
          query: input.query,
          body: input.body,
        });

        return toolText({ ok: true, result: data });
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  // ---------- CONFIRM EXECUTION ----------
  server.tool(
    "admin_confirm",
    "Execute a previously previewed write action (confirm token).",
    {
      confirm_token: z.string().min(10),
    },
    async (input) => {
      try {
        const payload = verifyConfirmToken(input.confirm_token);

        const data = await medusaAdminRequest({
          method: payload.method,
          path: payload.path,
          query: payload.query,
          body: payload.body,
          headers: payload.headers,
        });

        return toolText({ ok: true, executed: payload, result: data });
      } catch (e: any) {
        return toolText({ ok: false, error: axiosErrorToObject(e) });
      }
    }
  );

  const transport = new StreamableHTTPServerTransport({
    // Stateless transport (recommended for serverless / Koyeb scale-to-zero)
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  return { server, transport };
}

// ---------- Express app ----------
export const app = express();

app.use(helmet());
app.use(express.json({ limit: "10mb" }));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || CORS_ORIGINS.includes("*")) return cb(null, true);
      if (CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "medusa-admin-mcp", time: new Date().toISOString() });
});

// MCP endpoint (Streamable HTTP). Convention: POST /mcp
app.post("/mcp", async (req: Request, res: Response) => {
  const { server, transport } = await createServer();

  await transport.handleRequest(req, res, req.body);

  res.on("close", () => {
    transport.close();
    server.close();
  });
});

// Basic root route for verification
app.get("/", (req, res) => {
  res.send("Medusa MCP Server is running!");
});

// Only start the server if we are not in a Vercel/serverless environment
// or if we are the main module (approximated here by checking VERCEL env or similar,
// but common pattern is export app and only listen if not imported).
// However, since we might want to run locally with `npm run dev`, we keep it simple:
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[MCP] Listening on :${PORT} (POST /mcp)`);
  });
}

// For Vercel/production startup if entry point is different, 
// usually we leave it as is if we use a separate entry point.
// But if we use 'npm start' on a VPS, we want it to listen.
// Let's refine:
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`[MCP] Listening on :${PORT} (POST /mcp)`);
  });
}

export default app;
