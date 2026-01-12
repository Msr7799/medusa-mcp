import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { env } from "./env.js";
import { tools } from "./tools.js";

// ---------- MCP Server ----------

async function createServer() {
  const server = new McpServer({
    name: "medusa-admin-mcp",
    version: "0.1.0",
  });

  // Register all tools from tools.js
  for (const [name, config] of Object.entries(tools)) {
    server.tool(
      name,
      config.description,
      config.schema,
      async (args: any, extra: any) => {
        const result = await config.handler(args, extra);
        // Ensure result matches MCP expectation. Explicitly cast type to "text" to satisfy TS.
        if (result && typeof result === "object" && "content" in result) {
          return result as any;
        }
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
    );
  }

  const transport = new StreamableHTTPServerTransport({
    // Transport options
    sessionIdGenerator: undefined
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
      if (!origin || env.allowedOrigins.includes("*")) return cb(null, true);
      if (env.allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "medusa-admin-mcp", time: new Date().toISOString() });
});

// MCP endpoint (Streamable HTTP). Convention: POST /mcp for messages, GET /mcp for SSE
app.all("/mcp", async (req: Request, res: Response) => {
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
  app.listen(env.port, () => {
    console.log(`[MCP] Listening on :${env.port} (POST /mcp)`);
  });
}

// For Vercel/production startup if entry point is different, 
// usually we leave it as is if we use a separate entry point.
// But if we use 'npm start' on a VPS, we want it to listen.
// Let's refine:
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(env.port, () => {
    console.log(`[MCP] Listening on :${env.port} (POST /mcp)`);
  });
}

export default app;
