import { fetch } from "undici";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Apps Script /exec que ya probaste
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// Define la tool MCP que usa tu Apps Script
function driveWriteTool() {
  return {
    name: "drive_write",
    description: "Guarda texto en la carpeta OUTPUT de Google Drive vía Apps Script",
    inputSchema: {
      type: "object",
      required: ["fileName", "content"],
      properties: {
        fileName: { type: "string", description: "Nombre del archivo, ej: plantilla_normativa.md" },
        content:  { type: "string", description: "Contenido del archivo (texto)" },
        overwrite:{ type: "boolean", description: "Sobrescribir si existe", default: true },
        mimeType: { type: "string", description: "Ej: text/markdown", default: "text/markdown" }
      }
    },
    async handler({ fileName, content, overwrite = true, mimeType = "text/markdown" }) {
      if (!APPS_SCRIPT_URL) throw new Error("APPS_SCRIPT_URL no configurada");
      // POST a Apps Script (maneja posible redirección 302->googleusercontent.com)
      const r = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, content, overwrite, mimeType })
      });
      if (r.status === 302 || r.status === 303) {
        const loc = r.headers.get("location");
        if (loc) {
          const r2 = await fetch(loc, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName, content, overwrite, mimeType })
          });
          return await r2.json();
        }
      }
      return await r.json();
    }
  };
}

// Vercel: esta ruta debe responder por SSE (GET) para MCP
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const server = new Server(
    { name: "drive-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  const tool = driveWriteTool();
  server.setTool(tool.name, tool.description, tool.inputSchema, async (args) => {
    return await tool.handler(args);
  });

  // Transport MCP sobre SSE en esta misma ruta
  const transport = new SSEServerTransport("/api/sse");
  await transport.handle(req, res, server);
}
