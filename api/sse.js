// api/sse.js
export default async function handler(req, res) {
  // 1. Validar la API Key
  const clientKey = req.headers["x-api-key"];
  if (clientKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  // 2. Manejo de métodos
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, method: "GET" });
  }

  if (req.method === "POST") {
    try {
      const body = req.body;

      // Aquí hacemos proxy a tu Apps Script
      const response = await fetch(process.env.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      return res.status(200).json(result);
    } catch (err) {
      return res
        .status(500)
        .json({ error: "Error proxying to Apps Script", details: String(err) });
    }
  }

  // 3. Métodos no permitidos
  res.status(405).json({ error: "Method not allowed" });
}
