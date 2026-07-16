# مشروع SAMA بعد إعادة ربطه بـ Supabase

النسخة دي أصبحت CMS ديناميكي كامل باستخدام Supabase:

- الخدمات والباقات والأعمال والأسئلة الشائعة.
- خطوات العمل وآراء العملاء.
- الشعارات وإعدادات الـHero والإحصائيات والتواصل والسوشيال.
- نموذج تواصل يحفظ الرسائل فعلياً داخل قاعدة البيانات.
- لوحة إدارة متجاوبة مع رفع صور وملفات إلى Supabase Storage.
- تسجيل دخول عبر Supabase Auth بدون كلمة مرور مكتوبة داخل ملفات الموقع.
- سياسات Row Level Security تمنع أي زائر من تعديل المحتوى.

## التشغيل لأول مرة

### 1) أنشئ مشروع Supabase جديد

من Supabase أنشئ Project جديد وانتظر اكتمال التجهيز.

### 2) أنشئ مستخدم الأدمن

من:

`Authentication > Users > Add user`

أنشئ المستخدم التالي، أو استخدم بريداً آخر:

- Email: `admin@gmail.com`
- Password: اختَر كلمة مرور قوية خاصة بك.

لو استخدمت بريداً مختلفاً، عدّل البريد الموجود قرب نهاية ملف:

`supabase/setup.sql`

### 3) أنشئ الجداول والصلاحيات والداتا الأساسية

افتح:

`SQL Editor > New query`

وانسخ كل محتوى الملف:

`supabase/setup.sql`

ثم اضغط **Run**.

في آخر نتيجة يجب أن يظهر عدد الخدمات والباقات والأعمال، ويجب أن تكون قيمة `admins` مساوية لـ `1`.

### 4) اربط الموقع بالمشروع الجديد

من نافذة **Connect** في Supabase انسخ:

- Project URL
- Publishable key

ثم افتح ملف:

`supabase-config.js`

واستبدل القيمتين:

```js
window.SAMA_CONFIG = Object.freeze({
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabasePublishableKey: "sb_publishable_REPLACE_ME",
  storageBucket: "media",
});
```

مهم: لا تستخدم `Secret key` أو `service_role` داخل الموقع.

### 5) افتح لوحة التحكم

بعد رفع الملفات على الاستضافة افتح:

`https://your-domain.com/admin/`

وسجّل الدخول بالبريد وكلمة المرور اللذين أنشأتهما في Supabase Auth.

## تشغيل محلي للاختبار

من داخل مجلد المشروع شغّل أي static server، مثال:

```bash
python -m http.server 5500
```

ثم افتح:

- الموقع: `http://localhost:5500/`
- لوحة التحكم: `http://localhost:5500/admin/`

يفضل عدم فتح `index.html` مباشرة بنظام `file://` لأن بعض المتصفحات تقيد الطلبات الخارجية.

## أهم الملفات

- `index.html`: الموقع الرئيسي.
- `sama.js`: تحميل المحتوى وإرسال نموذج التواصل.
- `supabase-config.js`: رابط المشروع وPublishable key.
- `admin/`: لوحة التحكم الجديدة.
- `supabase/setup.sql`: الجداول، الداتا، RLS، Storage، وربط الأدمن.
