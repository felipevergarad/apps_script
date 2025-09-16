export default async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({ ok: true, method: "GET" });
  } else if (req.method === "POST") {
    const body = req.body || {};
    res.status(200).json({ status: "ok", received: body });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
