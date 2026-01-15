import { z } from "zod";
import { env } from "./env.js";
import { mintConfirmToken } from "./confirm.js";
import { medusaRequest, medusaUploadBase64 } from "./medusa.js";

function asText(obj: any) {
  return typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

export const tools = {
  // ---- READ tools ----
  admin_list_products: {
    description: "List products from Medusa Admin API (/admin/products).",
    schema: {
      q: z.string().optional().describe("Search query"),
      limit: z.number().int().min(1).max(100).optional().describe("Max items"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
      fields: z.string().optional().describe("Comma-separated fields selection"),
      expand: z.string().optional().describe("Comma-separated relations to expand"),
    },
    handler: async (input: any) => {
      const data = await medusaRequest("GET", "/admin/products", {
        query: {
          q: input.q,
          limit: input.limit,
          offset: input.offset,
          fields: input.fields,
          expand: input.expand,
        },
      });
      // Help the AI by explicitly stating the count
      const summary = `Total Count: ${data.count}. Offset: ${data.offset}. Limit: ${data.limit}. Products returned: ${data.products?.length}`;
      return { content: [{ type: "text", text: `${summary}\n\n${asText(data)}` }] };
    },
  },

  admin_get_product: {
    description: "Get a product by ID from Medusa Admin API (/admin/products/:id).",
    schema: {
      id: z.string().min(1).describe("Product ID"),
      fields: z.string().optional(),
      expand: z.string().optional(),
    },
    handler: async (input: any) => {
      const data = await medusaRequest("GET", `/admin/products/${encodeURIComponent(input.id)}`, {
        query: { fields: input.fields, expand: input.expand },
      });
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  admin_list_categories: {
    description: "List product categories (/admin/product-categories).",
    schema: {
      q: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    },
    handler: async (input: any) => {
      const data = await medusaRequest("GET", "/admin/product-categories", {
        query: { q: input.q, limit: input.limit, offset: input.offset },
      });
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  admin_list_regions: {
    description: "List regions (/admin/regions).",
    schema: {
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    },
    handler: async (input: any) => {
      const data = await medusaRequest("GET", "/admin/regions", {
        query: { limit: input.limit, offset: input.offset },
      });
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  admin_list_sales_channels: {
    description: "List sales channels (/admin/sales-channels).",
    schema: {
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    },
    handler: async (input: any) => {
      const data = await medusaRequest("GET", "/admin/sales-channels", {
        query: { limit: input.limit, offset: input.offset },
      });
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  // ---- CATEGORIES & COLLECTIONS ----
  admin_create_category: {
    description: "Create a product category (/admin/product-categories).",
    schema: {
      name: z.string().min(1).describe("Category name"),
      parent_category_id: z.string().optional().describe("Parent category ID"),
      is_active: z.boolean().optional().default(true),
      is_internal: z.boolean().optional().default(false),
      rank: z.number().int().optional(),
    },
    handler: async (input: any) => {
      const body = {
        name: input.name,
        parent_category_id: input.parent_category_id,
        is_active: input.is_active,
        is_internal: input.is_internal,
        rank: input.rank,
      };
      const data = await medusaRequest("POST", "/admin/product-categories", { body });
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  admin_add_product_to_category: {
    description: "Add products to a category (/admin/product-categories/:id/products/batch).",
    schema: {
      category_id: z.string().min(1),
      product_ids: z.array(z.string()).min(1).describe("Array of Product IDs"),
    },
    handler: async (input: any) => {
      const body = {
        product_ids: input.product_ids.map((id: string) => ({ id })),
      };
      const data = await medusaRequest(
        "POST",
        `/admin/product-categories/${input.category_id}/products/batch`,
        { body }
      );
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  admin_create_collection: {
    description: "Create a product collection (/admin/collections).",
    schema: {
      title: z.string().min(1).describe("Collection title"),
      handle: z.string().optional(),
    },
    handler: async (input: any) => {
      const body = {
        title: input.title,
        handle: input.handle,
      };
      const data = await medusaRequest("POST", "/admin/collections", { body });
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  admin_add_product_to_collection: {
    description: "Set the collection for a product (Updates the product).",
    schema: {
      product_id: z.string().min(1),
      collection_id: z.string().min(1),
    },
    handler: async (input: any) => {
      const body = {
        collection_id: input.collection_id,
      };
      const data = await medusaRequest("POST", `/admin/products/${input.product_id}`, { body });
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  // ---- REELS ----
  admin_list_reels: {
    description: "List reels from /admin/reels.",
    schema: {},
    handler: async () => {
      try {
        const data = await medusaRequest("GET", "/admin/reels");
        return { content: [{ type: "text", text: asText(data) }] };
      } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: `Failed to list reels: ${e.message}. Ensure the custom endpoint exists.` }] };
      }
    },
  },

  admin_create_reel: {
    description: "Create a new reel entry (/admin/reels).",
    schema: {
      url: z.string().min(1).describe("Video URL"),
      public_id: z.string().min(1).describe("Cloudinary Public ID"),
      type: z.string().default("reel"),
      duration_type: z.string().default("short"),
      // expires_at is optional
    },
    handler: async (input: any) => {
      const body = {
        url: input.url,
        public_id: input.public_id,
        type: input.type,
        duration_type: input.duration_type,
      };
      try {
        const data = await medusaRequest("POST", "/admin/reels", { body });
        return { content: [{ type: "text", text: asText(data) }] };
      } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: `Failed to create reel: ${e.message}` }] };
      }
    },
  },

  admin_delete_reel: {
    description: "Delete a reel (/admin/reels/:id).",
    schema: {
      id: z.string().min(1),
    },
    handler: async (input: any) => {
      try {
        const data = await medusaRequest("DELETE", `/admin/reels/${input.id}`);
        return { content: [{ type: "text", text: asText(data) }] };
      } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: `Failed to delete reel: ${e.message}` }] };
      }
    },
  },

  // ---- UPLOAD ----
  admin_upload_file_base64: {
    description:
      "Upload a file to Medusa using Admin Uploads API (/admin/uploads). Returns uploaded file URLs.",
    schema: {
      filename: z.string().min(1),
      contentType: z.string().min(1).describe("e.g. image/jpeg"),
      base64: z.string().min(1).describe("Base64-encoded file bytes (no data: prefix)"),
      isPrivate: z.boolean().optional().describe("Upload as private if provider supports it"),
    },
    handler: async (input: any) => {
      const data = await medusaUploadBase64(
        { filename: input.filename, contentType: input.contentType, base64: input.base64 },
        { isPrivate: input.isPrivate }
      );
      return { content: [{ type: "text", text: asText(data) }] };
    },
  },

  // ---- WRITE tools (confirm-gated) ----
  admin_create_product: {
    description:
      "Create a product (/admin/products). By default returns a dry-run plan + confirm token; call admin_confirm with the token to execute.",
    schema: {
      product: z.record(z.any()).describe(
        "Raw Medusa product payload (as per Admin API). Example: { title, handle?, status?, options?, variants?, images? }"
      ),
      dry_run: z.boolean().optional().describe("If true, never executes; returns confirm plan only"),
    },
    handler: async (input: any) => {
      const req = {
        method: "POST",
        url: "/admin/products",
        headers: { "Content-Type": "application/json" },
        body: input.product,
      };

      const mustConfirm = env.requireConfirm && input.dry_run !== false;
      if (mustConfirm) {
        const token = mintConfirmToken({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
        });
        return {
          content: [
            {
              type: "text",
              text: asText({
                ok: true,
                mode: "dry_run",
                plan: req,
                confirm_tool: "admin_confirm",
                confirm_token: token,
                note: "Call admin_confirm with confirm_token to execute within TTL.",
              }),
            },
          ],
        };
      }

      const data = await medusaRequest("POST", req.url, { body: req.body });
      return { content: [{ type: "text", text: asText({ ok: true, mode: "executed", data }) }] };
    },
  },

  admin_update_product: {
    description:
      "Update a product (/admin/products/:id). Returns a dry-run plan + confirm token by default; call admin_confirm to execute.",
    schema: {
      id: z.string().min(1),
      patch: z.record(z.any()).describe("Fields to update"),
      dry_run: z.boolean().optional(),
    },
    handler: async (input: any) => {
      const req = {
        method: "POST",
        url: `/admin/products/${encodeURIComponent(input.id)}`,
        headers: { "Content-Type": "application/json" },
        body: input.patch,
      };

      const mustConfirm = env.requireConfirm && input.dry_run !== false;
      if (mustConfirm) {
        const token = mintConfirmToken({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
        });
        return {
          content: [
            {
              type: "text",
              text: asText({
                ok: true,
                mode: "dry_run",
                plan: req,
                confirm_tool: "admin_confirm",
                confirm_token: token,
                note: "Call admin_confirm with confirm_token to execute within TTL.",
              }),
            },
          ],
        };
      }

      const data = await medusaRequest("POST", req.url, { body: req.body });
      return { content: [{ type: "text", text: asText({ ok: true, mode: "executed", data }) }] };
    },
  },

  admin_delete_product: {
    description:
      "Delete a product (/admin/products/:id). Returns a dry-run plan + confirm token by default; call admin_confirm to execute.",
    schema: {
      id: z.string().min(1),
      dry_run: z.boolean().optional(),
    },
    handler: async (input: any) => {
      const req = {
        method: "DELETE",
        url: `/admin/products/${encodeURIComponent(input.id)}`,
        headers: {},
      };

      const mustConfirm = env.requireConfirm && input.dry_run !== false;
      if (mustConfirm) {
        const token = mintConfirmToken({
          method: req.method,
          url: req.url,
          headers: req.headers,
        });
        return {
          content: [
            {
              type: "text",
              text: asText({
                ok: true,
                mode: "dry_run",
                plan: req,
                confirm_tool: "admin_confirm",
                confirm_token: token,
                note: "Call admin_confirm with confirm_token to execute within TTL.",
              }),
            },
          ],
        };
      }

      const data = await medusaRequest("DELETE", req.url);
      return { content: [{ type: "text", text: asText({ ok: true, mode: "executed", data }) }] };
    },
  },

  // ---- CONFIRM ----
  admin_confirm: {
    description:
      "Execute a previously planned write operation. Only accepts confirm_token returned by write tools.",
    schema: {
      confirm_token: z.string().min(1),
    },
    handler: async (_input: any, extra: any) => {
      // Placeholder; implemented in index.ts so it can share verifier + medusa request.
      return { content: [{ type: "text", text: "confirm handler not wired" }], isError: true };
    },
  },

  // ---- UI action helpers (no side-effects) ----
  ui_navigate: {
    description: "Return a UI action that tells the dashboard to navigate to a path.",
    schema: {
      path: z.string().min(1).describe("Example: /products, /settings, /products/create"),
    },
    handler: async (input: any) => ({
      content: [{ type: "text", text: asText({ ok: true, action: "NAVIGATE", path: input.path }) }],
    }),
  },

  ui_toast: {
    description: "Return a UI action to show a toast message in the dashboard.",
    schema: {
      kind: z.enum(["success", "info", "warning", "error"]).default("info"),
      message: z.string().min(1),
    },
    handler: async (input: any) => ({
      content: [
        { type: "text", text: asText({ ok: true, action: "TOAST", kind: input.kind, message: input.message }) },
      ],
    }),
  },

  ui_prefill_form: {
    description: "Return a UI action to prefill a form with values (client decides mapping).",
    schema: {
      form: z.string().min(1).describe("Logical form name, e.g. product_create"),
      values: z.record(z.any()).describe("Key-value map to prefill"),
    },
    handler: async (input: any) => ({
      content: [{ type: "text", text: asText({ ok: true, action: "PREFILL_FORM", form: input.form, values: input.values }) }],
    }),
  },

  // ---- DATABASE TOOLS (Read-Only) ----
  db_list_tables: {
    description: "List all public tables in the database.",
    schema: {},
    handler: async () => {
      const { listTables } = await import("./db.js");
      const tables = await listTables();
      return { content: [{ type: "text", text: asText(tables) }] };
    },
  },

  db_get_table_schema: {
    description: "Get the column schema for a specific table.",
    schema: {
      table_name: z.string().min(1).describe("Name of the table to inspect"),
    },
    handler: async (input: any) => {
      const { getTableSchema } = await import("./db.js");
      const schema = await getTableSchema(input.table_name);
      return { content: [{ type: "text", text: asText(schema) }] };
    },
  },

  db_run_read_only_query: {
    description: "Run a customized SQL query. MUST be a SELECT statement. Mutations are blocked.",
    schema: {
      sql: z.string().min(1).describe("SQL query string"),
    },
    handler: async (input: any) => {
      const { runReadOnlyQuery } = await import("./db.js");
      try {
        const rows = await runReadOnlyQuery(input.sql);
        return { content: [{ type: "text", text: asText(rows) }] };
      } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: `Error: ${e.message}` }] };
      }
    },
  },

  // ---- STOREFRONT DEBUGGING TOOLS ----
  storefront_check_payment_providers: {
    description: "Check database for installed payment providers.",
    schema: {},
    handler: async () => {
      const { runReadOnlyQuery } = await import("./db.js");
      // This assumes a standard Medusa schema. Adjust if necessary.
      const sql = `SELECT id, is_installed FROM payment_provider;`;
      try {
        const rows = await runReadOnlyQuery(sql);
        return { content: [{ type: "text", text: asText({ message: "Payment Providers in DB:", data: rows }) }] };
      } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: `Failed to check payment providers: ${e.message}` }] };
      }
    },
  },

  storefront_ping: {
    description: "Check if the storefront URL is reachable.",
    schema: {
      path: z.string().optional().describe("Optional path to check, e.g. /products"),
    },
    handler: async (input: any) => {
      const baseUrl = env.STOREFRONT_URL;
      if (!baseUrl) {
        return { isError: true, content: [{ type: "text", text: "STOREFRONT_URL is not configured in environment." }] };
      }
      const url = `${baseUrl}${input.path || ""}`;
      try {
        // Using global fetch or axios
        const res = await fetch(url, { method: "HEAD" });
        return { content: [{ type: "text", text: asText({ url, status: res.status, ok: res.ok }) }] };
      } catch (e: any) {
        return { isError: true, content: [{ type: "text", text: `Failed to ping ${url}: ${e.message}` }] };
      }
    }
  }
} as const;
