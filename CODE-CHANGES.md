# تعديلات الكود في جلسة المراجعة

**التاريخ:** 2 سبتمبر 2026
**المستودع:** https://github.com/sayouuuuud/alifleet

---

## ملخص سريع

| النوع | العدد | محتاج رفع على GitHub؟ |
|---|---|---|
| تعديل كود فعلي | **ملف واحد بس** | ✅ أيوه |
| تعديل بيانات على السيرفر (ACF) | 166 عنصر | ❌ لأ — دي داتا مش كود، واتطبقت خلاص |

> **مهم:** التعديل الوحيد اللي محتاج يترفع على GitHub هو ملف واحد بس: `components/fleet-showcase.tsx`.
> كل باقي الشغل كان تعديل بيانات مباشرة على قاعدة بيانات الووردبريس عن طريق ACF — دي **اتطبقت واتأكدت فعليًا** ومش ليها أي علاقة بالكود.

---

## 1) تعديل الكود — `components/fleet-showcase.tsx`

### المشكلة
في قسم "الأسطول" (Fleet Showcase) في الصفحة الرئيسية، صور الـ fallback كانت مربوطة بالعناوين **بإزاحة خانة واحدة** — يعني كل بطاقة بتوري صورة مركبة مختلفة عن اللي مكتوب فيها:

| البطاقة | كانت بتوري ❌ | المفروض توري ✅ |
|---|---|---|
| `truckTitle` — משאיות כבדות (شاحنات ثقيلة) | `fleet-van.png` (فان مرسيدس) | `fleet-truck.png` (شاحنة DAF) |
| `vanTitle` — ואנים ניהוליים (فانات تنفيذية) | `fleet-suv.png` (أودي Q8) | `fleet-van.png` (فان مرسيدس) |
| `luxuryTitle` — רכבי יוקרה (سيارات فاخرة) | `fleet-truck.png` (شاحنة DAF) | `fleet-suv.png` (أودي Q8) |

**ملحوظة:** أسماء ملفات الصور في `public/images/` كانت **صحيحة أصلاً** — المشكلة كانت في الكود اللي بيربطهم، مش في الصور نفسها. مفيش أي ملف صورة اتغير أو اتعاد تسميته.

### سبب إن الـ fallback هو اللي ظاهر
فحصت الـ ACF على صفحة الهوم في الووردبريس (post ID **756**) ولقيت `fleet_showcase_section` **فاضي بالكامل** — كل حقول `fleet_vehicle_1` لـ `fleet_vehicle_4` قيمتها EMPTY. فالموقع بيقع على صور الـ fallback المبرمجة في الكود، وهي اللي كانت متبدّلة.

### التعديل بالظبط
3 أسطر بس، في الـ array بتاع `vehicles` جوه `export function FleetShowcase`:

```diff
--- a/components/fleet-showcase.tsx
+++ b/components/fleet-showcase.tsx
@@ -20,21 +20,21 @@ export function FleetShowcase({ wpImages }: { wpImages?: PageImages }) {
       title: t.home.fleet.truckTitle,
       tag: t.home.fleet.truckTag,
       description: t.home.fleet.truckDesc,
-      image: wpImages?.fleetVehicle1 || '/images/fleet-van.png',
+      image: wpImages?.fleetVehicle1 || '/images/fleet-truck.png',
       alt: t.home.fleet.truckTitle,
     },
     {
       title: t.home.fleet.vanTitle,
       tag: t.home.fleet.vanTag,
       description: t.home.fleet.vanDesc,
-      image: wpImages?.fleetVehicle2 || '/images/fleet-suv.png',
+      image: wpImages?.fleetVehicle2 || '/images/fleet-van.png',
       alt: t.home.fleet.vanTitle,
     },
     {
       title: t.home.fleet.luxuryTitle,
       tag: t.home.fleet.luxuryTag,
       description: t.home.fleet.luxuryDesc,
-      image: wpImages?.fleetVehicle3 || '/images/fleet-truck.png',
+      image: wpImages?.fleetVehicle3 || '/images/fleet-suv.png',
       alt: t.home.fleet.luxuryTitle,
     },
   ]
```

**الأسطر المتأثرة:** 23 و 30 و 37

### إزاي تطبّقه

**الطريقة الأسهل — تعديل يدوي:** افتح `components/fleet-showcase.tsx` وغيّر اسم ملف الصورة في التلات أسطر دول زي الجدول فوق.

**أو بالـ patch file** (موجود جنب الملف ده باسم `fleet-showcase-fix.patch`):

```bash
git apply fleet-showcase-fix.patch
```

---

## 2) تعديلات البيانات على السيرفر (ACF) — اتطبقت خلاص، مش محتاجة GitHub

دي كلها كانت `update_field()` على قاعدة بيانات الووردبريس عن طريق `wp-agent`. **مفيش أي ملف كود اتغير فيها**، واتأكدت من نجاحها بقراءة مستقلة بعد التنفيذ.

### أ) صفحة استيراد السيارات — post ID 4273
حقل `import_steps`:
- `steps_title_ar` / `steps_title_en` / `steps_title_he`: كانت بتقول "أربع خطوات / Four steps / ארבעה שלבים" رغم إن الخطوة الرابعة **فاضية تمامًا** في التلات لغات → غيّرتها لـ "ثلاث خطوات / Three steps / שלושה שלבים"
- `step_number_ar/en/he` للخطوات 1 و 2 و 3: كانت فاضية → اتملت بـ `01` / `02` / `03`

### ب) منتجات قطع الغيار — 163 منتج (WooCommerce)
كانوا موجودين بالعبري بس، من غير أي بيانات ACF. الحقول اللي اتملت لكل منتج:
- `name_ar` + `name_en` — الاسم بالعربي والإنجليزي
- `description_ar` + `description_en` — الوصف الكامل
- `name_he` + `description_he` — العبري (مع التصحيحات تحت)
- `brand` — Daf / Man / Volvo / Mercedes / Scania / Iveco
- `part_category` — lighting / engine / electrical (للمناسب منها بس)

**النتيجة النهائية المتأكد منها:** `175 من 175 منتج` عندهم ترجمة كاملة، `0` ناقص.

### ج) تصحيحات لغوية في العبري الأصلي
- **خطأ نحوي منهجي في 20 منتج:** كلمة `דרגל` (مش كلمة عبرية صحيحة) بدل `מדרגה` (درجة/سلم) — اتصلحت كل واحدة حسب سياقها مع ضبط التوافق النحوي (مذكر/مؤنث)
- **9 عناوين كانت `#N/A`** (خطأ استيراد قديم من إكسيل) → اتكتب اسم صحيح مستنتج من الوصف ورقم القطعة
- **3 عناوين مش مطابقة للمحتوى** (العنوان `משקפים` = نظارات، لكن الوصف بيتكلم عن صادم أمامي) → اتصلحت لتطابق المحتوى الفعلي

---

## 3) حاجات **مـ**اتعملتش (عشان تبقى في صورتها)

- ❌ **ماتعملش push على GitHub** — معنديش صلاحية (مفيش `gh` CLI ولا git credentials محفوظة). التعديل معمول كـ commit محلي على branch اسمه `fix/fleet-showcase-image-order` بس المجلد المؤقت اتنضف، فالأسهل تطبّق التعديل يدويًا من الـ diff فوق.
- ❌ **إعادة كتابة النصوص التسويقية** في `lib/i18n/dictionaries/{ar,en,he}.ts` (الصفحة الرئيسية + hero بتاع Products/Blog/Contact/Cart) — كنا اتفقنا عليها بس ما بدأتش فيها.
- ❌ **مراجعة لغوية** لسيارات الاستيراد الفردية (7) ومقالات المدونة (19) وسيارات البيع (3).
- ❌ **تحسين أسلوبي** لوصف الـ 163 قطعة غيار — دلوقتي سليمة نحويًا لكن النمط لسه تكراري/آلي شوية.
- ⚠️ **تعديل على Gutenberg blocks اتعمل محليًا وما اترفعش** — في أول الجلسة قبل ما توضّح إن الواجهة هي Next.js، عدّلت نسخة محلية من محتوى صفحة الووردبريس القديمة (post 756). **التعديل ده ماوصلش السيرفر خالص واتلغى** — مفيش حاجة معلقة منه.

---

## 4) مشكلة مفتوحة (خارج نطاق الكود)

🔴 **الموقع كان بيرجع 503** من Traefik (`no available server`) وقت الفحص، والشهادة self-signed. الكونتينر نفسه شغال وبيرد من جوه، بس البروكسي مش لاقي backend صحي. ده محتاج حد عنده وصول لـ **Coolify dashboard** يعمل redeploy أو يظبط الـ health check — مش حاجة تتحل من الكود ولا من صلاحيات الـ agent.
