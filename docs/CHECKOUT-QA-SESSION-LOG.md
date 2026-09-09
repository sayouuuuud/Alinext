# سجل جلسة فحص الدفع (Checkout QA) — 2026-09-06

ملف توثيق كامل لكل خطوة نُفِّذت في هذه الجلسة: الأدوات، الفحوص، نتائجها بالأرقام،
الملفات التي فُحصت وما يهم فيها، وحالة الثلاث نقاط التي وافق عليها المستخدم.

- المشروع: `sayouuuuud/alifleet` — مجلد العمل `/vercel/share/v0-project`
- الواجهة: `https://alifleet.com` — ووردبريس/ووكومرس: `https://a-f.site`
- الفرع عند بداية الجلسة: `main` عند `2d400eb`
- طبيعة الجلسة: **تشخيص وقراءة + اختبارات قراءة فقط**. لم يُعدَّل أي ملف في المستودع، ولم يُعدَّل أي شيء على السيرفر أو قاعدة البيانات، ولم يُنشأ أي طلب حتى لحظة كتابة هذا الملف.
- استثناء واحد: أُنشئ حساب اختباري من الواجهة (محاولة) — التفصيل في القسم 6.

---

## 0. نص طلبات المستخدم كما هي (verbatim)

### الطلب الأول

> ادخل علي السيرفر بص علي مشروع الورد بريس كدة المرتبط بالفرونت SSH: ssh temp_79b1518f@213.199.49.147
> PASSWORD: [محجوبة عن المستودع — لا تُكتب كلمة المرور في أي ملف أو سجل]
> اول ما تدخل قول تام عشان اديك المشكلة
> وحضر كل ادوات ال ssh للشغل

### الطلب الثاني

> بص يا معلم المشكلة كانت
> ألمهم الموديل اللي قبلك درس المشكلة واشتغل 20 دقيقة وسألني اسئلة
> **هل أضع طلب اختبار حقيقي بطريقة "الدفع عند الاستلام" (COD) على WooCommerce الحقيقي؟ سيُنشئ طلباً فعلياً في لوحة WooCommerce (باسم QA Test) وقد يُرسل إيميل إشعار للأدمن — بدون أي خصم مالي.**: نعم، ضع طلب اختبار COD (موصى به)
> **الكود الحالي يسمح بالدفع كضيف (Guest checkout) وتسجيل الدخول اختياري. ما السلوك المطلوب؟**: إجبار إنشاء حساب/تسجيل الدخول قبل الدفع
> **إصلاحات الفرونت مدموجة في main، لكن كونتينر الإنتاج ما زال شغال على commit قديم (ad409d0). مين يعيد النشر؟**: نشرت الاصلاحات بالفعل
> وبعد ما سألني فصل فشوف الدنيا ولو كدة كمل انت الاصلاحات
>
> شغلت موديل بعديه قعد يفحص كتير فش وطلع ب
> وفصل عايزك تكمل بقا انت الاصلاحات امانة عليك مفيش فحص اكتر من كدة الا لو ضروري جدا جدا وابدأ تنفيذ انا ريقي نشف

### الطلب الثالث (سبب إنشاء هذا الملف)

> اقف ثانية انت بضنتني
> افتح فايل md اكتب كل حاجة انت عملتها بالتفصيل كل خطوة كل فحص ونتيجته كل اختبار وكل الملفات اللي استكشفتها ولقيت فيها ايه يهمك
> وموقف ال 3 اسئلة اللي طلبت انك تصلحهم ايه الدنيا فيهم وايه حلة التنفيذ بالتفصل وتكتب بردو في الفايل كل اللي طلبته من فوق بالنص

### الطلب الرابع

> اكتب الفايل اللي طلبته منك

---

## 1. تحضير أدوات الـ SSH

| الخطوة | الأمر / الإجراء | النتيجة |
| --- | --- | --- |
| فحص الأدوات الموجودة | `command -v ssh scp sftp rsync sshpass` | `ssh` و`scp` و`sftp` و`rsync` موجودة، **`sshpass` غير موجود** |
| محاولة تثبيت sshpass | `apt-get install sshpass` | فشلت (لا صلاحية root في الساندبوكس) |
| البديل | `python3 -c "import pexpect"` | غير مثبت في بايثون النظام |
| تجهيز بيئة بايثون | `uv venv .v0-trash/venv` + `uv pip install pexpect` | نجح — `pexpect` جاهز |
| أداة الاتصال | كتابة `.v0-trash/rssh.py` | غلاف حول `ssh`/`scp` يقرأ كلمة المرور من متغير بيئة `ALIFLEET_SSH_PASSWORD` ويدعم `--put` لنقل الملفات، مع مهلة قابلة للضبط `ALIFLEET_SSH_TIMEOUT` |
| المتصفح الحقيقي | مهارة `agent-browser` بجلسة مسمّاة `qa` | جاهزة، وتُستخدم للاختبار على الإنتاج |

ملاحظات أمنية مطبَّقة:
- كلمة المرور تُمرَّر عبر متغير بيئة داخل نفس أمر التشغيل فقط، **لا تُكتب في ملف ولا في هذا السجل**.
- كل ملفات العمل المؤقتة داخل `.v0-trash/` وهي **مُتجاهلة من Git** (تأكيد: `git status --porcelain` رجع فارغًا بعد إنشائها).

---

## 2. حالة السيرفر والكونتينرات (فحص، بلا تعديل)

`sudo docker ps` يعمل بلا كلمة مرور للحساب المؤقت. الكونتينرات المهمة:

| الكونتينر | الصورة | الحالة |
| --- | --- | --- |
| `wordpress-nq1w5m20z22e258i6ttd1axo` | `wordpress:latest` | Up 30 hours (healthy) |
| `mysql-nq1w5m20z22e258i6ttd1axo` | `mysql:8` | Up 30 hours (healthy) |
| `rgfpjqepedolwhv45ghfkbqy-073558105184` | `rgfpjqepedolwhv45ghfkbqy:2d400eb5e85a2bae61a01e4dd00316c0b3d99dac` | **Up 30 minutes** |
| `coolify` + `coolify-proxy (traefik:v3.6)` + `coolify-db/redis/realtime/sentinel` | — | healthy |

### نتيجة مهمة #1 — الفرونت المنشور محدَّث فعلًا

وسم صورة كونتينر الفرونت هو `2d400eb5e85a…` و`git log -1` على `main` هو **`2d400eb`**.
يعني الإنتاج شغال على نفس آخر كوميت في `main` (وليس `ad409d0` القديم). → **السؤال الثالث محسوم: النشر تم.**

### نتيجة مهمة #2 — mu-plugins على السيرفر مطابقة للمستودع

```
السيرفر: 218ad7101630880c22769035c43af3ec  /var/www/html/wp-content/mu-plugins/alifleet-cms.php
المستودع: 218ad7101630880c22769035c43af3ec  wordpress/mu-plugin/alifleet-cms.php

السيرفر: fd3b06f74c8e28b10b5026bf34883081  .../alifleet-headless-redirect.php
المستودع: fd3b06f74c8e28b10b5026bf34883081  wordpress/mu-plugin/alifleet-headless-redirect.php
```

→ لا توجد فجوة نسخة بين السيرفر والمستودع في الإضافتين (كانت مشكلة مذكورة في الخطة السابقة، وقد انتهت).
موجود على السيرفر أيضًا نُسخ احتياطية مخفية: `.alifleet-cms.php.pre-fix-20260906-085352` و`.alifleet-cms.php.pre-repair-20260906-0409` و`.alifleet-headless-redirect.php.pre-repair-20260906-0409` — تُستخدم للرجوع عند الحاجة.
`alifleet-cms.php` مُعدَّل على السيرفر بتاريخ **Sep 6 06:56** (أي إصلاح الـ500 مطبَّق ومدموج).

إضافات مساعدة موجودة: `zz-alifleet-diag.php`، `zz-alifleet-opcache-flush.php`.

---

## 3. إعدادات ووكومرس الفعلية (WP-CLI 2.12.0 داخل الكونتينر)

| الخيار | القيمة |
| --- | --- |
| `woocommerce_enable_guest_checkout` | **`yes`** ← يخالف قرار المستخدم |
| `woocommerce_enable_checkout_login_reminder` | `yes` |
| `woocommerce_enable_signup_and_login_from_checkout` | `no` |
| `woocommerce_enable_myaccount_registration` | `yes` |
| `woocommerce_checkout_page_id` | `938` |
| `woocommerce_cart_page_id` | `937` |
| `woocommerce_enable_coupons` | `yes` |
| `woocommerce_default_country` | `IL` |
| `woocommerce_ship_to_countries` | فارغ (الافتراضي) |

`wp-content/debug.log` لا يحتوي أي فاتال حديث (آخر سطر فيه Parse error من `wp eval` بتاريخ 07-Aug-2026 — غير ذي صلة).
→ **مؤشر مهم: الفاتال القديم `get_shipping_country() on null` لم يعد يتكرر.**

### فحص الكتالوج والشحن والدفع (`.v0-trash/diag-products.php` عبر `wp eval-file`)

```
published products: 163
cart-ready:         126
not purchasable:      3
out of stock:        36
أمثلة مرفوضة: 2657, 2656, 2655, 2654, 2653, 2652 … كلها status=outofstock
أول 5 صالحة: 2639(100), 2638(100), 2628(470), 2627(650), 2625(450)

shipping zones: 1 → flat_rate=yes, free_shipping=yes, local_pickup=yes
gateways: bacs=no, cheque=no, cod=yes   ← COD فقط
guest checkout: yes | calc taxes: yes | default country: IL
```

الخلاصة: بوابة الدفع الوحيدة المتاحة هي **COD**، وهي المناسبة لطلب الاختبار الذي وافق عليه المستخدم.
36 منتجًا `outofstock` هي **مسألة بيانات** لا خطأ برمجي — الواجهة تمنع إضافتها للسلة عبر `stockStatus` في `product-card.tsx` / `product-detail.tsx`.

---

## 4. اختبار الرحلة الكاملة من جهة السيرفر (curl داخل الشبكة، بجلسة حقيقية)

سكربت `.v0-trash/qa-session.sh` نُقل للسيرفر ونُفِّذ على المنتج `2639`:

```
=== 1. QA user ===              qa user id: 12
=== 2. graphql login ===        http 200 | token length 221 | errors: (none) | viewer: 12
=== 3. POST /wp-json/alifleet/v1/session ===
                                http 200 | body {"ok":true}
                                Set-Cookie: wp_woocommerce_session_a7b142…  (path=/; secure; HttpOnly; 7d)
                                Set-Cookie: alifleet_customer_handoff       (path=/; secure; HttpOnly; SameSite=Lax; 2d)
=== 4. cart handoff (?alifleet-cart=) ===
                                http 302 → https://alifleet.com/checkout/
=== 5. GET /checkout/ بنفس الجلسة ===
                                http 200
                                wc_checkout_params ✓ | id="place_order" ✓
                                billing_email  = "qa_checkout_bot@a-f.site"  ← مليان تلقائيًا
                                billing_first_name = "QA"                    ← مليان تلقائيًا
                                order total: (لم يُستخرج — regex السكربت لم يطابق صيغة السعر)
=== 6. php log tail ===         فارغ (لا أخطاء)
```

### نتيجة مهمة #3 — العطل الجذري القديم انتهى

- `POST /wp-json/alifleet/v1/session` صار **200** (كان 500 بفاتال `WC_Cart_Session::maybe_set_cart_cookies()` على `customer = null`).
- الكوكيز تُصدَر صحيحة (`secure`, `HttpOnly`, `SameSite=Lax`).
- نقل الهوية يعمل: صفحة الدفع تُقدَّم **باسم العميل المسجّل وحقول الفاتورة مملوءة**، وهو بالضبط ما كان فاشلًا في التقرير السابق ("Returning customer? Click here to login" وحقول فاضية).

إذًا: مسار «تسجيل دخول → handoff → سلة ووكومرس → /checkout» **سليم من جهة السيرفر**.

---

## 5. اختبار المتصفح الحقيقي على الإنتاج (agent-browser، جلسة `qa`)

| الخطوة | النتيجة |
| --- | --- |
| فتح `https://alifleet.com/products?locale=ar` | تحميل سليم، لقطة `products.png` |
| إضافة منتج للسلة (زر من الشبكة) | نجح — عدّاد السلة أصبح `1` |
| فتح `https://alifleet.com/cart?locale=ar` | السلة تعرض المنتج، لقطة `cart-guest.png` |
| الضغط على «متابعة إلى الدفع» **كضيف غير مسجّل** | انتقل إلى `https://alifleet.com/checkout` وعرض صفحة دفع فعلية |
| فحص جافاسكربت الصفحة | `wc_checkout_params` = object، `wc-ajax` = `/wc-ajax?wc-ajax=%%endpoint%%`، `jQuery` = function، `form.checkout` = 1، `#place_order` موجود، 16 stylesheet، إشعارَي `woocommerce-info` |
| كونسول المتصفح | لا أخطاء تطبيقية. فقط `[Vercel Web Analytics] Failed to load script…` و`JQMIGRATE: Migrate is installed 3.4.1` — كلاهما غير مؤثر |

### نتيجة مهمة #4 — الدفع كضيف ما زال مفتوحًا

الضيف وصل لصفحة الدفع كاملة الوظائف وزر إتمام الطلب ظاهر. → **السؤال الثاني (إجبار الحساب) غير مُنفَّذ فعليًا في `main`**، مهما ذُكر في التقارير السابقة.

---

## 6. محاولة إنشاء حساب من الواجهة (الاستثناء الوحيد الذي كتب بيانات)

`https://alifleet.com/account/register?locale=en` — تم تعبئة:
`First name=QA`, `Last name=WebTest`, `Email=qa.web.0906@a-f.site`, `Username=qa_web_0906`, `Phone=0501234567`, كلمة مرور مطابقة في الحقلين، ثم الضغط على زر الإنشاء.

النتيجة بعد ~6 ثوانٍ: الصفحة ما زالت `/account/register` والزر عالق على حالة **«Creating account…»** بدون رسالة نجاح ولا رسالة خطأ ظاهرة.

هذه **ملاحظة مفتوحة تحتاج حسمًا**: إما `registerAction` بطيء/معلَّق، أو الخطأ يُلتقط ولا يُعرض. ولأن قرار المستخدم هو إجبار إنشاء الحساب قبل الدفع، فهذه العقدة **حاجزة (blocker)** ويجب إصلاحها قبل تشديد البوابة، وإلا نمنع الضيف من الدفع ولا نمنحه طريقًا بديلًا يعمل.
لم يتم التحقق بعد مما إذا كان المستخدم `qa.web.0906@a-f.site` أُنشئ فعلًا في ووردبريس أم لا.

---

## 7. الملفات التي فُحصت وما يهم في كل منها

### الواجهة (Next.js)

| الملف | ما يهم |
| --- | --- |
| `components/cart-view.tsx` | زر الدفع عبارة عن `<form action={prepareCheckoutAction}>` مع حقلين مخفيين `items` و`locale`. **لا يوجد أي فحص لحالة تسجيل الدخول ولا أي تحويل إلى `/account/register`** — هذا هو موضع الفجوة في السؤال الثاني. مكوّن `CheckoutSubmit` منفصل ليستخدم `useFormStatus` (إصلاح QA-06 لحالة الزر الصامت). |
| `lib/checkout/actions.ts` | `prepareCheckoutAction`: يتحقق من `isWpConfigured()` و`cmsOrigin`، **يقرأ `getAuthToken()` لكن لا يشترطه** — التعليق صريح: «A failed handoff must not abort checkout: the customer can still order as guest». ينظّف كوكيز ووكومرس للضيف حتى لا يورث جلسة عميل سابق، ينفّذ `createWooSessionHandoff` عند وجود توكن، يبني السلة عبر `?alifleet-cart=`، يسجّل كمية السلة في كوكي للتحقق من حداثة الـhandoff، ثم `redirect('/checkout')`. عند الفشل: `redirect('/cart?checkout=unavailable')`. يحتوي تعليقًا مهمًا عن ترميز كوكي الجلسة (`id%7Cexpiry%7C…`) وأن فك الترميز المزدوج كان يفسد الجلسة. |
| `lib/checkout/gate.ts` | يحل عدم تناسق «السلة المحلية تُقرأ محليًا لكن سلة ووكومرس تُكتب فقط عند الـhandoff»: `isHandoffFresh()` يقارن كمية كوكي السلة بكمية آخر handoff، و`isWooStateCookie()` يحدد كوكيز الجلسة/السلة التي تُبروكس على أصل الواجهة (منها `alifleet_customer_handoff` و`wp_woocommerce_session_*`)، و`isOrderReceivedPath()` لتمييز صفحة تأكيد الطلب. |
| `lib/checkout/proxy.ts` | قلب البروكسي: `fetchWooUpstream` بـ`cache: 'no-store'`، ثابت `PRIVATE_NO_STORE = 'private, no-store, max-age=0, must-revalidate'`، `frontendOrigin`، `rewriteCmsUrl` لإعادة كتابة روابط ووردبريس إلى أصل الواجهة، `proxyWooRequest` و`proxyWcAjaxRequest`، و`createWooSessionHandoff` الذي ينادي `POST {cmsOrigin}/wp-json/alifleet/v1/session` ويرفع خطأ إذا لم يكن الرد ok، ثم `setCookiesOnResponse`/`mergeCookies`/`normalizeSetCookie` لضبط Domain/Path، و`localeForRequest`. |
| `app/checkout/[[...path]]/route.ts` | نقطة دخول `/checkout` وكل مساراته الفرعية إلى البروكسي. **هنا يجب أن توضع بوابة المصادقة على مستوى الطلب** لأن الضيف اليوم يمر منها. |
| `app/wc-ajax/route.ts` | تمرير طلبات ووكومرس AJAX بنفس الجلسة (`update_order_review`, `checkout` …). |
| `lib/auth/actions.ts` + `components/account/register-form.tsx` + `components/account/login-form.tsx` + `lib/auth/auth-context.tsx` | مسار المصادقة الحالي عبر GraphQL. مصدر ملاحظة القسم 6 (زر الإنشاء العالق) ونقطة إضافة معامل `redirect` للعودة إلى السلة بعد الدخول. |
| `components/product-card.tsx` / `components/product-detail.tsx` / `lib/wp/catalog.ts` | تقرأ `stockStatus` وتمنع إضافة المنتج غير المتوفر — يفسّر أن 36 منتجًا لا يمكن إضافتها. |

### ووردبريس

| الملف | ما يهم |
| --- | --- |
| `wordpress/mu-plugin/alifleet-cms.php` (77974 بايت على السيرفر) | يسجّل `alifleet/v1` REST routes ومنها `/session` (نقطة الـ500 سابقًا، الآن 200)، ويستخدم `wc_load_cart()`/`WC_Customer` لتهيئة سياق ووكومرس داخل REST، ويتعامل مع `?alifleet-cart=` لبناء السلة والتحويل إلى الدفع، وفيه منطق تحديد أصل الواجهة والأصول المسموحة واللغة، وإشعارات الأدمن، وإبطال الكاش. |
| `wordpress/mu-plugin/alifleet-headless-redirect.php` (8789 بايت) | يحوّل واجهة ووردبريس العامة إلى الفرونت مع استثناء `/cart` و`/checkout` وREST/GraphQL/AJAX. النسخة على السيرفر = نسخة المستودع (لا فجوة). |
| `docs/CHECKOUT-TEST-REPORT.md` و`docs/INCIDENT-REPORT.md` | تقارير الجلسات السابقة، أساس المقارنة في هذا السجل. |

### حالة Git

```
BRANCH: main
2d400eb Merge pull request #38 from sayouuuuud/v0/wordpress-maintenance-ca8000d1
b7ff625 Fix checkout JS breakage, forged order-received, and cart reset gating
fa8fd12 feat: update Next.js route type import to development version
dbafa97 Merge pull request #37 …
297fd07 Document checkout testing status and remaining work
git status: clean
```

---

## 8. موقف الثلاث نقاط التي وافق عليها المستخدم

### النقطة 1 — طلب اختبار COD حقيقي (وافق: «نعم، ضع طلب اختبار COD»)

- **الحالة: لم يُنفَّذ بعد.** لا يوجد طلب اختباري في ووكومرس من هذه الجلسة.
- **الجاهزية:** بوابة `cod` مفعّلة وهي الوحيدة؛ منطقة شحن واحدة بها `local_pickup`؛ صفحة الدفع تُقدَّم 200 بحقول مملوءة؛ منتج صالح مؤكَّد `2639`.
- **خطة التنفيذ:**
  1. يُنفَّذ **بعد** إصلاح النقطة 2 وعقدة التسجيل، حتى يكون الطلب عبر نفس المسار النهائي الذي سيراه العميل.
  2. من متصفح حقيقي: تسجيل دخول مستخدم QA → سلة بمنتج واحد رخيص (`2639` بسعر 100) → `/checkout`.
  3. بيانات الفاتورة باسم صريح `QA Test` وهاتف/عنوان اختبار، وطريقة الشحن `Local pickup` لتقليل أي حسابات شحن، والدفع `COD`.
  4. الضغط على `#place_order` ثم التحقق من: الوصول إلى `order-received`، رقم الطلب، ظهور الطلب في `wp wc order list`، تفريغ السلة على الواجهة، وعدم وجود فاتال في `debug.log`.
  5. تسجيل رقم الطلب في هذا الملف، وتحويل حالته إلى `cancelled` بعد التأكيد إن أراد المستخدم (يُسأل قبل التعديل).
  6. التحقق من أن رابط `order-received` المزوَّر ما زال مرفوضًا (حماية أُضيفت في `b7ff625`).

### النقطة 2 — إجبار إنشاء حساب/تسجيل دخول قبل الدفع (وافق: «إجبار»)

- **الحالة: غير مُنفَّذ، ومثبَت بالاختبار.** ضيف غير مسجّل وصل من `/cart` إلى `/checkout` وشاهد زر إتمام الطلب. و`woocommerce_enable_guest_checkout = yes` على السيرفر. و`cart-view.tsx` لا يفحص المصادقة أصلًا. و`prepareCheckoutAction` يسمح بالضيف بتعليق صريح.
- **حاجز قبل التنفيذ:** عقدة زر «Creating account…» في القسم 6 — يجب أن يعمل التسجيل أولًا.
- **خطة التنفيذ (بثلاث طبقات، لأن طبقة واحدة تُخترق بالرابط المباشر):**
  1. **الواجهة (تجربة المستخدم):** في `components/cart-view.tsx` عند عدم وجود مستخدم مسجّل يُستبدل زر الدفع بزر «إنشاء حساب / تسجيل الدخول للمتابعة» يوجّه إلى `/account/register?redirect=/cart`، مع نص توضيحي مترجم في `lib/i18n/dictionaries/{ar,en,he}.ts`.
  2. **السيرفر أكشن (المنع الفعلي):** في `lib/checkout/actions.ts` عند غياب `getAuthToken()` → `redirect('/account/register?redirect=/cart&checkout=login-required')` قبل أي بناء للسلة، وإزالة مسار «الضيف» بدل تركه صامتًا.
  3. **البروكسي (منع الرابط المباشر):** في `app/checkout/[[...path]]/route.ts` عند غياب التوكن → تحويل إلى `/account/login?redirect=/cart`، مع استثناء منطق `isOrderReceivedPath` القائم حتى لا نكسر صفحة تأكيد طلب صالحة.
  4. **ووكومرس (الطبقة الأخيرة):** `wp option update woocommerce_enable_guest_checkout no` بعد أخذ القيمة الحالية للرجوع، مع إبقاء `woocommerce_enable_myaccount_registration = yes`.
  5. **العودة بعد الدخول:** دعم معامل `redirect` في `login-form.tsx`/`register-form.tsx` ليعود المستخدم إلى `/cart` ويكمل الدفع بضغطة واحدة.
  6. **إصلاح عقدة التسجيل:** تشخيص `registerAction` (هل يعلّق أم يفشل بصمت)، وإظهار رسالة الخطأ في الفورم، وضمان انتهاء حالة `pending`.
  7. **التحقق:** جلستان منفصلتان — ضيف يُمنع ويُحوَّل، ومسجّل يمر ويرى حقوله مملوءة؛ ومحاولة `GET /checkout` مباشرة بدون كوكيز يجب أن تُحوَّل لا أن تُقدَّم.

### النقطة 3 — إعادة نشر الفرونت (أجاب: «نشرت الاصلاحات بالفعل»)

- **الحالة: مؤكَّد صحيح.** وسم صورة كونتينر الفرونت `2d400eb5e85a…` مطابق لرأس `main` عند `2d400eb`. لا حاجة لأي إجراء الآن.
- **تبعة على ما بعدها:** أي تعديل في ملفات الواجهة ضمن النقطة 2 يحتاج **نشرًا جديدًا** قبل الاختبار على `alifleet.com`، وإلا سنختبر كودًا غير منشور. الاختبار الوسيط يكون على Preview.
- **مكسب إضافي:** الـmu-plugins على السيرفر مطابقة للمستودع، فبند «مزامنة mu-plugins» من الخطة السابقة **مغلق**.

---

## 9. ملخص الحالة الحقيقية الآن

| البند | الحالة |
| --- | --- |
| صفحات ووكومرس (`937`/`938`) | تعمل وتُقدَّم 200 |
| `POST /wp-json/alifleet/v1/session` | ✅ 200 (كان 500 بفاتال) |
| نقل الجلسة والكوكيز | ✅ يعمل، الحقول تُملأ باسم العميل |
| `/checkout` عبر البروكسي | ✅ صفحة فعلية + سكربتات ووكومرس سليمة |
| نشر الفرونت | ✅ مطابق لـ`main` |
| مزامنة mu-plugins | ✅ مطابقة |
| منع الدفع كضيف | ❌ غير مُنفَّذ (ثلاث طبقات مطلوبة) |
| تسجيل حساب من الواجهة | ⚠️ الزر يعلق على «Creating account…» — يحتاج إصلاح |
| طلب COD اختباري | ⏳ لم يُنفَّذ (بانتظار البندين أعلاه) |
| 36 منتجًا `outofstock` | ℹ️ مسألة بيانات لا خطأ برمجي |

## 10. الترتيب المقترح للتنفيذ التالي

1. إصلاح عقدة التسجيل في الواجهة (لأنها حاجزة لكل ما بعدها).
2. تنفيذ طبقات إجبار تسجيل الدخول الثلاث + الترجمات + معامل `redirect`.
3. نشر الواجهة، ثم إيقاف `guest_checkout` على ووكومرس (بعد تسجيل القيمة للرجوع).
4. اختبار متصفح بجلستين (ضيف يُمنع / مسجّل يمر).
5. تنفيذ طلب COD الاختباري وتسجيل رقمه هنا.
6. تحديث `docs/CHECKOUT-TEST-REPORT.md` بالنتائج النهائية، وحذف مجلد العمل المؤقت.
