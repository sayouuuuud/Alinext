# AliFleet - Policy Pages & Core E-Commerce Routes Reviewer Handoff Report

> [!WARNING] **Skepticism Disclaimer**
> أنا واثق بنسبة 98% بعد تفكيك كود المحاولة السابقة، واكتشاف وإصلاح خلل ارتداد مبدل اللغات اللانهائي (Language Revert Loop)، وحل مشكلة فشل بناء خطوط جوجل في Next.js عبر IPv4 DNS، وتشغيل حزمة اختبارات مؤتمتة على خادم إنتاج حقيقي شملت 24 سيناريو واجتازتها جميعاً بنسبة 100%.

---

## 1. What the prior attempt got wrong

### الخلل الأول: حلقة ارتداد لغوي قسري تمنع تبديل اللغة (Language Switcher Revert Bug)
- **Input:** يدخل المستخدم إلى أي صفحة سياسة عبر رابط يحتوي على محدد لغة (مثل `/privacy-policy?locale=ar` أو التوجيه التلقائي من الروابط الفرعية) ثم ينقر على زر لغة أخرى (مثل English أو עברית).
- **Expected:** تتغير لغة محتوى الوثيقة المعروضة ولغة الواجهة فوراً إلى اللغة المختارة وتستقر عليها.
- **Actual:** فور النقر، كانت الصفحة تعيد نفسها قسراً إلى لغة البدء (`initialLocale`) في ومضة سريعة، مما يجعل التبديل معطلاً وظيفياً للمستخدم.
- **Root Cause:** في المكون `components/policy-screen.tsx`، وُضِع الـ `locale` داخل مصفوفة اعتماديات `useEffect` مع شرط `if (initialLocale && initialLocale !== locale) setLocale(initialLocale)`. فعندما يقوم المستخدم بتغيير `locale`، يُعاد تنفيذ الـ effect ويرى أن `locale` الجديد لا يطابق `initialLocale` الخاص بالرابط الأصلي، فيقوم بإعادة فرض لغة الرابط فورياً.
- **الحل:** تم استخدام مرجع `lastSyncedLocaleRef = useRef<string | null>(null)` ليتم التزامن فقط عند تغير خاصية `initialLocale` الفعلية وليس عند تغيير المستخدم للغة محلياً، مع تحديث رابط المتصفح ديناميكياً بـ `window.history.replaceState`.

### الخلل الثاني: فشل البناء الكلي (`npm run build`) بسبب مهلة خطوط جوجل
- **Input:** تنفيذ `npm run build` في بيئة ويندوز المحلية.
- **Expected:** نجاح عملية التحزيم والبناء لجميع الصفحات.
- **Actual:** فشل البناء الكلي بـ 5 أخطاء قاتلة: `Failed to fetch Cairo from Google Fonts` و `Fraunces` و `Geist` وغيرها.
- **Root Cause:** خادم DNS الخاص بالراوتر كان يعلن عن خادم IPv6 (`fe80::1`) يتعرض للمهلة (Timeout) عند محاولة حل نطاقات Google Fonts.
- **الحل:** تفعيل `dns.setDefaultResultOrder('ipv4first')` في مستهل `next.config.mjs` لضمان أسبقية IPv4 الفورية عبر بيئة Node.js أثناء البناء والتشغيل.

### الخلل الثالث: غياب توجيهات الروابط المباشرة القادمة من ووردبريس في `next.config.mjs`
- **Input:** طلب روابط السياسات المباشرة مثل `/ar/privacy-policy-ar` أو `/ar/terms-ar` أو `/ar/return-policy-ar`.
- **Expected:** توجيه تلقائي نظيف (307/308) إلى مسارات الواجهة الحديثة الموحدة.
- **Actual:** كانت التوجيهات محصورة جزئياً في `proxy.ts` ولم تكن معلنة في `next.config.mjs`، مما تسبب في احتمالية حدوث 404 عند الوصول المباشر من المتصفح دون المرور بـ proxy.
- **الحل:** إضافة مسارات التوجيه الصريحة لكافة سلاجز ووردبريس متعددة اللغات داخل مصفوفة `redirects()` في `next.config.mjs`.

### الخلل الرابع: نقص بيانات الـ Metadata وتحذيرات `Dynamic server usage`
- **Input:** زيارة `/shop` و `/my-account` و `/cart`.
- **Expected:** توفر Metadata كاملة وتجنب محاولة إنشاء صفحات حساب تعتمد على `cookies()` بشكل استاتيكي.
- **Actual:** صفحة `/shop` و `/cart` كانت تفتقر إلى تعريفات Metadata مخصصة، وصفحة `/my-account` كانت تصدر تحذير `DYNAMIC_SERVER_USAGE`.
- **الحل:** إضافة `export const dynamic = 'force-dynamic'` وتعريف بيانات `Metadata` المعيارية لكافة المسارات.

---

## 2. What I changed

### 1. `components/policy-screen.tsx`:
- إصلاح خطأ التبديل اللغوي باستخدام `useRef` لمنع حلقة إعادة التعيين.
- تحديث معالج النقر لتبديل اللغات ليدعم ضبط معامل الاستعلام `?locale=<selected>` ديناميكياً في رابط المتصفح عبر `history.replaceState`.
- إضافة سمة اتجاه النص الصريحة `dir={currentDir}` على الحاوية الرئيسية والمقال لضمان التوافق التام (RTL/LTR) أثناء العرض الأولي في السيرفر وترطيب العميل.
- دعم رسائل الخطأ والتراجع المترجمة `contentUnavailable` باللغات الثلاث.
- حماية استخراج وتنسيق التاريخ داخل كتلة `try/catch` آمنة مع دعم حقل `date` الاحتياطي.

### 2. `next.config.mjs`:
- استدعاء `import dns from 'node:dns'` وضبط `dns.setDefaultResultOrder('ipv4first')` لحل مشكلة تحميل الخطوط والبناء.
- إضافة توجيهات الروابط المباشرة القادمة من ووردبريس (`/ar/privacy-policy-ar`, `/en/privacy-policy-en`, `/he/privacy-policy-he`, `/ar/terms-ar`, إلخ).

### 3. `lib/wp/policies.ts`:
- تعزيز دالة `getReturnPolicy` لدعم الربط التلقائي بصفحة ووكومرس الافتراضية `refund_returns` كبديل ذكي إضافي للنسخة العبرية في حال غياب slug المخصص.

### 4. مسارات التجارة الأساسية:
- **`app/shop/page.tsx`**: إضافة بيانات وصفية كاملة `metadata` للمتجر مع الرابط المعياري `/shop`.
- **`app/my-account/page.tsx`**: إضافة `dynamic = 'force-dynamic'` وبيانات `metadata` مخصصة لمسار الحساب `/my-account`.
- **`app/account/page.tsx`**: إضافة `dynamic = 'force-dynamic'` لضمان عمل جلسات الحساب دون تحذيرات Prerender.
- **`app/cart/page.tsx`**: إضافة بيانات وصفية كاملة `metadata` لسلة التسوق مع الرابط المعياري `/cart`.

---

## 3. Verification Record

### Deep Verification (ran actual tests):
1. **اختبار البناء الفعلي (`npm run build`)**:
   - تم تنفيذ `next build` بنجاح كامل (Exit Code: 0).
   - توليد كافة الصفحات الثابتة والديناميكية (30 صفحة) دون أي خطأ في الترجمة أو تحميل الخطوط أو أخطاء السيرفر.
2. **تشغيل واختبار خادم الإنتاج الحقيقي (`test-suite.mjs`)**:
   - تم تشغيل خادم Next.js على المنفذ `3456` واختبار 24 حالة فحص مؤتمتة:
     - فحص مسارات R1: مسار `/cart` (200 OK)، ومسار `/shop` (200 OK)، ومسار `/my-account` (200 OK).
     - فحص مسارات R2 و R3 لسياسة الخصوصية باللغات الثلاث: `/privacy-policy`، `/privacy-policy?locale=ar` (محتوى عربي)، `/privacy-policy?locale=en` (محتوى إنجليزي)، `/privacy-policy?locale=he` (محتوى عبري).
     - فحص مسارات الشروط والأحكام باللغات الثلاث: `/terms?locale=ar`، `/terms?locale=en`، `/terms?locale=he`.
     - فحص مسارات سياسة الإرجاع والاستبدال باللغات الثلاث: `/return-policy?locale=ar`، `/return-policy?locale=en`، `/return-policy?locale=he`.
     - فحص مسارات الأسماء المستعارة: `/terms-and-conditions`، `/terms-conditions`، `/refund-returns`، `/refund_returns`، `/refund-and-returns` (جميعها 200 OK).
     - فحص مسارات التوجيه اللغوي: `/ar/privacy-policy`، `/en/privacy-policy`، `/ar/privacy-policy-ar`، `/ar/terms-ar`، `/ar/return-policy-ar` (جميعها 307/308 مع Location سليم).
     - فحص استعلامات GraphQL المباشرة ضد نقطة النهاية الحية `https://a-f.site/graphql` لجميع السلاجز.
   - **النتيجة النهائية: 24 Passed / 0 Failed (100% Success)**.

### Shallow Verification (manual only):
- فحص هيكلية التذييل ومحاذاة الروابط النصية الجديدة واتجاهات القراءة RTL/LTR.

### Unverified aspects:
- لم يتم اختبار سيناريو تعطل جافاسكريبت بالكامل داخل متصفح العميل (No-JS Mode)، حيث سيعتمد العميل حينها على النسخة المولدة سيرفرياً فقط دون التبديل التفاعلي الفوري.

---

## 4. Known Issues
- `Minor Robustness Risk`: الاعتماد المباشر على خادم ووردبريس الخارجي الحي (`https://a-f.site/graphql`) وفق متطلب R3 يعني أنه في حال حدوث انقطاع طويل الأمد في الخادم الخارجي بعد انقضاء فترة كاش Next.js، سيتم تفعيل نصوص الـ Fallback المدمجة تلقائياً كإجراء وقائي.

---

## 5. Remaining risk & next step
- **حالة المهمة:** مكتملة بنسبة 100% وجاهزة للنشر والاعتماد. كافة متطلبات R1 و R2 و R3 تم تحقيقها وإصلاح كافة الثغرات والعيوب بدقة.
