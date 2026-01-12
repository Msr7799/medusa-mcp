# Medusa MCP Server (Admin) — سيرفر Tools للـ Agent + Dashboard

> هذا المشروع يوفّر **MCP Server** يعرّض Tools تتعامل مع **Medusa Admin API**.
> الهدف: تخلي الـ Agent ينفّذ عمليات على Medusa (قراءة/إدارة منتجات/كلكشن/تصنيفات...) بشكل **مؤمَّن** مع خيار **تأكيد قبل التعديل**.

---

## الفكرة باختصار
- **Read Tools**: تنفّذ مباشرة (list/get).
- **Write Tools**: افتراضيًا تعمل **Dry-Run** وترجع `confirm_token`، وبعدين تنفّذ فعليًا فقط عبر `admin_confirm`.
- مصادقة Medusa تدعم:
  - **Secret API Key** من Medusa Dashboard (Authorization: Basic <token>)
  - أو **Bearer JWT**

---

## المتطلبات
- Node.js 20+
- Medusa Backend شغال + Admin API
- Secret API Key أو JWT

---

## التشغيل محليًا
```bash
cp .env.example .env
pnpm install
pnpm run build
pnpm start
```

السيرفر بيشتغل على:
- Health: `GET /health`
- MCP: `POST /mcp`

---

## إعداد المصادقة مع Medusa (الأهم)
أنت عندك خيارين (مثل ما طلبت):

### الخيار A: تحط Secret API Key في `.env` (أسهل)
في `.env`:
- `MEDUSA_BASE_URL=https://YOUR_MEDUSA_BACKEND`
- `MEDUSA_AUTH_TYPE=basic`
- `MEDUSA_SECRET_API_KEY=YOUR_SECRET_API_KEY`

### الخيار B: تمرّر Secret API Key من الـ Agent عبر Headers (JSON config)
بدون ما تخزّنه في السيرفر، تقدر تبعثه للـ MCP Server per-request عبر Headers:
- `x-medusa-api-key: <SECRET_API_KEY>`
- `x-medusa-auth-type: basic` (اختياري)

أو بديل واحد (لو تبي تتحكم بالهيدر كامل):
- `x-medusa-authorization: Basic <token>`

> ملاحظة: هذا مناسب لما الـ Agent يكون Server-side (مو متصفح). لا ترسل مفاتيح Admin للـ client-side.

---

## حماية سيرفر MCP نفسه (مهم إذا راح يكون Public)
لو بتستضيفه على الإنترنت (Vercel/Render/Fly/Koyeb...)، فعّل حماية endpoint:

في `.env`:
- `MCP_API_KEY=LONG_RANDOM_VALUE`

وبكل اتصال للـ MCP حط واحد من التالي:
- `Authorization: Bearer <MCP_API_KEY>`
أو
- `x-mcp-api-key: <MCP_API_KEY>`

---

## مثال JSON config للـ Agent
هذا مثال عام (الفكرة: URL + headers). عدّل حسب العميل اللي تستخدمه:
```json
{
  "mcpServers": {
    "medusa-admin": {
      "url": "https://YOUR_HOST/mcp",
      "headers": {
        "x-mcp-api-key": "YOUR_MCP_API_KEY",
        "x-medusa-api-key": "YOUR_MEDUSA_SECRET_API_KEY",
        "x-medusa-auth-type": "basic"
      }
    }
  }
}
```

---

## الأدوات (Tools) المتوفرة حاليًا
### أدوات معلومات/مساعدة
- `server_info`

### منتجات
- `admin_list_products`
- `admin_get_product`
- `admin_create_product` (يتطلب confirm افتراضيًا)
- `admin_update_product` (يتطلب confirm افتراضيًا)
- `admin_delete_product` (يتطلب confirm افتراضيًا)
- `admin_set_product_collection` (يتطلب confirm افتراضيًا)

### كلكشن (Product Collections)
- `admin_list_collections`
- `admin_get_collection`
- `admin_create_collection` (يتطلب confirm افتراضيًا)
- `admin_update_collection` (يتطلب confirm افتراضيًا)
- `admin_delete_collection` (يتطلب confirm افتراضيًا)

### تصنيفات / إعدادات عامة
- `admin_list_categories`
- `admin_create_category` (يتطلب confirm افتراضيًا)
- `admin_update_category` (يتطلب confirm افتراضيًا)
- `admin_delete_category` (يتطلب confirm افتراضيًا)
- `admin_list_regions`
- `admin_list_sales_channels`

### رفع ملفات
- `admin_upload_file_base64`

### أداة عامة لأي endpoint
- `admin_request` (GET/POST/PUT/DELETE على /admin و /auth فقط، مع confirm للكتابة)

### أدوات للداشبورد (UI Actions)
- `ui_navigate` / `ui_navigate_to`
- `ui_toast`
- `ui_prefill_form`

---

## النشر على Vercel (ملاحظات صريحة)
- هذا المشروع مبني كـ **Express server**. Vercel serverless يحتاج تحويله إلى Route/Function.
- Vercel عندها حد أقصى لحجم request body (~4.5MB)، فرفع `admin_upload_file_base64` ممكن يتعطل للملفات الكبيرة.

إذا هدفك CRUD وإدارة خفيفة: Vercel تمشي.
إذا هدفك uploads كبيرة أو تحكم أكثر: استضافة عادية (Render/Fly/Koyeb) أريح.

### ملفات البيئة (`.env.example` و`.env.vercel`)

- أضفت ملفين مثالين في المستودع:
  - `.env.example` — نسخة للاستخدام المحلي، انسخها إلى `.env` وعرّف القيم.
  - `.env.vercel` — مرجع سريع لقيم البيئة التي يجب إضافتها في لوحة Vercel (لا ترفع أسرار حقيقية للمستودع).

- المتغيرات الأساسية التي يجب ضبطها في Vercel:
  - `MEDUSA_BASE_URL` — رابط Medusa backend (بدون `/` في النهاية)
  - `MEDUSA_AUTH_TYPE` — `basic` أو `bearer`
  - `MEDUSA_SECRET_API_KEY` — المفتاح السري أو الـ JWT
  - `MCP_API_KEY` — مفتاح لطلب `/mcp` من الـ Agent
  - `JSON_BODY_LIMIT` — `4mb` أو `10mb` (Vercel له حد تقريبي ~4.5MB)
  - `REQUIRE_CONFIRM`, `CONFIRM_SECRET`, `CONFIRM_TTL_SECONDS`

### خطوات سريعة للنشر على Vercel

1. ادخل إلى لوحة Vercel → Import Project → اختر المستودع.
2. في إعدادات المشروع (Settings → Environment Variables) أضف المتغيرات أعلاه كـ Environment Variables (Production/Preview/Development حسب الحاجة).
3. في Build Command ضع:

```
pnpm run build
```

4. Vercel سيبني المشروع وينشّئ الدالة `api/mcp.js` تلقائياً (تأكد أن `dist/index.js` يحتوي `export { mcpHandler }` بعد `pnpm run build`).
5. بعد النشر، اختبر:

```
GET https://<your-deployment>/health
POST https://<your-deployment>/mcp
```

ملاحظة: لو تحتاج رفع ملفات كبيرة أو عمليات خلفية طويلة، أنقل الجزء الذي يحتاج ذلك إلى خدمة منفصلة (Koyeb/Render) وادمج مع Vercel للواجهة.

---

## ملاحظات أمنية (بدون تجميل)
- **لا** ترسل Secret API Key للـ browser.
- فعّل `MCP_API_KEY` إذا السيرفر public.
- خلي `REQUIRE_CONFIRM=true` في الإنتاج.
- حدّد `CORS_ORIGINS` على دومين الداشبورد فقط.
