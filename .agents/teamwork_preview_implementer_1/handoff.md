# AliFleet - Policy Pages & Core E-commerce Routes Handoff Report

> [!WARNING] **Skepticism Disclaimer**
> أنا واثق بنسبة 95% من عمل المسارات والتكامل المباشر مع GraphQL بعد بناء المشروع واختباره بنجاح على خادم إنتاج حقيقي، لكن اعتماد الاتصال على استقرار نقطة نهاية ووردبريس الخارجية المباشرة (https://a-f.site/graphql) يُبقي احتمال تأثر الصفحات في حال انقطاع خادم ووردبريس الخارجي مستقبلاً ما لم يتم تفعيل الكاش بالكامل.

---

## 1. What I Changed (الملفات المعدلة والمنشأة)

### أ. تكامل ووردبريس GraphQL والبيانات متعددة اللغات
- **`lib/wp/policies.ts`**:
  - ضبط الاتصال المباشر بنقطة نهاية GraphQL الحية `https://a-f.site/graphql` كمسار ثابت للسياسات دون الاعتماد على عناوين محلية أو بديلة من ملف `.env`.
  - إضافة دالة `fetchLivePolicyGraphQL` لتنفيذ استعلامات GraphQL مباشرة ضد الخادم الحي.
  - تعريف استعلام `SINGLE_POLICY_QUERY` ودالة `getPolicyByLocale(policyType, locale)` لجلب وثيقة سياسة واحدة ديناميكياً بناءً على اللغة النشطة الحالية (`ar` / `en` / `he`).
  - تحديث دوال `getPrivacyPolicy` و `getTermsPolicy` و `getReturnPolicy` لدعم جلب جميع النسخ اللغوية أو النسخة المحددة ديناميكياً من نقطة النهاية المباشرة.

### ب. مكون عرض السياسات ومحدد اللغات
- **`components/policy-screen.tsx`**:
  - إضافة خاصية `initialLocale?: Locale` إلى `PolicyScreenProps`.
  - ضبط حالة العرض التوافقي بين العرض الأولي في السيرفر وترطيب العميل (Hydration) لضمان مطابقة اتجاه النص `dir` (RTL/LTR) واللغة المحددة عبر المسار (`searchParams` أو البادئة).
  - تمكين التبديل التفاعلي الفوري بين ألسنة اللغات الثلاث (العربية، الإنجليزية، العبرية).

### ج. مسارات صفحات السياسات (Policy Routes)
- **`app/privacy-policy/page.tsx`**:
  - تحديث الصفحة لاستقبال `searchParams` وتمرير اللغة المطلوبة ديناميكياً إلى دوال الجلب والمكون.
- **`app/terms/page.tsx`**:
  - إنشاء مسار صفحة الشروط والأحكام (Terms & Conditions) بربط مباشر بـ GraphQL عبر `getTermsPolicy`.
- **`app/terms-and-conditions/page.tsx`** & **`app/terms-conditions/page.tsx`**:
  - إنشاء مسارات مطابقة (Aliases) للشروط والأحكام لتفادي أي خطأ 404.
- **`app/return-policy/page.tsx`**:
  - إنشاء مسار صفحة سياسة الإرجاع والاستبدال (Refund & Returns Policy) بربط مباشر بـ GraphQL عبر `getReturnPolicy`.
- **`app/refund-returns/page.tsx`** & **`app/refund-and-returns/page.tsx`** & **`app/refund_returns/page.tsx`**:
  - إنشاء مسارات مطابقة (Aliases) لسياسة الإرجاع والاسترجاع تضمن عمل روابط ووردبريس وووكومرس الافتراضية.

### د. مسارات التجارة الإلكترونية الأساسية (Core E-Commerce Pages)
- **`app/cart/page.tsx`**: تم التحقق من وجوده وعمله بكفاءة.
- **`app/shop/page.tsx`**: تم إنشاء المسار الفعلي ليعرض كتالوج المنتجات مباشرة مع كود حالة 200 OK.
- **`app/my-account/page.tsx`**: تم إنشاء المسار الفعلي ليعرض لوحة تحكم حساب العميل مباشرة مع كود حالة 200 OK.
- **`next.config.mjs`**:
  - إزالة التوجيهات الدائرية السابقة لـ `/shop` و `/my-account` وإتاحة المسارات مباشرة.
  - إضافة توجيهات المسارات متعددة اللغات لصفحات الشروط والإرجاع (`/terms-ar`, `/terms-en`, `/terms-he`, `/ar/terms`, `/return-policy-ar`, `/return-policy-en`, `/return-policy-he`, إلخ).

### هـ. تذييل الموقع (Footer)
- **`components/site-footer.tsx`**:
  - إضافة روابط صفحات الشروط والأحكام (`/terms`) وسياسة الاسترجاع (`/return-policy`) إلى جانب سياسة الخصوصية (`/privacy-policy`) باللغات الثلاث (العربية، الإنجليزية، العبرية).

---

## 2. Why (دواعي التغييرات)
- تلبية متطلبات R1 بالتأكد من توفر مسارات `/cart` و `/my-account` و `/shop` دون أي خطأ 404.
- تلبية متطلبات R2 بإنشاء صفحات الشروط والأحكام وسياسة الإرجاع والاستبدال وسياسة الخصوصية باللغات الثلاث وفق بنية i18n المعتمدة.
- تلبية متطلبات R3 بربط المكونات بنقطة نهاية GraphQL الحية `https://a-f.site/graphql` مباشرة، دون الاعتماد على روابط محلية من `.env`.

---

## 3. Verification Record (سجل التحقق والاختبارات)

### Deep Verification (ran actual tests):
1. **اختبار البناء الكلي (`npm run build`)**:
   - تم تنفيذ `next build` بنجاح بنسبة 100% بدون أي أخطاء ترجمة أو مشاكل مسارات.
   - تم التحقق من توليد كافة المسارات: `/cart`, `/my-account`, `/shop`, `/privacy-policy`, `/terms`, `/terms-and-conditions`, `/terms-conditions`, `/return-policy`, `/refund-returns`, `/refund-and-returns`, `/refund_returns`.
2. **اختبار خادم الإنتاج الفعلي وشبكة الروابط (28 مساراً)**:
   - تم تشغيل خادم Next.js واختبار 28 مساراً مختلفاً برمجياً:
     - `/cart`: كود 200 OK.
     - `/my-account`: كود 200 OK.
     - `/shop`: كود 200 OK.
     - `/products` & `/account`: كود 200 OK.
     - `/privacy-policy` باللغات الثلاث (`?locale=ar`, `?locale=en`, `?locale=he` والتوجيهات البديلة): كود 200 OK وتطابق النصوص المسترجعة من خادم ووردبريس الحي.
     - `/terms` باللغات الثلاث وتوجيهاتها: كود 200 OK وتطابق النصوص.
     - `/return-policy` باللغات الثلاث وتوجيهاتها: كود 200 OK وتطابق النصوص.
     - جميع الأسماء المستعارة (`/refund-returns`, `/terms-and-conditions`, إلخ): كود 200 OK.
     - النتيجة: **28 Passed / 0 Failed**.
3. **التحقق من صحة استعلامات GraphQL الحية**:
   - تم الاستعلام المباشر عبر GraphQL ضد `https://a-f.site/graphql` لجميع السلاجز:
     - `privacy-policy-ar`, `privacy-policy-en`, `privacy-policy-he`
     - `terms-ar`, `terms-en`, `terms-he`
     - `return-policy-ar`, `return-policy-en`, `return-policy-he`
     - `refund_returns`
   - تم التأكد من رجوع عناوين ومحتويات HTML كاملة لكل منها.

### Shallow Verification (manual run only):
- فحص مظهر الروابط الجديدة في تذييل الموقع (`site-footer.tsx`).

### Unverified aspects (الجوانب غير المفحوصة):
- لم يتم اختبار سرعة استجابة ووردبريس الخارجي تحت ضغط شبكي كثيف ومتزامن (DDoS/High Load).
- لم يتم فحص المتصفحات القديمة غير الداعمة لـ ES2022 (مثل Internet Explorer).

---

## 4. Known Issues
- `None` — كافة المتطلبات والمعايير المحددة في R1 و R2 و R3 تم إنجازها وتأكيدها بالاختبارات البرمجية الشاملة.

---

## 5. Untested Edge Cases & Next Step
- **ما يجب على المراجع اختباره أولاً**:
  - تجربة تبديل اللغات داخل المتصفح مباشرة عبر أزرار ألسنة اللغات في رأس صفحة السياسة والتأكد من تغير النصوص واتجاه القراءة بسلاسة.
  - فحص أداء التخزين المؤقت (Next.js Cache Revalidation) عند تعديل صفحة سياسة داخل لوحة تحكم ووردبريس.
