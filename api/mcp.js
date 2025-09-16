// api/mcp.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

/** Llama a tu Apps Script para escribir en Drive */
async function writeToAppsScript({ fileName, content, overwrite = true, mimeType = "text/markdown" }) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error("APPS_SCRIPT_URL no configurada");

  // Nota: NO usamos API_KEY aquí porque el conector de ChatGPT no manda headers personalizados.
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, content, overwrite, mimeType })
  });

  // Apps Script a veces redirige a googleusercontent
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

export default async function handler(req, res) {
  // MCP debe ser GET y mantener una conexión SSE abierta
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Servidor MCP con una tool: drive_write
  const server = new Server(
    { name: "drive-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setTool(
    "drive_write",
    "Guarda texto en Google Drive vía Apps Script",
    {
      type: "object",
      required: ["fileName", "content"],
      properties: {
        fileName: { type: "string", description: "Nombre de archivo, ej: plantilla.md" },
        content:  { type: "string", description: "Contenido completo a guardar" },
        overwrite:{ type: "boolean", default: true },
        mimeType: { type: "string",  default: "text/markdown" }
      }
    },
    async (args) => await writeToAppsScript(args)
  );

  // Transport SSE en la misma ruta /api/mcp
  const transport = new SSEServerTransport("/api/mcp");
  await transport.handle(req, res, server);
}
