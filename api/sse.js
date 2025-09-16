export default async function handler(req, res) {
  const targetUrl = process.env.APPS_SCRIPT_URL;

  if (!targetUrl) {
    return res.status(500).json({ 
      error: "APPS_SCRIPT_URL no está configurada en Vercel"
    });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json({ ok: true, method: "GET" });
    }

    if (req.method === "POST") {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      error: "Error proxying to Apps Script", 
      details: err.message 
    });
  }
}
