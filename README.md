# Medusa Admin MCP Server (Streamable HTTP) — Koyeb-ready

هذا سيرفر MCP مستقل يعرّف Tools للتعامل مع **Medusa v2 Admin API** بشكل آمن:
- **Read tools** تنفّذ مباشرة (list/get).
- **Write tools** (create/update/delete/upload) تعمل **Dry‑run + Confirm** لتفادي أي تعديل بالغلط.

## 1) المتطلبات
- Node.js 20+
- Secret API Key أو JWT للـ Admin API

> في Medusa v2: تقدر تستخدم Secret API Key للوصول لـ Admin APIs، أو JWT عبر Bearer. راجع توثيق Medusa.  
> أدوات النشر على Koyeb عادة تستخدم Streamable HTTP (`/mcp`).

## 2) التشغيل محليًا
```bash
cp .env.example .env
# عدّل القيم
npm install
npm run build
npm start
```

## 3) اختبار عبر MCP Inspector
```bash
npx @modelcontextprotocol/inspector
```
ثم أدخل رابط السيرفر:
`http://localhost:3000/mcp`

## 4) النشر على Koyeb
- ارفع هذا المشروع كـ repo (GitHub مثلاً)
- اعمل Deploy كـ Web Service
- حط Environment Variables مثل `.env.example`
- المسار: `/mcp`

## 5) إعداد العميل (Claude/Cursor/…)
مثال (عميل يستخدم mcp-remote):
```json
{
  "mcpServers": {
    "MedusaAdmin": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://YOUR_MCP_SERVICE.koyeb.app/mcp"]
    }
  }
}
```

## ملاحظات أمنية
- لا تحط `MEDUSA_AUTH_TOKEN` في الواجهة (Client-side) نهائيًا.
- خل `REQUIRE_CONFIRM=true` في الإنتاج.
- حط `CORS_ORIGINS` على دومين الداشبورد بس.
