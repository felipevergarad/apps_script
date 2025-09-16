export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, method: "GET" });
  }

  if (req.method === "POST") {
    try {
      const appsScriptUrl = process.env.APPS_SCRIPT_URL;

      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: "Error proxying to Apps Script", details: err.message });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
