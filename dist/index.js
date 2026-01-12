import express from "express";
import cors from "cors";
import helmet from "helmet";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { env } from "./env.js";
import { runWithContext } from "./context.js";
import { tools } from "./tools.js";
function toolText(obj, opts = {}) {
    const text = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    return {
        content: [{ type: "text", text }],
        ...(opts.isError ? { isError: true } : {}),
    };
}
function requireMcpAuth(req) {
    if (!env.mcpApiKey)
        return;
    const header = (getHeader(req, "authorization") || "").trim();
    const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
    const direct = (getHeader(req, "x-mcp-api-key") || "").trim();
    const token = bearer || direct;
    if (!token || token !== env.mcpApiKey) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        throw err;
    }
}
function parseMedusaAuthOverride(req) {
    // Option A: full header value, e.g. "Basic <token>" or "Bearer <token>"
    const full = (getHeader(req, "x-medusa-authorization") || "").trim();
    if (full)
        return { authorizationHeader: full };
    // Option B: token + type
    const token = (getHeader(req, "x-medusa-api-key") || "").trim();
    if (!token)
        return undefined;
    const type = (getHeader(req, "x-medusa-auth-type") || "basic").trim().toLowerCase();
    return { type: type === "bearer" ? "bearer" : "basic", token };
}
function getHeader(req, name) {
    // Express: req.header(name) or req.get(name)
    try {
        if (req && typeof req.header === "function")
            return req.header(name);
        if (req && typeof req.get === "function")
            return req.get(name);
    }
    catch (e) {
        // ignore
    }
    // Fetch API style: req.headers.get(name)
    if (req && req.headers && typeof req.headers.get === "function") {
        return req.headers.get(name);
    }
    // Node IncomingMessage: req.headers is an object with lowercased keys
    if (req && req.headers && typeof req.headers === "object") {
        const key = name.toLowerCase();
        const val = req.headers[key];
        if (Array.isArray(val))
            return val.join(",");
        return typeof val === "string" ? val : undefined;
    }
    return undefined;
}
async function createServer() {
    const server = new McpServer({
        name: "medusa-admin-mcp",
        version: "0.2.0",
    });
    for (const [name, def] of Object.entries(tools)) {
        server.tool(name, def.description, def.schema, async (input) => {
            try {
                return await def.handler(input);
            }
            catch (e) {
                return toolText({ ok: false, error: { message: e?.message || String(e) } }, { isError: true });
            }
        });
    }
    const transport = new StreamableHTTPServerTransport({
        // Stateless transport (recommended for serverless / scale-to-zero)
        sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    return { server, transport };
}
// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.use(helmet());
app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || env.corsOrigins.includes("*"))
            return cb(null, true);
        if (env.corsOrigins.includes(origin))
            return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "medusa-admin-mcp", time: new Date().toISOString() });
});
// MCP endpoint: POST /mcp
// MCP endpoint: GET/POST /mcp
async function mcpHandler(req, res) {
    try {
        requireMcpAuth(req);
        const medusaAuthOverride = parseMedusaAuthOverride(req);
        await runWithContext({ medusaAuthOverride }, async () => {
            const { server, transport } = await createServer();
            await transport.handleRequest(req, res, req.body);
            // Note: for SSE (GET), we don't want to close the server immediately on response close
            // because the connection stays open. 
            // StreamableHTTPServerTransport handles cleanup internally usually? 
            // Actually, for stateless POST it closes. For SSE it stays open.
            // Let's rely on transport defaults.
            // But if we close server/transport on "close", it kills SSE?
            // "res.on('close')" fires when the connection is closed by client.
            res.on("close", () => {
                transport.close();
                server.close();
            });
        });
    }
    catch (e) {
        const status = e?.statusCode || 500;
        res.status(status).json({ ok: false, error: { message: e?.message || String(e) } });
    }
}
app.get("/mcp", mcpHandler);
app.post("/mcp", mcpHandler);
if (!process.env.VERCEL) {
    app.listen(env.port, () => {
        console.log(`[MCP] Listening on :${env.port} (POST /mcp)`);
    });
}
// Export handler for serverless platforms (e.g. Vercel)
export { mcpHandler };
// Provide a default export so platforms that expect a default function/server
// (e.g. Vercel auto-detect) won't fail with "Invalid export".
export default mcpHandler;
