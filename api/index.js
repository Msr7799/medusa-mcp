export default function handler(req, res) {
  res.status(200).json({ ok: true, service: "medusa-admin-mcp", note: "Serverless wrapper active" });
}
