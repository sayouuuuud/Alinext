# تقرير العمل والاختبارات — AliFleet Checkout

**تاريخ التقرير:** 6 سبتمبر 2026  
**المشروع:** `sayouuuuud/alifleet`  
**الفرع الذي بدأ منه العمل:** `main`  
**فرع العمل:** `v0/wordpress-infrastructure-diagnostic-360f2356`  
**الواجهة:** Next.js App Router  
**الخلفية:** WordPress + WooCommerce + WooGraphQL  
**نطاق WordPress:** `a-f.site`  
**النطاق العام المختبر:** `alifleet.com`

> هذا التقرير لا يحتوي كلمات مرور أو مفاتيح SSH أو cookies أو JWTs أو أسرار بيئة أو بيانات عملاء.

## 1. طلب المستخدم

طلب المستخدم فحص الباك إند المرتبط بالفرونت إند، وبالأخص WordPress/WooCommerce، لأن رحلة الـcheckout كانت بها مشكلة. بعد تنفيذ الإصلاحات، طلب اختبار الرحلة كاملة، بما في ذلك:

- الانتقال من المنتجات إلى السلة.
- نقل السلة إلى WordPress/WooCommerce.
- فتح checkout بدون 404 أو تحويل خاطئ.
- التأكد من إنشاء حساب للمستخدم عند الحاجة.
- التأكد من تسجيل الدخول واستمرار السلة.
- اختبار الجلسات والـcookies.
- اختبار WooCommerce AJAX.
- اختبار العربية والإنجليزية والعبرية.
- التأكد من أن النجاح الظاهر لا يحدث بدون طلب حقيقي.
- فحص كل ما ورد في `docs/INCIDENT-REPORT.md` وخطة التنفيذ.

## 2. ما تم فحصه

تمت مراجعة ملفات الفرونت إند والبروكسي والـWordPress التالية:

- `app/checkout/[[...path]]/route.ts`
- `app/wc-ajax/route.ts`
- `app/cms/[[...path]]/route.ts`
- `lib/checkout/proxy.ts`
- `lib/checkout/actions.ts`
- `lib/checkout/gate.ts`
- `lib/cart-context.tsx`
- `components/cart-view.tsx`
- `components/add-to-cart-button.tsx`
- `components/account/register-form.tsx`
- `components/account/login-form.tsx`
- `components/account/auth-shell.tsx`
- `lib/auth/actions.ts`
- `lib/auth/session.ts`
- `lib/auth/auth-context.tsx`
- `lib/wp/config.ts`
- `lib/wp/catalog.ts`
- `lib/wp/operations.ts`
- `lib/wp/page-images.ts`
- `lib/wp/settings.ts`
- `lib/wp/policies.ts`
- `lib/wp/cars-page.ts`
- `wordpress/mu-plugin/alifleet-cms.php`
- `wordpress/mu-plugin/alifleet-headless-redirect.php`
- `wordpress/scripts/repair-required-pages.php`
- `wordpress/server/wp-agent`
- `wordpress/server/alifleet-agent.sudoers`
- `wordpress/server/agent-user.sh`
- `wordpress/server/agent-preflight.sh`
- `docs/INCIDENT-REPORT.md`

كما تم فحص سجلات الحاوية وWordPress وملف إضافة JWT الموجود على السيرفر، مع عدم حفظ الأسرار في المشروع.

## 3. المشكلة الأصلية والسبب

كانت صفحات WooCommerce الأساسية موجودة في إعدادات WooCommerce، لكن حالتها كانت `draft`:

| الاستخدام | ID | slug | الحالة قبل الإصلاح |
|---|---:|---|---|
| Shop | 936 | `shop` | draft |
| Cart | 937 | `cart` | draft |
| Checkout | 938 | `checkout` | draft |
| Account | 939 | `my-account` | draft |

لذلك كان WooCommerce يشير إلى صفحة checkout صحيحة بالـID، لكن الصفحة غير منشورة، فظهرت أخطاء 404 أو تعذر إكمال الرحلة. كما كانت صفحات CMS والسياسات المطلوبة في حالات غير منشورة، ما جعل GraphQL يرجع `null` لبعض المحتوى.

تم كذلك اكتشاف مشكلة مستقلة في السماح بـPreview origin؛ نطاق المعاينة الفعلي لم يكن ضمن origins المسموح بها في WordPress، وكان ذلك يسبب تحويلات إلى تسجيل الدخول بدل تمرير checkout.

## 4. ما تم تنفيذه فعليًا

### WordPress وWooCommerce

- أخذ baseline لحالات الصفحات وإعدادات WooCommerce.
- التأكد من وجود backup حديث قبل النشر.
- إنشاء أداة إصلاح محدودة وقابلة لإعادة التشغيل:
  - `wordpress/scripts/repair-required-pages.php`
  - تتحقق من ID وslug وpost type.
  - لا تنشئ صفحات جديدة.
  - تنشر القائمة البيضاء فقط.
  - ترفض أي اختلاف غير متوقع.
- نشر صفحات WooCommerce الأربع.
- نشر إجمالي 19 صفحة معتمدة فقط، بدون نشر صفحات الاختبار أو النسخ القديمة.
- الحفاظ على محتوى الصفحات والعناوين والـIDs والعلاقات والـACF حسب المقارنة.
- تحديث كود `mu-plugin` الخاص بالحماية وCMS والكاش والتحذيرات.
- إنشاء نسخ احتياطية للملفات المنشورة قبل الرفع.
- فحص PHP داخل بيئة WordPress لأن PHP غير متوفر محليًا.

### الفرونت إند والبروكسي

- تحديث مسارات checkout وWooCommerce AJAX.
- إضافة حماية `Cache-Control: private, no-store` للمسارات الحساسة.
- منع التخزين العام لردود checkout والـredirects الخاصة به.
- تضييق قواعد الحماية بدل فتح WordPress أو Docker بالكامل.
- الحفاظ على الاستثناءات اللازمة لـcheckout وcart وWooCommerce AJAX.
- إضافة تعديل محلي للسماح بـPreview origin الحالي فقط.

### الوصول للسيرفر

- تم استخدام حساب SSH مؤقت.
- تم تقييد الصلاحيات إلى `wp-agent` بدل إعطاء صلاحيات Docker أو root كاملة.
- تم استخدام backup ونسخ `.bak` عند العمل على الملفات.
- انتهت صلاحية مفتاح SSH المؤقت قبل آخر رفع مطلوب.
- لم يتم الادعاء بأن آخر تعديل محلي وصل إلى الإنتاج.

## 5. الاختبارات التي تمت ونتائجها

### 5.1 فحوصات الكود

| الاختبار | النتيجة |
|---|---|
| TypeScript | ناجح |
| Production build | ناجح |
| PHP syntax داخل بيئة WordPress | ناجح |
| فحوص Bash/whitespace | ناجحة |
| ESLint | لم يعمل؛ dependency الخاصة بـESLint غير موجودة |

### 5.2 WordPress وGraphQL

- المنتجات والمقالات المنشورة موجودة.
- تم التحقق من IDs وslugs للصفحات المعتمدة.
- تم نشر الصفحات التي كان GraphQL يرجع لها `null` بسبب حالة `draft`.
- اختبار GraphQL الصحيح بأسماء WooGraphQL المعتمدة نجح.
- اختبار `productsFeed` كان اختبارًا غير صحيح لأنه ليس حقلًا موجودًا في schema، وتم تمييزه كخطأ في الاختبار وليس عطلًا في المنتج.

### 5.3 المنتجات والسلة

- فتح صفحة المنتجات على `alifleet.com` نجح.
- إضافة منتج فعلي إلى السلة نجحت.
- تم اختبار المنتج `2639` في رحلة النقل.
- تم إنشاء جلسة WooCommerce.
- تم اختبار handoff باستخدام نفس جلسة cookies بعد اكتشاف أن الاختبار الأول كان يفصل بين جلستين.

### 5.4 فتح checkout

- checkout رجع HTTP `200` عند وجود جلسة وسلة صالحة.
- نموذج الدفع ظهر.
- حقل `billing_email` ظهر.
- checkout الفارغ يرجع إلى السلة؛ وهذا سلوك WooCommerce متوقع وليس فشلًا.
- لا يوجد دفع حقيقي تم تنفيذه.

### 5.5 التسجيل وتسجيل الدخول

تم اختبار صفحة التسجيل مع redirect إلى السلة، ثم محاولة إنشاء حساب اختبار.

النتيجة المؤكدة من الاختبارات السابقة:

- إنشاء الحساب في WordPress نجح ووصل الحساب إلى WordPress.
- تسجيل الدخول من WordPress الأصلي بالحساب نفسه نجح.
- تسجيل الدخول عبر مسار GraphQL في الواجهة رجع `Internal server error`.
- لذلك لا يمكن اعتبار مسار إنشاء الحساب → تسجيل الدخول → استمرار السلة مكتملًا.
- لم يتم تأكيد أن السلة تنتقل بشكل صحيح إلى الحساب بعد تسجيل الدخول.

### 5.6 JavaScript وWooCommerce AJAX

اختبار المتصفح أظهر أن checkout HTML يفتح، لكن JavaScript القياسي الخاص بـWooCommerce لا يبدأ كما يجب في بعض مسارات الـhandoff:

- `window.wc_checkout_params` لم يكن متاحًا في الحالة التي تم اختبارها.
- طلبات WooCommerce AJAX المطلوبة لتحديث checkout لم تعمل بالشكل المتوقع.
- نتيجة ذلك أن تحديث العنوان والشحن والدفع لم تعتبر ناجحة.
- ظهرت حقول الشحن رغم أن خيار الشحن لعنوان مختلف لم يكن محددًا في إحدى الحالات.

هذه نقطة مهمة: ظهور نموذج checkout لا يعني أن checkout قابل للإرسال فعليًا.

### 5.7 الرابط الوهمي لتأكيد الطلب

تم اختبار رابط `order-received` غير صالح مع رقم طلب وهمي ومفتاح غير صالح.

النتيجة:

- الصفحة عرضت حالة تشبه نجاح الطلب.
- السلة تم مسحها رغم عدم وجود طلب مدفوع حقيقي.
- هذا سلوك خطير يجب منعه؛ لا يجب مسح السلة أو عرض نجاح إلا بعد تحقق WordPress/WooCommerce من طلب حقيقي ومفتاح صالح.

### 5.8 الجلسات والعزل

- تم استخدام جلسات Browser منفصلة لاختبار عدم تسرب cookies.
- فتح checkout في جلسة جديدة بدون سلة لا يثبت نجاح handoff؛ بل يؤدي إلى السلوك المتوقع للسلة الفارغة.
- تم اكتشاف أن بعض الاختبارات الأولى كانت مضللة بسبب استخدام جلسة مختلفة لإنشاء السلة وفتح checkout.
- بعد توحيد cookie jar، ثبت أن فتح checkout مع جلسة صالحة يعمل HTTP 200.
- لم يكتمل اختبار قبول نهائي يثبت عزل جلستين كاملتين بعد آخر تعديل بسبب توقف الرفع.

### 5.9 اللغات

تم فتح checkout واختباره على:

- English: فتح الصفحة، مع نفس ملاحظات JavaScript والـAJAX.
- Arabic: فتح الصفحة، مع الحاجة لإعادة اختبار handoff النهائي بعد رفع تعديل Preview origin.
- Hebrew: فتح الصفحة، مع الحاجة لإعادة اختبار handoff النهائي بعد رفع تعديل Preview origin.

الاختبار اللغوي النهائي لم يعتبر مكتملًا؛ لأن المشكلة ليست النصوص فقط، بل يجب التأكد من أن كل لغة تمر بنفس جلسة WooCommerce ونفس تحديثات AJAX ونفس قواعد الدفع.

## 6. الحالة الحالية

### مكتمل

- تحديد سبب 404 الأساسي.
- نشر صفحات WooCommerce الأساسية.
- نشر صفحات CMS والسياسات المعتمدة.
- أخذ backup قبل التغييرات.
- إنشاء أداة repair آمنة.
- تعديل حماية WordPress والكاش والتحذيرات.
- تعديل مسارات checkout وWooCommerce AJAX محليًا.
- نجاح TypeScript وProduction build.
- فتح checkout بجلسة WooCommerce صالحة.
- إثبات أن المنتجات والسلة الأساسية تعمل.
- توثيق المشكلة في `docs/INCIDENT-REPORT.md`.

### غير مكتمل أو يحتاج إصلاحًا

1. **رفع آخر تعديل الخاص بـPreview origin إلى السيرفر.**
   - التعديل موجود محليًا، لكن مفتاح SSH انتهت صلاحيته قبل الرفع النهائي.

2. **إصلاح GraphQL login.**
   - إنشاء الحساب ينجح، لكن login عبر GraphQL يرجع `Internal server error`.
   - يجب فحص endpoint والـJWT plugin والـsecret والـcookie/session handling.

3. **إصلاح تشغيل WooCommerce checkout JavaScript.**
   - يجب التأكد من تحميل scripts و`wc_checkout_params` وتهيئة checkout بعد البروكسي.
   - يجب اختبار update order review والشحن والدفع فعليًا.

4. **منع النجاح الوهمي في `order-received`.**
   - يجب التحقق من رقم الطلب والمفتاح من WordPress.
   - يجب عدم مسح السلة عند رابط غير صالح.
   - يجب عدم عرض نجاح إلا عند وجود طلب حقيقي وحالة مقبولة.

5. **إكمال مسار المستخدم.**
   - Guest → Register → Login → العودة للسلة → checkout.
   - يجب التأكد من بقاء المنتج والكمية وعدم فقدان WooCommerce session.

6. **إكمال اختبار WooCommerce AJAX.**
   - تحديث الدولة/المدينة/العنوان.
   - تحديث طرق الشحن.
   - تحديث الإجمالي.
   - التحقق من أخطاء الطلب.

7. **اختبار اللغات النهائي.**
   - English وArabic وHebrew.
   - مع جلسة جديدة لكل لغة.
   - ومع فحص `lang` و`dir` والنصوص وسلوك النموذج.

8. **فحص Preview بعد الرفع.**
   - التأكد من أن origin المعاينة يمر عبر WordPress بدل التحويل إلى login.
   - إعادة تشغيل رحلة checkout الكاملة من المتصفح.

9. **اختبار الدفع الآمن.**
   - لا يستخدم بطاقة حقيقية.
   - يحتاج sandbox/test gateway أو وصولًا صريحًا لبيئة دفع تجريبية.
   - يجب تسجيل نتيجة إنشاء الطلب فقط، لا تنفيذ charge حقيقي.

10. **إزالة الوصول المؤقت.**
    - بعد انتهاء الفحص يجب إزالة المفتاح المؤقت.
    - إزالة قاعدة sudo المؤقتة.
    - التأكد من عدم بقاء حساب أو صلاحية غير مطلوبة.

## 7. ترتيب التنفيذ المقترح للمتبقي

1. تثبيت مفتاح SSH مؤقت جديد باستخدام حساب لديه sudo.
2. اختبار `sudo -n wp-agent help` بدون تعديل.
3. أخذ نسخة `.bak` من ملفات WordPress المنشورة.
4. رفع تعديل Preview origin فقط.
5. فحص PHP وإعادة تشغيل preflight.
6. فحص/إصلاح GraphQL login.
7. فحص تحميل WooCommerce scripts و`wc_checkout_params`.
8. إصلاح التحقق من `order-received` وعدم مسح السلة عند رابط مزيف.
9. اختبار رحلة guest/register/login/cart/checkout بجلسة واحدة.
10. اختبار جلستين منفصلتين للتأكد من عدم التسرب.
11. اختبار WooCommerce AJAX وتحديث الشحن والإجمالي.
12. تكرار الاختبارات بالإنجليزية والعربية والعبرية.
13. تشغيل TypeScript وbuild وفحوص PHP مرة أخرى.
14. مراجعة diff وlogs ونتائج المتصفح.
15. تنفيذ اختبار gateway تجريبي فقط إن كان متاحًا.
16. إزالة مفتاح SSH وصلاحيات sudo المؤقتة.
17. اعتبار الإصلاح مكتملًا فقط بعد نجاح كل اختبارات القبول.

## 8. معايير اعتبار checkout ناجحًا

لا يكفي تحقق HTTP 200. يجب أن تتحقق كل النقاط التالية:

- صفحة checkout تفتح بدون 404 أو redirect غير متوقع.
- السلة تحتوي المنتج والكمية الصحيحة.
- الجلسة نفسها تبقى موجودة حتى checkout.
- المستخدم يستطيع إنشاء حساب أو تسجيل الدخول.
- تسجيل الدخول لا يرجع `Internal server error`.
- checkout JavaScript يعمل وتظهر `wc_checkout_params` عند الحاجة.
- تحديث العنوان يعيد حساب الشحن والإجمالي.
- لا يوجد JavaScript error يمنع الإرسال.
- رابط order-received غير صالح لا يعرض نجاحًا ولا يمسح السلة.
- لا يتم إنشاء طلب إلا بعد إرسال checkout فعليًا.
- لا يتم تنفيذ دفع حقيقي أثناء الاختبار.
- كل لغة تعمل بنفس القواعد.
- جلستان منفصلتان لا تتشاركان السلة أو cookies.
- logs لا تحتوي خطأ جديدًا مرتبطًا بالرحلة.

## 9. ما لم يتم فعله

- لم يتم تنفيذ دفع حقيقي.
- لم يتم إدخال بيانات بطاقة حقيقية.
- لم يتم إنشاء طلب مدفوع حقيقي.
- لم يتم تغيير المنتجات أو الأسعار أو المخزون.
- لم يتم تعديل حسابات العملاء الموجودة.
- لم يتم فتح Docker أو لوحة WordPress للعامة.
- لم يتم push مباشر إلى `main`.
- لم يتم اعتبار آخر تعديل المحلي منشورًا على الإنتاج.
- لم يتم تضمين كلمات المرور أو مفاتيح SSH أو cookies أو JWTs أو أسرار البيئة.

## 10. الخلاصة

تم إصلاح سبب 404 الأصلي بنشر صفحات WooCommerce المطلوبة، وثبت أن المنتجات والسلة وفتح checkout الأساسي يعملون عند وجود جلسة WooCommerce صالحة. لكن اختبارات القبول النهائية لم تكتمل؛ إذ توجد ثلاث نقاط مانعة: رفع Preview origin، فشل GraphQL login، وعدم عمل WooCommerce checkout JavaScript بشكل كامل، إضافة إلى ضرورة منع رابط order-received الوهمي من عرض نجاح أو مسح السلة.

لذلك الحالة الصحيحة للمشروع هي: **الإصلاح الأساسي منفذ، لكن checkout غير معتمد للإطلاق النهائي حتى تنفيذ البنود المعلقة وإعادة اختبار القبول كاملة.**

## 11. الملفات المرجعية

- `docs/INCIDENT-REPORT.md`
- `docs/CHECKOUT-TEST-REPORT.md`
- `lib/checkout/proxy.ts`
- `lib/checkout/actions.ts`
- `lib/checkout/gate.ts`
- `app/checkout/[[...path]]/route.ts`
- `app/wc-ajax/route.ts`
- `wordpress/mu-plugin/alifleet-cms.php`
- `wordpress/mu-plugin/alifleet-headless-redirect.php`
- `wordpress/scripts/repair-required-pages.php`
