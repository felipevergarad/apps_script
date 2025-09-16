// api/mcp.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

async function writeToAppsScript({ fileName, content, overwrite = true, mimeType = "text/markdown" }) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error("APPS_SCRIPT_URL no configurada");

  const r = await fetch(url, {
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

export default async function handler(req, res) {
  if (req.method !== "GET") { res.status(405).send("Method Not Allowed"); return; }

  const server = new Server({ name: "drive-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

  server.setTool(
    "drive_write",
    "Guarda texto en Google Drive vía Apps Script",
    {
      type: "object",
      required: ["fileName", "content"],
      properties: {
        fileName: { type: "string" },
        content:  { type: "string" },
        overwrite:{ type: "boolean", default: true },
        mimeType: { type: "string",  default: "text/markdown" }
      }
    },
    async (args) => await writeToAppsScript(args)
  );

  const transport = new SSEServerTransport("/api/mcp"); // ruta de esta misma función
  await transport.handle(req, res, server);
}
