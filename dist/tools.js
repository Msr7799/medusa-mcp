import { z } from "zod";
import { env } from "./env.js";
import { mintConfirmToken, verifyConfirmToken } from "./confirm.js";
import { medusaRequest, medusaUploadBase64 } from "./medusa.js";
function asText(obj) {
    return typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}
function toolText(obj, opts = {}) {
    return {
        content: [{ type: "text", text: asText(obj) }],
        ...(opts.isError ? { isError: true } : {}),
    };
}
function assertAllowedAdminPath(path) {
    const p = path.startsWith("/") ? path : `/${path}`;
    if (!p.startsWith("/admin") && !p.startsWith("/auth")) {
        throw new Error("Only /admin or /auth routes are allowed from this MCP server.");
    }
    return p;
}
async function planOrExecute(plan, opts = {}) {
    const requireConfirm = opts.requireConfirm ?? env.requireConfirm;
    const dryRun = opts.dry_run ?? requireConfirm;
    const req = {
        method: plan.method,
        url: assertAllowedAdminPath(plan.url),
        headers: plan.headers || {},
        query: plan.query,
        body: plan.body,
    };
    if (dryRun) {
        const token = mintConfirmToken(req);
        return toolText({
            ok: true,
            mode: "dry_run",
            plan: req,
            confirm_tool: "admin_confirm",
            confirm_token: token,
            ttl_seconds: env.confirmTtlSeconds,
            note: "Call admin_confirm with confirm_token to execute.",
        });
    }
    const data = await medusaRequest(plan.method, req.url, {
        query: req.query,
        body: req.body,
        headers: req.headers,
    });
    return toolText({ ok: true, mode: "executed", data });
}
export const tools = {
    // ---------------------------------------------------------------------------
    // Server meta
    // ---------------------------------------------------------------------------
    server_info: {
        description: "Return basic server configuration (non-secret) and how auth works.",
        schema: {},
        handler: async () => {
            return toolText({
                ok: true,
                name: "medusa-admin-mcp-server",
                require_confirm: env.requireConfirm,
                confirm_ttl_seconds: env.confirmTtlSeconds,
                medusa_base_url_set: Boolean(env.medusaBaseUrl),
                server_auth_enabled: Boolean(env.mcpApiKey),
                medusa_auth_default_mode: env.medusaAuthType,
                medusa_auth_override_headers: {
                    "x-medusa-api-key": "<SECRET_API_KEY>",
                    "x-medusa-auth-type": "basic|bearer (optional)",
                    "x-medusa-authorization": "Basic <token> OR Bearer <token> (optional alternative)",
                },
            });
        },
    },
    // ---------------------------------------------------------------------------
    // READ: Products
    // ---------------------------------------------------------------------------
    admin_list_products: {
        description: "List products from Medusa Admin API (/admin/products).",
        schema: {
            q: z.string().optional().describe("Search query"),
            limit: z.number().int().min(1).max(100).optional().describe("Max items"),
            offset: z.number().int().min(0).optional().describe("Pagination offset"),
            fields: z.string().optional().describe("Comma-separated fields selection"),
            expand: z.string().optional().describe("Comma-separated relations to expand"),
        },
        handler: async (input) => {
            const data = await medusaRequest("GET", "/admin/products", {
                query: {
                    q: input.q,
                    limit: input.limit,
                    offset: input.offset,
                    fields: input.fields,
                    expand: input.expand,
                },
            });
            return toolText(data);
        },
    },
    admin_get_product: {
        description: "Get a product by ID from Medusa Admin API (/admin/products/:id).",
        schema: {
            id: z.string().min(1).describe("Product ID"),
            fields: z.string().optional(),
            expand: z.string().optional(),
        },
        handler: async (input) => {
            const data = await medusaRequest("GET", `/admin/products/${encodeURIComponent(input.id)}`, {
                query: { fields: input.fields, expand: input.expand },
            });
            return toolText(data);
        },
    },
    // Convenience: set collection on a product
    admin_set_product_collection: {
        description: "Assign a product to a collection by updating the product (dry-run by default).",
        schema: {
            product_id: z.string().min(1),
            collection_id: z.string().nullable().describe("Set null to remove from collection"),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "POST",
                url: `/admin/products/${encodeURIComponent(input.product_id)}`,
                headers: { "Content-Type": "application/json" },
                body: { collection_id: input.collection_id },
            }, { dry_run: input.dry_run });
        },
    },
    // ---------------------------------------------------------------------------
    // READ: Collections
    // ---------------------------------------------------------------------------
    admin_list_collections: {
        description: "List product collections (/admin/product-collections).",
        schema: {
            q: z.string().optional(),
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
        },
        handler: async (input) => {
            const data = await medusaRequest("GET", "/admin/product-collections", {
                query: { q: input.q, limit: input.limit, offset: input.offset },
            });
            return toolText(data);
        },
    },
    admin_get_collection: {
        description: "Get a collection by ID (/admin/product-collections/:id).",
        schema: {
            id: z.string().min(1),
        },
        handler: async (input) => {
            const data = await medusaRequest("GET", `/admin/product-collections/${encodeURIComponent(input.id)}`);
            return toolText(data);
        },
    },
    // ---------------------------------------------------------------------------
    // READ: Categories, Regions, Sales channels
    // ---------------------------------------------------------------------------
    admin_list_categories: {
        description: "List product categories (/admin/product-categories).",
        schema: {
            q: z.string().optional(),
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
        },
        handler: async (input) => {
            const data = await medusaRequest("GET", "/admin/product-categories", {
                query: { q: input.q, limit: input.limit, offset: input.offset },
            });
            return toolText(data);
        },
    },
    admin_list_regions: {
        description: "List regions (/admin/regions).",
        schema: {
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
        },
        handler: async (input) => {
            const data = await medusaRequest("GET", "/admin/regions", {
                query: { limit: input.limit, offset: input.offset },
            });
            return toolText(data);
        },
    },
    admin_list_sales_channels: {
        description: "List sales channels (/admin/sales-channels).",
        schema: {
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
        },
        handler: async (input) => {
            const data = await medusaRequest("GET", "/admin/sales-channels", {
                query: { limit: input.limit, offset: input.offset },
            });
            return toolText(data);
        },
    },
    // ---------------------------------------------------------------------------
    // WRITE: Products (confirm-gated)
    // ---------------------------------------------------------------------------
    admin_create_product: {
        description: "Create a product (/admin/products). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            product: z.record(z.any()).describe("Raw Medusa product payload (as per Admin API). Example: { title, handle?, status?, options?, variants?, images? }"),
            dry_run: z.boolean().optional().describe("If true, never executes; returns confirm plan only"),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "POST",
                url: "/admin/products",
                headers: { "Content-Type": "application/json" },
                body: input.product,
            }, { dry_run: input.dry_run });
        },
    },
    admin_update_product: {
        description: "Update a product (/admin/products/:id). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            id: z.string().min(1),
            patch: z.record(z.any()).describe("Fields to update"),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "POST",
                url: `/admin/products/${encodeURIComponent(input.id)}`,
                headers: { "Content-Type": "application/json" },
                body: input.patch,
            }, { dry_run: input.dry_run });
        },
    },
    admin_delete_product: {
        description: "Delete a product (/admin/products/:id). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            id: z.string().min(1),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "DELETE",
                url: `/admin/products/${encodeURIComponent(input.id)}`,
                headers: {},
            }, { dry_run: input.dry_run });
        },
    },
    // ---------------------------------------------------------------------------
    // WRITE: Collections (confirm-gated)
    // ---------------------------------------------------------------------------
    admin_create_collection: {
        description: "Create a product collection (/admin/product-collections). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            collection: z.record(z.any()).describe("Raw Medusa collection payload"),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "POST",
                url: "/admin/product-collections",
                headers: { "Content-Type": "application/json" },
                body: input.collection,
            }, { dry_run: input.dry_run });
        },
    },
    admin_update_collection: {
        description: "Update a product collection (/admin/product-collections/:id). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            id: z.string().min(1),
            patch: z.record(z.any()).describe("Fields to update"),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "POST",
                url: `/admin/product-collections/${encodeURIComponent(input.id)}`,
                headers: { "Content-Type": "application/json" },
                body: input.patch,
            }, { dry_run: input.dry_run });
        },
    },
    admin_delete_collection: {
        description: "Delete a product collection (/admin/product-collections/:id). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            id: z.string().min(1),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "DELETE",
                url: `/admin/product-collections/${encodeURIComponent(input.id)}`,
                headers: {},
            }, { dry_run: input.dry_run });
        },
    },
    // ---------------------------------------------------------------------------
    // WRITE: Categories (confirm-gated)
    // Note: Endpoints may differ across Medusa versions; keep admin_request as fallback.
    // ---------------------------------------------------------------------------
    admin_create_category: {
        description: "Create a product category (/admin/product-categories). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            category: z.record(z.any()).describe("Raw Medusa category payload"),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "POST",
                url: "/admin/product-categories",
                headers: { "Content-Type": "application/json" },
                body: input.category,
            }, { dry_run: input.dry_run });
        },
    },
    admin_update_category: {
        description: "Update a product category (/admin/product-categories/:id). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            id: z.string().min(1),
            patch: z.record(z.any()).describe("Fields to update"),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "POST",
                url: `/admin/product-categories/${encodeURIComponent(input.id)}`,
                headers: { "Content-Type": "application/json" },
                body: input.patch,
            }, { dry_run: input.dry_run });
        },
    },
    admin_delete_category: {
        description: "Delete a product category (/admin/product-categories/:id). Returns dry-run plan + confirm token by default; call admin_confirm to execute.",
        schema: {
            id: z.string().min(1),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            return planOrExecute({
                method: "DELETE",
                url: `/admin/product-categories/${encodeURIComponent(input.id)}`,
                headers: {},
            }, { dry_run: input.dry_run });
        },
    },
    // ---------------------------------------------------------------------------
    // UPLOAD
    // ---------------------------------------------------------------------------
    admin_upload_file_base64: {
        description: "Upload a file to Medusa using Admin Uploads API (/admin/uploads).",
        schema: {
            filename: z.string().min(1),
            contentType: z.string().min(1).describe("e.g. image/jpeg"),
            base64: z.string().min(1).describe("Base64-encoded file bytes (no data: prefix)"),
            isPrivate: z.boolean().optional().describe("Upload as private if provider supports it"),
        },
        handler: async (input) => {
            const data = await medusaUploadBase64({ filename: input.filename, contentType: input.contentType, base64: input.base64 }, { isPrivate: input.isPrivate });
            return toolText(data);
        },
    },
    // ---------------------------------------------------------------------------
    // GENERIC REQUEST (escape hatch)
    // ---------------------------------------------------------------------------
    admin_request: {
        description: "Generic Admin API request with optional confirm for writes. Allowed paths: /admin and /auth only.",
        schema: {
            method: z.enum(["GET", "POST", "PUT", "DELETE"]).describe("HTTP method"),
            path: z.string().min(1).describe("Must start with /admin or /auth"),
            query: z.record(z.any()).optional(),
            body: z.any().optional(),
            headers: z.record(z.string()).optional(),
            dry_run: z.boolean().optional(),
        },
        handler: async (input) => {
            const method = input.method;
            const path = assertAllowedAdminPath(input.path);
            if (method === "GET") {
                const data = await medusaRequest("GET", path, {
                    query: input.query,
                    headers: input.headers,
                });
                return toolText({ ok: true, data });
            }
            return planOrExecute({
                method,
                url: path,
                headers: input.headers || (input.body ? { "Content-Type": "application/json" } : {}),
                query: input.query,
                body: input.body,
            }, { dry_run: input.dry_run });
        },
    },
    // ---------------------------------------------------------------------------
    // CONFIRM
    // ---------------------------------------------------------------------------
    admin_confirm: {
        description: "Execute a previously planned write operation (confirm token).",
        schema: {
            confirm_token: z.string().min(1),
        },
        handler: async (input) => {
            const payload = verifyConfirmToken(input.confirm_token);
            const req = payload.req;
            // Final safety check
            const url = assertAllowedAdminPath(req.url);
            const data = await medusaRequest(req.method, url, {
                query: req.query,
                body: req.body,
                headers: req.headers,
            });
            return toolText({ ok: true, executed: { method: req.method, url, query: req.query }, data });
        },
    },
    // ---------------------------------------------------------------------------
    // UI action helpers (no side-effects)
    // ---------------------------------------------------------------------------
    ui_navigate: {
        description: "Return a UI action that tells the dashboard to navigate to a path.",
        schema: {
            path: z.string().min(1).describe("Example: /products, /settings, /products/create"),
        },
        handler: async (input) => toolText({ ok: true, action: "NAVIGATE", path: input.path }),
    },
    // Backward compatible alias
    ui_navigate_to: {
        description: "Alias of ui_navigate.",
        schema: {
            path: z.string().min(1),
        },
        handler: async (input) => toolText({ ok: true, action: "NAVIGATE", path: input.path }),
    },
    ui_toast: {
        description: "Return a UI action to show a toast message in the dashboard.",
        schema: {
            kind: z.enum(["success", "info", "warning", "error"]).default("info"),
            message: z.string().min(1),
        },
        handler: async (input) => toolText({ ok: true, action: "TOAST", kind: input.kind, message: input.message }),
    },
    ui_prefill_form: {
        description: "Return a UI action to prefill a form with values (client decides mapping).",
        schema: {
            form: z.string().min(1).describe("Logical form name, e.g. product_create"),
            values: z.record(z.any()).describe("Key-value map to prefill"),
        },
        handler: async (input) => toolText({ ok: true, action: "PREFILL_FORM", form: input.form, values: input.values }),
    },
};
