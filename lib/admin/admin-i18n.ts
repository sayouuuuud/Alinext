export type AdminLocale = 'ar' | 'he' | 'en'

export type AdminDictionary = {
  brand: string
  title: string
  subtitle: string
  dir: 'rtl' | 'ltr'
  tabs: {
    dashboard: string
    pages: string
    cars: string
    products: string
    blog: string
    orders: string
    inquiries?: string
    customers: string
    settings: string
  }
  header: {
    viewSite: string
    saveAll: string
    saving: string
    savedSuccess: string
    themeLight: string
    themeDark: string
    language: string
    adminUser: string
  }
  dashboard: {
    welcome: string
    welcomeSub: string
    totalCars: string
    totalProducts: string
    totalArticles: string
    newInquiries: string
    quickActions: string
    addCar: string
    addProduct: string
    writeArticle: string
    editHome: string
    recentInquiries: string
    recentInquiriesSub: string
    systemStatus: string
    systemStatusOk: string
    storageUsed: string
    lastSavedAt: string
    carsOverview: string
  }
  pagesEditor: {
    title: string
    subtitle: string
    selectPage: string
    homeTab: string
    contactTab: string
    policiesTab: string
    heroSection: string
    statsSection: string
    marqueeSection: string
    globalReachSection: string
    servicesSection: string
    ctaSection: string
    headlineLine1: string
    headlineLine2: string
    headlineLine3: string
    headlineLine4: string
    heroSubtitle: string
    badgeText: string
    buttonSale: string
    buttonImport: string
    buttonShowroom: string
    addStat: string
    addService: string
    addMarquee: string
    remove: string
    statValue: string
    statLabel: string
    serviceTitle: string
    serviceSubtitle: string
    serviceDesc: string
    serviceFeatures: string
    contactDetailsTitle: string
    socialLinksTitle: string
  }
  carsManager: {
    title: string
    subtitle: string
    addNewCar: string
    editCar: string
    deleteCar: string
    deleteConfirm: string
    searchPlaceholder: string
    filterAll: string
    filterSale: string
    filterImport: string
    filterAvailable: string
    filterReserved: string
    filterSold: string
    filterIncoming: string
    typeLabel: string
    makeLabel: string
    modelLabel: string
    yearLabel: string
    priceLabel: string
    statusLabel: string
    mileageLabel: string
    fuelLabel: string
    transmissionLabel: string
    imageLabel: string
    featuredLabel: string
    specsLabel: string
    engine: string
    horsepower: string
    acceleration: string
    topSpeed: string
    bodyType: string
    color: string
    saveCar: string
    cancel: string
    carTitleMulti: string
    carDescMulti: string
  }
  productsManager: {
    title: string
    subtitle: string
    addNewProduct: string
    editProduct: string
    deleteProduct: string
    deleteConfirm: string
    searchPlaceholder: string
    nameLabel: string
    skuLabel: string
    categoryLabel: string
    priceLabel: string
    inStockLabel: string
    compatibilityLabel: string
    imageLabel: string
    descLabel: string
    inStock: string
    outOfStock: string
    saveProduct: string
    cancel: string
  }
  blogManager: {
    title: string
    subtitle: string
    addNewArticle: string
    editArticle: string
    deleteArticle: string
    deleteConfirm: string
    searchPlaceholder: string
    articleTitle: string
    slugLabel: string
    authorLabel: string
    dateLabel: string
    readTimeLabel: string
    coverImageLabel: string
    tagsLabel: string
    excerptLabel: string
    contentLabel: string
    saveArticle: string
    cancel: string
  }
  inquiries: {
    title: string
    subtitle: string
    filterAll: string
    filterNew: string
    filterContacted: string
    filterResolved: string
    clientName: string
    email: string
    phone: string
    serviceRequired: string
    date: string
    status: string
    actions: string
    statusNew: string
    statusContacted: string
    statusResolved: string
    markContacted: string
    markResolved: string
    openWhatsApp: string
    sendEmail: string
    emptyState: string
  }
  orders: {
    title: string
    subtitle: string
    searchPlaceholder: string
    filterAll: string
    filterPending: string
    filterConfirmed: string
    filterProcessing: string
    filterShipping: string
    filterDelivered: string
    filterCancelled: string
    orderNumber: string
    customer: string
    phone: string
    date: string
    itemsCount: string
    totalAmount: string
    paymentMethod: string
    paymentStatus: string
    orderStatus: string
    actions: string
    viewDetails: string
    updateStatus: string
    trackingNumber: string
    carrier: string
    estimatedDelivery: string
    shippingAddress: string
    orderedItems: string
    notes: string
    saveChanges: string
    printInvoice: string
    emptyState: string
    statusPending: string
    statusConfirmed: string
    statusProcessing: string
    statusShipping: string
    statusDelivered: string
    statusCancelled: string
  }
  customers: {
    title: string
    subtitle: string
    addNewCustomer: string
    editCustomer: string
    deleteCustomer: string
    deleteConfirm: string
    searchPlaceholder: string
    filterAllTiers: string
    filterVip: string
    filterPlatinum: string
    filterGold: string
    filterRegular: string
    filterAllStatus: string
    filterActive: string
    filterSuspended: string
    filterPending: string
    nameLabel: string
    emailLabel: string
    phoneLabel: string
    tierLabel: string
    statusLabel: string
    joinedDate: string
    totalSpent: string
    ordersCount: string
    billingAddress: string
    shippingAddress: string
    notesLabel: string
    interestedInLabel: string
    ordersHistory: string
    orderNumber: string
    orderDate: string
    orderTotal: string
    orderStatus: string
    orderItems: string
    noOrders: string
    saveCustomer: string
    cancel: string
    emptyState: string
    openWhatsApp: string
    sendEmail: string
  }
  settings: {
    title: string
    subtitle: string
    subtabs: {
      security: string
      commerce: string
      branding: string
      notifications: string
      seo: string
      maintenance: string
      backup: string
    }
    security: {
      title: string
      subtitle: string
      currentPassword: string
      newPassword: string
      confirmPassword: string
      changePasswordBtn: string
      passwordChangedSuccess: string
      passwordMismatchError: string
      wrongPasswordError: string
      passwordEmptyError: string
      usernameLabel: string
      adminEmailLabel: string
      twoFactorTitle: string
      twoFactorDesc: string
      sessionTimeoutLabel: string
      min15: string
      min30: string
      hour1: string
      day1: string
      saveAccountDetails: string
    }
    commerce: {
      title: string
      subtitle: string
      currencyLabel: string
      currencyPosLabel: string
      posBefore: string
      posAfter: string
      taxRateLabel: string
      freeShippingLabel: string
      paymentMethodsTitle: string
      cardPayment: string
      paypal: string
      bankWire: string
      cashOnDelivery: string
      whatsappCheckout: string
    }
    branding: {
      title: string
      subtitle: string
      logoLight: string
      logoDark: string
      favicon: string
      tagline: string
      accentColor: string
    }
    notifications: {
      title: string
      subtitle: string
      alertEmail: string
      alertWhatsapp: string
      soundAlerts: string
      autoReply: string
    }
    seo: {
      title: string
      subtitle: string
      ga4: string
      pixel: string
      searchConsole: string
      defaultTitle: string
      defaultDesc: string
    }
    maintenance: {
      title: string
      subtitle: string
      enableMaintenance: string
      maintenanceWarning: string
      message: string
      allowedIps: string
    }
    backup: {
      title: string
      subtitle: string
      exportBtn: string
      importBtn: string
      importPrompt: string
      resetBtn: string
      resetConfirm: string
    }
  }
  common: {
    arabic: string
    english: string
    hebrew: string
    switchLanguage: string
    allLanguages: string
    save: string
    cancel: string
    delete: string
    edit: string
    view: string
    loading: string
    noData: string
  }
}

export const adminI18n: Record<AdminLocale, AdminDictionary> = {
  ar: {
    brand: 'علي فليت',
    title: 'لوحة التحكم الإدارية',
    subtitle: 'إدارة أسطول المركبات ومحتوى الموقع بكافة التفاصيل',
    dir: 'rtl',
    tabs: {
      dashboard: 'الرئيسية والإحصائيات',
      pages: 'محرر الصفحات والأقسام',
      cars: 'أسطول السيارات',
      products: 'قطع الغيار والكتالوج',
      blog: 'المدونة والمقالات',
      orders: 'إدارة الطلبات والشحن',
      inquiries: 'الرسائل والطلبات',
      customers: 'العملاء وكبار الشخصيات',
      settings: 'الإعدادات المتقدمة والأمان',
    },
    header: {
      viewSite: 'معاينة الموقع الحي',
      saveAll: 'حفظ جميع التغييرات',
      saving: 'جارٍ الحفظ…',
      savedSuccess: 'تم حفظ كافة التغييرات بنجاح!',
      themeLight: 'الوضع الفاتح',
      themeDark: 'الوضع الداكن',
      language: 'لغة اللوحة',
      adminUser: 'المدير التنفيذي',
    },
    dashboard: {
      welcome: 'مرحباً بك في لوحة تحكم علي فليت',
      welcomeSub: 'تحكم في أسطول سياراتك، حسابات العملاء، وقطع الغيار، وإعدادات الأمان بـ 3 لغات بكل سلاسة وفخامة.',
      totalCars: 'إجمالي السيارات',
      totalProducts: 'قطع الغيار',
      totalArticles: 'مقالات المدونة',
      newInquiries: 'الطلبات الجديدة',
      quickActions: 'إجراءات سريعة',
      addCar: 'إضافة سيارة جديدة',
      addProduct: 'إضافة قطعة غيار',
      writeArticle: 'كتابة مقال جديد',
      editHome: 'تعديل نصوص الرئيسية',
      recentInquiries: 'أحدث طلبات واستفسارات العملاء',
      recentInquiriesSub: 'رسائل حية واردة من نماذج الاتصال وحجز السيارات بالموقع',
      systemStatus: 'حالة النظام والمزامنة',
      systemStatusOk: 'متصل ويعمل بكفاءة فائقة (Live Sync)',
      storageUsed: 'المساحة المخزنة',
      lastSavedAt: 'آخر حفظ تم في',
      carsOverview: 'نظرة عامة على الأسطول',
    },
    pagesEditor: {
      title: 'محرر الصفحات والأقسام المرئي',
      subtitle: 'تعديل جميع النصوص والعناوين والشرائح باللغات الثلاث (العربية، العبرية، الإنجليزية)',
      selectPage: 'اختر الصفحة المراد تعديلها',
      homeTab: 'الصفحة الرئيسية',
      contactTab: 'صفحة التواصل',
      policiesTab: 'السياسات والبنود',
      heroSection: 'قسم البداية (Hero Section)',
      statsSection: 'شريط الأرقام والإحصائيات (Stats Strip)',
      marqueeSection: 'شريط الماركات المتحرك (Marquee Strip)',
      globalReachSection: 'قسم الحضور العالمي (Global Reach)',
      servicesSection: 'قسم الخدمات الفاخرة (Services)',
      ctaSection: 'قسم الدعوة لاتخاذ إجراء (CTA Section)',
      headlineLine1: 'السطر الأول من العنوان الرئيسي',
      headlineLine2: 'السطر الثاني',
      headlineLine3: 'السطر الثالث',
      headlineLine4: 'السطر الرابع',
      heroSubtitle: 'الوصف الفرعي لقسم البداية',
      badgeText: 'شارة التميز العلوية',
      buttonSale: 'نص زر سيارات البيع',
      buttonImport: 'نص زر طلب الاستيراد',
      buttonShowroom: 'نص زر زيارة المعرض',
      addStat: 'إضافة إحصائية جديدة',
      addService: 'إضافة خدمة فاخرة',
      addMarquee: 'إضافة ماركة متحركة',
      remove: 'حذف',
      statValue: 'القيمة الرقمية (مثال: 500+)',
      statLabel: 'نص التسمية والتوضيح',
      serviceTitle: 'عنوان الخدمة',
      serviceSubtitle: 'العنوان الفرعي للخدمة',
      serviceDesc: 'شرح وتفاصيل الخدمة',
      serviceFeatures: 'المزايا والنقاط الرئيسية',
      contactDetailsTitle: 'بيانات التواصل والفرع',
      socialLinksTitle: 'روابط حسابات التواصل الاجتماعي',
    },
    carsManager: {
      title: 'إدارة أسطول السيارات',
      subtitle: 'إضافة وتعديل وحذف سيارات البيع والاستيراد مع المواصفات والأسعار',
      addNewCar: 'إضافة سيارة جديدة للأسطول',
      editCar: 'تعديل بيانات السيارة',
      deleteCar: 'حذف السيارة',
      deleteConfirm: 'هل أنت متأكد من حذف هذه السيارة من الأسطول؟',
      searchPlaceholder: 'ابحث عن سيارة بالاسم أو الماركة أو الموديل…',
      filterAll: 'كافة السيارات',
      filterSale: 'سيارات للبيع المباشر',
      filterImport: 'سيارات للاستيراد المخصص',
      filterAvailable: 'متوفرة الآن',
      filterReserved: 'محجوزة',
      filterSold: 'تم البيع',
      filterIncoming: 'قادمة قريباً',
      typeLabel: 'نوع العرض',
      makeLabel: 'الشركة المصنعة (Make)',
      modelLabel: 'طراز السيارة (Model)',
      yearLabel: 'سنة الصنع',
      priceLabel: 'السعر الإجمالي',
      statusLabel: 'حالة التوفر',
      mileageLabel: 'المسافة المقطوعة',
      fuelLabel: 'نوع الوقود والمحرك',
      transmissionLabel: 'ناقل الحركة',
      imageLabel: 'رابط صورة السيارة',
      featuredLabel: 'عرض كسيارة مميزة بالصفحة الرئيسية',
      specsLabel: 'المواصفات الفنية المتقدمة',
      engine: 'سعة وقوة المحرك',
      horsepower: 'القدرة الحصانية',
      acceleration: 'التسارع (0-100 كم/س)',
      topSpeed: 'السرعة القصوى',
      bodyType: 'نمط الهيكل الخارجي',
      color: 'اللون الخارجي / الداخلي',
      saveCar: 'حفظ السيارة في الأسطول',
      cancel: 'إلغاء التعديل',
      carTitleMulti: 'عنوان واسم السيارة (بـ 3 لغات)',
      carDescMulti: 'وصف ومزايا السيارة (بـ 3 لغات)',
    },
    productsManager: {
      title: 'إدارة قطع الغيار والكتالوج',
      subtitle: 'إدارة الكتالوج، الأسعار، التوافق مع الموديلات، وحالة المخزون',
      addNewProduct: 'إضافة قطعة غيار جديدة',
      editProduct: 'تعديل قطعة الغيار',
      deleteProduct: 'حذف القطعة',
      deleteConfirm: 'هل أنت متأكد من حذف هذا المنتج؟',
      searchPlaceholder: 'ابحث عن قطعة برقم القطعة (SKU) أو الاسم…',
      nameLabel: 'اسم قطعة الغيار (بـ 3 لغات)',
      skuLabel: 'رقم القطعة التسلسلي (SKU)',
      categoryLabel: 'التصنيف',
      priceLabel: 'السعر',
      inStockLabel: 'حالة التوفر بالمخزون',
      compatibilityLabel: 'الموديلات المتوافقة معها',
      imageLabel: 'رابط صورة القطعة',
      descLabel: 'شرح ومواصفات القطعة (بـ 3 لغات)',
      inStock: 'متوفر بالمخزون',
      outOfStock: 'غير متوفر حالياً',
      saveProduct: 'حفظ القطعة',
      cancel: 'إلغاء',
    },
    blogManager: {
      title: 'إدارة مقالات المدونة',
      subtitle: 'نشر وتعديل أحدث الأخبار والدلائل الإرشادية لعملاء الأسطول',
      addNewArticle: 'كتابة مقال جديد',
      editArticle: 'تعديل المقال',
      deleteArticle: 'حذف المقال',
      deleteConfirm: 'هل أنت متأكد من حذف هذا المقال نهائياً؟',
      searchPlaceholder: 'ابحث في المقالات بالعنوان أو الكلمات الدلالية…',
      articleTitle: 'عنوان المقال (بـ 3 لغات)',
      slugLabel: 'الرابط الدائم (Slug)',
      authorLabel: 'اسم الكاتب أو الفريق',
      dateLabel: 'تاريخ النشر',
      readTimeLabel: 'وقت القراءة المتوقع (مثال: 5 min)',
      coverImageLabel: 'رابط صورة الغلاف',
      tagsLabel: 'الوسوم (مفصولة بفواصل)',
      excerptLabel: 'المقتطف التعريفي (بـ 3 لغات)',
      contentLabel: 'نص المقال الكامل (بـ 3 لغات)',
      saveArticle: 'نشر وحفظ المقال',
      cancel: 'إلغاء',
    },
    inquiries: {
      title: 'طلبات العملاء والرسائل الواردة',
      subtitle: 'متابعة استفسارات الشراء، الاستيراد، وتجهيز المقصورات الواردة من الموقع',
      filterAll: 'كافة الرسائل',
      filterNew: 'جديدة',
      filterContacted: 'تم التواصل',
      filterResolved: 'مكتملة',
      clientName: 'اسم العميل',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      serviceRequired: 'الخدمة / السيارة المطلوبة',
      date: 'تاريخ وتوقيت الطلب',
      status: 'حالة الطلب',
      actions: 'إجراءات التواصل',
      statusNew: 'طلب جديد',
      statusContacted: 'جاري المتابعة',
      statusResolved: 'تم بنجاح',
      markContacted: 'تعيين كـ "تم التواصل"',
      markResolved: 'تعيين كـ "مكتمل"',
      openWhatsApp: 'محادثة عبر واتساب',
      sendEmail: 'إرسال بريد إلكتروني',
      emptyState: 'لا توجد طلبات تطابق الفلتر المختار حالياً.',
    },
    orders: {
      title: 'إدارة وتتبع طلبات العملاء',
      subtitle: 'متابعة الطلبات، تحديث حالات الشحن، وتعيين أرقام التتبع والناقل',
      searchPlaceholder: 'ابحث برقم الطلب #ORD، اسم العميل، أو الهاتف…',
      filterAll: 'كافة الطلبات',
      filterPending: 'قيد المراجعة',
      filterConfirmed: 'تم التأكيد',
      filterProcessing: 'قيد التجهيز',
      filterShipping: 'جاري التوصيل',
      filterDelivered: 'تم التسليم',
      filterCancelled: 'ملغي',
      orderNumber: 'رقم الطلب',
      customer: 'العميل',
      phone: 'الهاتف',
      date: 'تاريخ الطلب',
      itemsCount: 'المنتجات',
      totalAmount: 'المبلغ الإجمالي',
      paymentMethod: 'طريقة الدفع',
      paymentStatus: 'حالة الدفع',
      orderStatus: 'حالة الطلب',
      actions: 'الإجراءات',
      viewDetails: 'عرض الفاتورة والتفاصيل',
      updateStatus: 'تحديث الحالة',
      trackingNumber: 'رقم التتبع (Tracking Code)',
      carrier: 'شركة الشحن / الناقل',
      estimatedDelivery: 'الموعد المتوقع للوصول',
      shippingAddress: 'عنوان التوصيل والشحن',
      orderedItems: 'المنتجات والقطع المطلوبة',
      notes: 'ملاحظات إدارية',
      saveChanges: 'حفظ وتحديث الطلب',
      printInvoice: 'طباعة الفاتورة',
      emptyState: 'لا توجد طلبات مسجلة حالياً ضمن هذا التصنيف.',
      statusPending: 'قيد المراجعة',
      statusConfirmed: 'تم تأكيد الطلب',
      statusProcessing: 'قيد التجهيز والفحص',
      statusShipping: 'جاري الشحن والتوصيل',
      statusDelivered: 'تم التسليم بنجاح',
      statusCancelled: 'تم إلغاء الطلب',
    },
    customers: {
      title: 'إدارة العملاء وكبار الشخصيات (VIP)',
      subtitle: 'استعراض الحسابات، تعديل البيانات، سجل المشتريات، والعناوين',
      addNewCustomer: 'إضافة عميل جديد',
      editCustomer: 'تعديل بيانات العميل',
      deleteCustomer: 'حذف حساب العميل',
      deleteConfirm: 'هل أنت متأكد من حذف هذا العميل وسجل طلباته نهائياً؟',
      searchPlaceholder: 'ابحث بالاسم أو البريد أو الهاتف أو المدينة…',
      filterAllTiers: 'كافة المستويات',
      filterVip: 'عملاء VIP',
      filterPlatinum: 'بلاتينيوم (Platinum)',
      filterGold: 'ذهبي (Gold)',
      filterRegular: 'عادي (Regular)',
      filterAllStatus: 'كافة الحالات',
      filterActive: 'نشط',
      filterSuspended: 'معلّق',
      filterPending: 'قيد المراجعة',
      nameLabel: 'اسم العميل الكامل',
      emailLabel: 'البريد الإلكتروني',
      phoneLabel: 'رقم الهاتف',
      tierLabel: 'مستوى وتصنيف العميل',
      statusLabel: 'حالة الحساب',
      joinedDate: 'تاريخ الانضمام',
      totalSpent: 'إجمالي المشتريات',
      ordersCount: 'عدد الطلبات',
      billingAddress: 'عنوان الفوترة (Billing Address)',
      shippingAddress: 'عنوان الشحن والتسليم (Shipping Address)',
      notesLabel: 'ملاحظات إدارية سرية',
      interestedInLabel: 'السيارات أو الخدمات المفضلة لديه',
      ordersHistory: 'سجل الطلبات والعمليات',
      orderNumber: 'رقم الطلب',
      orderDate: 'التاريخ',
      orderTotal: 'المبلغ',
      orderStatus: 'الحالة',
      orderItems: 'المنتجات / السيارات',
      noOrders: 'لا توجد طلبات سابقة لهذا العميل بعد.',
      saveCustomer: 'حفظ بيانات العميل',
      cancel: 'إلغاء',
      emptyState: 'لا يوجد عملاء يطابقون الفلتر المختار.',
      openWhatsApp: 'محادثة واتساب',
      sendEmail: 'مراسلة عبر البريد',
    },
    settings: {
      title: 'مركز الإعدادات المتقدمة والأمان',
      subtitle: 'تغيير كلمة المرور، إدارة الهوية البصرية، المدفوعات، الإشعارات، وSEO',
      subtabs: {
        security: 'الأمان والحساب',
        commerce: 'التجارة والمدفوعات',
        branding: 'الهوية البصرية',
        notifications: 'الإشعارات والتنبيهات',
        seo: 'محركات البحث وSEO',
        maintenance: 'وضع الصيانة',
        backup: 'النسخ الاحتياطي',
      },
      security: {
        title: 'أمان لوحة التحكم وكلمة المرور',
        subtitle: 'تغيير كلمة مرور الأدمن وإدارة صلاحيات الجلسة والتحقق الثنائي',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور الجديدة',
        changePasswordBtn: 'تحديث كلمة المرور',
        passwordChangedSuccess: 'تم تغيير كلمة المرور بنجاح! احتفظ بها في مكان آمن.',
        passwordMismatchError: 'كلمة المرور الجديدة وتأكيدها غير متطابقين!',
        wrongPasswordError: 'كلمة المرور الحالية غير صحيحة!',
        passwordEmptyError: 'يرجى إدخال كلمة مرور جديدة لا تقل عن 6 خانات.',
        usernameLabel: 'اسم مستخدم الأدمن',
        adminEmailLabel: 'البريد الإلكتروني للإدارة',
        twoFactorTitle: 'التحقق بخطوتين (2FA Security)',
        twoFactorDesc: 'طلب رمز إضافي عند تسجيل الدخول لحماية أمان اللوحة',
        sessionTimeoutLabel: 'مهلة انتهاء الجلسة التلقائية',
        min15: '15 دقيقة',
        min30: '30 دقيقة',
        hour1: 'ساعة واحدة',
        day1: 'يوم كامل',
        saveAccountDetails: 'حفظ بيانات الحساب',
      },
      commerce: {
        title: 'إعدادات التجارة والمدفوعات',
        subtitle: 'تحديد العملة، نسبة الضريبة، خيارات الشحن، وطرق الدفع المقبولة',
        currencyLabel: 'رمز العملة الأساسية (Currency)',
        currencyPosLabel: 'موقع رمز العملة',
        posBefore: 'قبل السعر (مثال: ₪ 100)',
        posAfter: 'بعد السعر (مثال: 100 ₪)',
        taxRateLabel: 'نسبة الضريبة / القيمة المضافة (VAT %)',
        freeShippingLabel: 'حد الشحن المجاني (المبلغ الأدنى)',
        paymentMethodsTitle: 'بوابات وطرق الدفع المفعّلة',
        cardPayment: 'بطاقات الائتمان (Visa / Mastercard / Stripe)',
        paypal: 'باي بال (PayPal)',
        bankWire: 'تحويل بنكي مباشر (Wire Transfer)',
        cashOnDelivery: 'الدفع نقداً عند الاستلام (COD)',
        whatsappCheckout: 'إتمام الطلب عبر واتساب المباشر',
      },
      branding: {
        title: 'الهوية البصرية والعلامة التجارية',
        subtitle: 'تخصيص الشعار، الأيقونة، الشعار اللفظي، واللون الأساسي للموقع',
        logoLight: 'رابط الشعار للوضع الفاتح (Logo Light)',
        logoDark: 'رابط الشعار للوضع الداكن (Logo Dark)',
        favicon: 'رابط أيقونة المتصفح (Favicon URL)',
        tagline: 'الشعار اللفظي للعلامة التجارية (Slogan بـ 3 لغات)',
        accentColor: 'اللون المميز للعلامة التجارية (Brand Accent Color)',
      },
      notifications: {
        title: 'إدارة الإشعارات والتنبيهات الفورية',
        subtitle: 'تحديد قنوات التنبيه عند وصول طلب شراء أو استفسار جديد',
        alertEmail: 'البريد الإلكتروني لاستقبال التنبيهات',
        alertWhatsapp: 'رقم الواتساب لاستقبال تنبيهات فريق المبيعات',
        soundAlerts: 'تشغيل نغمة تنبيه صوتية عند ورود استفسار جديد',
        autoReply: 'إرسال بريد تأكيد تلقائي للعميل فور تقديم طلبه',
      },
      seo: {
        title: 'تهيئة محركات البحث والتحليلات (SEO)',
        subtitle: 'ربط أدوات التحليل وعناوين الميتا الافتراضية بـ 3 لغات',
        ga4: 'معرّف Google Analytics 4 (Measurement ID)',
        pixel: 'معرّف Meta Pixel ID (Facebook Ads)',
        searchConsole: 'كود التحقق من Google Search Console',
        defaultTitle: 'عنوان الموقع الافتراضي لمحركات البحث (Title بـ 3 لغات)',
        defaultDesc: 'الوصف الافتراضي في نتائج البحث (Description بـ 3 لغات)',
      },
      maintenance: {
        title: 'وضع الصيانة وإيقاف الموقع المؤقت',
        subtitle: 'إغلاق واجهة الموقع مؤقتاً للزوار مع رسالة توضيحية بـ 3 لغات',
        enableMaintenance: 'تفعيل وضع الصيانة للموقع',
        maintenanceWarning: 'عند التفعيل، سيرى الزوار شاشة الصيانة فقط، بينما يظل بإمكانك الوصول للوحة الأدمن.',
        message: 'رسالة الصيانة التوضيحية للزوار (بـ 3 لغات)',
        allowedIps: 'عناوين IP المستثناة من الصيانة (مفصولة بفواصل)',
      },
      backup: {
        title: 'إدارة النسخ الاحتياطي والبيانات',
        subtitle: 'تنزيل ملف نسخة احتياطية شاملة لكافة البيانات واستعادتها بأمان',
        exportBtn: 'تحميل نسخة احتياطية كاملة (JSON Snapshot)',
        importBtn: 'استعادة نسخة احتياطية سابقة',
        importPrompt: 'قم بلصق محتوى ملف الـ JSON هنا للاستعادة:',
        resetBtn: 'إعادة ضبط النظام إلى إعدادات المصنع الأصلية',
        resetConfirm: 'تحذير: سيتم حذف جميع التعديلات والعودة لبيانات المصنع. هل أنت متأكد؟',
      },
    },
    common: {
      arabic: 'العربية',
      english: 'English',
      hebrew: 'עברית',
      switchLanguage: 'تغيير اللغة',
      allLanguages: 'جميع اللغات (AR / EN / HE)',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'معاينة',
      loading: 'جارٍ التحميل…',
      noData: 'لا توجد بيانات متاحة',
    },
  },
  en: {
    brand: 'ALI FLEET',
    title: 'Executive Admin Suite',
    subtitle: 'Comprehensive control over luxury vehicle fleet, parts & all website content',
    dir: 'ltr',
    tabs: {
      dashboard: 'Dashboard & Overview',
      pages: 'Page & Section Editor',
      cars: 'Fleet Management',
      products: 'Parts & Store Catalog',
      blog: 'Blog & Articles',
      orders: 'Orders Management',
      inquiries: 'Inquiries & Leads',
      customers: 'Customers & VIPs',
      settings: 'Advanced Settings & Security',
    },
    header: {
      viewSite: 'Preview Live Website',
      saveAll: 'Save All Changes',
      saving: 'Saving…',
      savedSuccess: 'All changes successfully synchronized!',
      themeLight: 'Light Mode',
      themeDark: 'Dark Mode',
      language: 'Admin Language',
      adminUser: 'Managing Director',
    },
    dashboard: {
      welcome: 'Welcome to ALI FLEET Admin Suite',
      welcomeSub: 'Manage your premier automotive inventory, client relationships, security, and translations seamlessly.',
      totalCars: 'Total Fleet Vehicles',
      totalProducts: 'Parts & Accessories',
      totalArticles: 'Blog Articles',
      newInquiries: 'New Inquiries',
      quickActions: 'Quick Actions',
      addCar: 'Add New Vehicle',
      addProduct: 'Add Spare Part',
      writeArticle: 'Draft Article',
      editHome: 'Edit Homepage Copy',
      recentInquiries: 'Recent Client Leads',
      recentInquiriesSub: 'Live inquiries received via contact forms and reservation requests',
      systemStatus: 'System & Synchronization Status',
      systemStatusOk: 'Connected & Synced (Live Storage)',
      storageUsed: 'Database Storage',
      lastSavedAt: 'Last saved at',
      carsOverview: 'Fleet Distribution',
    },
    pagesEditor: {
      title: 'Visual Pages & Sections Editor',
      subtitle: 'Modify titles, descriptions, and banners across all 3 languages (AR, HE, EN)',
      selectPage: 'Select Page to Edit',
      homeTab: 'Homepage',
      contactTab: 'Contact & Showroom',
      policiesTab: 'Legal & Policies',
      heroSection: 'Hero Showcase Section',
      statsSection: 'Numerical Stats Strip',
      marqueeSection: 'Luxury Brands Marquee',
      globalReachSection: 'Global Sourcing & Reach',
      servicesSection: 'Executive VIP Services',
      ctaSection: 'Call to Action Section',
      headlineLine1: 'Headline Line 1',
      headlineLine2: 'Headline Line 2',
      headlineLine3: 'Headline Line 3',
      headlineLine4: 'Headline Line 4',
      heroSubtitle: 'Hero Subtitle & Paragraph',
      badgeText: 'Top Floating Badge',
      buttonSale: 'Sale CTA Button Text',
      buttonImport: 'Import CTA Button Text',
      buttonShowroom: 'Showroom Button Text',
      addStat: 'Add Metric',
      addService: 'Add VIP Service',
      addMarquee: 'Add Brand',
      remove: 'Delete',
      statValue: 'Numeric Value (e.g. 500+)',
      statLabel: 'Label & Descriptor',
      serviceTitle: 'Service Title',
      serviceSubtitle: 'Service Subtitle',
      serviceDesc: 'Full Service Explanation',
      serviceFeatures: 'Core Bullet Highlights',
      contactDetailsTitle: 'Location & Phone Details',
      socialLinksTitle: 'Official Social Media Handles',
    },
    carsManager: {
      title: 'Fleet & Vehicle Catalog',
      subtitle: 'Create, update, and manage showroom and custom import stock',
      addNewCar: 'Add Vehicle to Fleet',
      editCar: 'Edit Vehicle Details',
      deleteCar: 'Remove Vehicle',
      deleteConfirm: 'Are you sure you want to permanently delete this vehicle from the inventory?',
      searchPlaceholder: 'Search by model, brand, or year…',
      filterAll: 'All Vehicles',
      filterSale: 'Immediate Sale',
      filterImport: 'Custom Import',
      filterAvailable: 'Available Now',
      filterReserved: 'Reserved',
      filterSold: 'Sold Out',
      filterIncoming: 'Incoming',
      typeLabel: 'Inventory Category',
      makeLabel: 'Manufacturer (Make)',
      modelLabel: 'Model Name',
      yearLabel: 'Year of Production',
      priceLabel: 'Asking Price',
      statusLabel: 'Availability Status',
      mileageLabel: 'Odometer Mileage',
      fuelLabel: 'Powertrain & Fuel',
      transmissionLabel: 'Transmission Type',
      imageLabel: 'Vehicle Image URL',
      featuredLabel: 'Highlight on Homepage Fleet Strip',
      specsLabel: 'Engineering & Performance Specs',
      engine: 'Displacement / Engine',
      horsepower: 'Horsepower (HP)',
      acceleration: 'Acceleration (0-100 km/h)',
      topSpeed: 'Top Speed',
      bodyType: 'Body Style',
      color: 'Colorway (Exterior / Interior)',
      saveCar: 'Save Vehicle',
      cancel: 'Cancel',
      carTitleMulti: 'Vehicle Title & Badge (3 Languages)',
      carDescMulti: 'Comprehensive Description (3 Languages)',
    },
    productsManager: {
      title: 'Parts & Store Catalog',
      subtitle: 'Maintain spare parts, aftermarket upgrades, SKU tracking, and compatibility',
      addNewProduct: 'Add New Part',
      editProduct: 'Edit Part Details',
      deleteProduct: 'Remove Part',
      deleteConfirm: 'Are you sure you want to delete this part from the catalog?',
      searchPlaceholder: 'Search by SKU, part name, or category…',
      nameLabel: 'Part Name (3 Languages)',
      skuLabel: 'Serial SKU Code',
      categoryLabel: 'Product Category',
      priceLabel: 'Unit Price',
      inStockLabel: 'Inventory Status',
      compatibilityLabel: 'Vehicle Compatibility Matrix',
      imageLabel: 'High-Res Photo URL',
      descLabel: 'Technical Description (3 Languages)',
      inStock: 'In Stock',
      outOfStock: 'Temporarily Unavailable',
      saveProduct: 'Save Part',
      cancel: 'Cancel',
    },
    blogManager: {
      title: 'Blog & Editorial Suite',
      subtitle: 'Publish articles, market analyses, and import guides for automotive enthusiasts',
      addNewArticle: 'Draft New Article',
      editArticle: 'Edit Article',
      deleteArticle: 'Delete Article',
      deleteConfirm: 'Are you sure you want to delete this article?',
      searchPlaceholder: 'Search articles by headline or tag…',
      articleTitle: 'Article Title (3 Languages)',
      slugLabel: 'Canonical URL Slug',
      authorLabel: 'Author / Department',
      dateLabel: 'Publish Date',
      readTimeLabel: 'Estimated Read Time (e.g. 5 min)',
      coverImageLabel: 'Cover Photograph URL',
      tagsLabel: 'Search Tags (comma-separated)',
      excerptLabel: 'Short Summary Excerpt (3 Languages)',
      contentLabel: 'Body Content (3 Languages)',
      saveArticle: 'Publish & Save',
      cancel: 'Cancel',
    },
    inquiries: {
      title: 'Customer Leads & Messages',
      subtitle: 'Manage inquiries, VIP appointments, and custom build requests',
      filterAll: 'All Messages',
      filterNew: 'New',
      filterContacted: 'In Progress',
      filterResolved: 'Resolved',
      clientName: 'Client Name',
      email: 'Email Address',
      phone: 'Phone Number',
      serviceRequired: 'Target Vehicle / Service',
      date: 'Timestamp',
      status: 'Status',
      actions: 'Direct Channels',
      statusNew: 'New Lead',
      statusContacted: 'Contacted',
      statusResolved: 'Completed',
      markContacted: 'Mark as Contacted',
      markResolved: 'Mark as Resolved',
      openWhatsApp: 'Chat on WhatsApp',
      sendEmail: 'Send Email',
      emptyState: 'No client inquiries found matching the active filter.',
    },
    orders: {
      title: 'Customer Orders & Fulfillment',
      subtitle: 'Track order progress, update fulfillment status, and assign carrier tracking numbers',
      searchPlaceholder: 'Search by #ORD number, customer name, or phone…',
      filterAll: 'All Orders',
      filterPending: 'Pending',
      filterConfirmed: 'Confirmed',
      filterProcessing: 'Processing',
      filterShipping: 'In Transit',
      filterDelivered: 'Delivered',
      filterCancelled: 'Cancelled',
      orderNumber: 'Order #',
      customer: 'Customer',
      phone: 'Phone',
      date: 'Date & Time',
      itemsCount: 'Items',
      totalAmount: 'Total Amount',
      paymentMethod: 'Payment Method',
      paymentStatus: 'Payment Status',
      orderStatus: 'Order Status',
      actions: 'Actions',
      viewDetails: 'View Invoice & Details',
      updateStatus: 'Update Status',
      trackingNumber: 'Tracking Number',
      carrier: 'Courier / Carrier',
      estimatedDelivery: 'Estimated Delivery',
      shippingAddress: 'Shipping Destination',
      orderedItems: 'Ordered Items & Quantities',
      notes: 'Admin Notes',
      saveChanges: 'Save & Update Order',
      printInvoice: 'Print Invoice',
      emptyState: 'No customer orders match the selected criteria.',
      statusPending: 'Pending Review',
      statusConfirmed: 'Order Confirmed',
      statusProcessing: 'Fulfillment & Inspection',
      statusShipping: 'Out for Delivery / In Transit',
      statusDelivered: 'Successfully Delivered',
      statusCancelled: 'Order Cancelled',
    },
    customers: {
      title: 'Customer & VIP Portfolio',
      subtitle: 'Manage client accounts, purchase histories, tiers, and delivery coordinates',
      addNewCustomer: 'Add New Client',
      editCustomer: 'Edit Client Profile',
      deleteCustomer: 'Remove Client',
      deleteConfirm: 'Are you sure you want to permanently delete this client account and their records?',
      searchPlaceholder: 'Search by client name, email, phone, or city…',
      filterAllTiers: 'All Tiers',
      filterVip: 'VIP Clients',
      filterPlatinum: 'Platinum Tier',
      filterGold: 'Gold Tier',
      filterRegular: 'Regular',
      filterAllStatus: 'All Statuses',
      filterActive: 'Active',
      filterSuspended: 'Suspended',
      filterPending: 'Pending Verification',
      nameLabel: 'Full Legal / Business Name',
      emailLabel: 'Email Address',
      phoneLabel: 'Telephone Number',
      tierLabel: 'VIP Classification Tier',
      statusLabel: 'Account Status',
      joinedDate: 'Membership Date',
      totalSpent: 'Lifetime Procurement Value',
      ordersCount: 'Order Count',
      billingAddress: 'Registered Billing Address',
      shippingAddress: 'Direct Shipping & Port Destination',
      notesLabel: 'Confidential Internal Notes',
      interestedInLabel: 'Fleet Preferences & Interests',
      ordersHistory: 'Acquisitions & Order History',
      orderNumber: 'Order ID',
      orderDate: 'Date',
      orderTotal: 'Total Value',
      orderStatus: 'Fulfillment Status',
      orderItems: 'Items / Vehicles',
      noOrders: 'No prior order history for this account yet.',
      saveCustomer: 'Save Client Details',
      cancel: 'Cancel',
      emptyState: 'No clients match the active filter criteria.',
      openWhatsApp: 'Direct WhatsApp',
      sendEmail: 'Send Email',
    },
    settings: {
      title: 'Advanced System & Security Settings',
      subtitle: 'Admin password management, branding, commerce rules, notifications & SEO',
      subtabs: {
        security: 'Security & Auth',
        commerce: 'Commerce & Billing',
        branding: 'Branding & Identity',
        notifications: 'Notifications',
        seo: 'SEO & Analytics',
        maintenance: 'Maintenance Mode',
        backup: 'Backups & Storage',
      },
      security: {
        title: 'Admin Authentication & Password Security',
        subtitle: 'Update control panel credentials, session lifetime, and multi-factor auth',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        changePasswordBtn: 'Update Password',
        passwordChangedSuccess: 'Password updated successfully! Keep your new credentials secure.',
        passwordMismatchError: 'New password and confirmation do not match!',
        wrongPasswordError: 'Current password provided is incorrect!',
        passwordEmptyError: 'Please enter a valid password (minimum 6 characters).',
        usernameLabel: 'Admin Username',
        adminEmailLabel: 'Administrative Email',
        twoFactorTitle: 'Two-Factor Authentication (2FA)',
        twoFactorDesc: 'Enforce one-time verification codes for dashboard logins',
        sessionTimeoutLabel: 'Automatic Session Timeout',
        min15: '15 Minutes',
        min30: '30 Minutes',
        hour1: '1 Hour',
        day1: '24 Hours',
        saveAccountDetails: 'Save Account Settings',
      },
      commerce: {
        title: 'Commerce & Financial Rules',
        subtitle: 'Configure currency position, tax rate (VAT), and checkout options',
        currencyLabel: 'Base Currency Symbol',
        currencyPosLabel: 'Currency Placement',
        posBefore: 'Before Amount (e.g. $ 100)',
        posAfter: 'After Amount (e.g. 100 ₪)',
        taxRateLabel: 'Value Added Tax (VAT %)',
        freeShippingLabel: 'Free VIP Delivery Threshold',
        paymentMethodsTitle: 'Enabled Payment Gateways',
        cardPayment: 'Credit Cards (Visa / Mastercard / Stripe)',
        paypal: 'PayPal Direct Checkout',
        bankWire: 'Bank Wire Transfer',
        cashOnDelivery: 'Cash on Delivery (COD)',
        whatsappCheckout: 'Instant WhatsApp Concierge Order',
      },
      branding: {
        title: 'Visual Identity & Assets',
        subtitle: 'Custom logos, browser favicon, multilingual tagline, and accent colors',
        logoLight: 'Light Mode Logo URL',
        logoDark: 'Dark Mode Logo URL',
        favicon: 'Browser Favicon URL',
        tagline: 'Brand Slogan & Tagline (3 Languages)',
        accentColor: 'Brand Primary Accent Color',
      },
      notifications: {
        title: 'Automated Dispatch & Alerts',
        subtitle: 'Configure notifications for new vehicle inquiries and store orders',
        alertEmail: 'Alerts Dispatch Email',
        alertWhatsapp: 'Sales WhatsApp Contact',
        soundAlerts: 'Play audible chime on incoming VIP inquiries',
        autoReply: 'Send automated confirmation email to clients upon request submission',
      },
      seo: {
        title: 'Search Optimization & Tracking',
        subtitle: 'Configure webmaster tracking codes and canonical multi-language meta tags',
        ga4: 'Google Analytics 4 (Measurement ID)',
        pixel: 'Meta Pixel ID (Facebook Ads)',
        searchConsole: 'Google Search Console Verification Tag',
        defaultTitle: 'Default Search Engine Title (3 Languages)',
        defaultDesc: 'Default Meta Description (3 Languages)',
      },
      maintenance: {
        title: 'Scheduled Maintenance Mode',
        subtitle: 'Temporarily pause public storefront with custom multilingual messaging',
        enableMaintenance: 'Enable Storefront Maintenance Mode',
        maintenanceWarning: 'When enabled, public visitors will see a maintenance notice while admin panel remains accessible.',
        message: 'Public Maintenance Announcement (3 Languages)',
        allowedIps: 'Whitelisted IP Addresses (comma-separated)',
      },
      backup: {
        title: 'Database Backups & Recovery',
        subtitle: 'Download complete state snapshots or restore historical backups',
        exportBtn: 'Download Full JSON Backup',
        importBtn: 'Restore JSON Snapshot',
        importPrompt: 'Paste your valid JSON snapshot payload here:',
        resetBtn: 'Restore Factory Baseline Defaults',
        resetConfirm: 'Warning: All custom records will be overwritten with original defaults. Proceed?',
      },
    },
    common: {
      arabic: 'العربية',
      english: 'English',
      hebrew: 'עברית',
      switchLanguage: 'Language',
      allLanguages: 'All Languages (AR / EN / HE)',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      loading: 'Loading…',
      noData: 'No records found',
    },
  },
  he: {
    brand: 'אלי פליט',
    title: 'לוח בקרת ניהול',
    subtitle: 'שליטה מלאה בצי רכבי הפאר, לקוחות, חלקי חילוף וכל תוכן האתר',
    dir: 'rtl',
    tabs: {
      dashboard: 'סקירה כללית ודשבורד',
      pages: 'עורך דפים ומדורים',
      cars: 'ניהול צי הרכבים',
      products: 'קטלוג חלפים וחנות',
      blog: 'בלוג ומאמרים',
      orders: 'ניהול הזמנות ומשלוחים',
      inquiries: 'פניות ולידים',
      customers: 'לקוחות ו-VIP',
      settings: 'הגדרות מתקדמות ואבטחה',
    },
    header: {
      viewSite: 'צפייה באתר הפעיל',
      saveAll: 'שמירת כל השינויים',
      saving: 'שומר שינויים…',
      savedSuccess: 'כל השינויים נשמרו וסונכרנו בהצלחה!',
      themeLight: 'מצב בהיר',
      themeDark: 'מצב כהה',
      language: 'שפת הלוח',
      adminUser: 'מנהל ראשי',
    },
    dashboard: {
      welcome: 'ברוך הבא ללוח הניהול של ALI FLEET',
      welcomeSub: 'נהל את צי רכבי היוקרה, תיקי הלקוחות, החלפים, האבטחה והתוכן בכל 3 השפות בסטנדרט הגבוה ביותר.',
      totalCars: 'סה״כ רכבים',
      totalProducts: 'חלפים ומוצרים',
      totalArticles: 'מאמרים בבלוג',
      newInquiries: 'פניות חדשות',
      quickActions: 'פעולות מהירות',
      addCar: 'הוספת רכב חדש',
      addProduct: 'הוספת חלק חילוף',
      writeArticle: 'כתיבת מאמר חדש',
      editHome: 'עריכת דף הבית',
      recentInquiries: 'פניות לקוחות אחרונות',
      recentInquiriesSub: 'הודעות ולידים שהתקבלו ישירות מטפסי האתר והזמנות רכב',
      systemStatus: 'סטטוס מערכת וסנכרון',
      systemStatusOk: 'מחובר ומסונכרן בזמן אמת (Live Sync)',
      storageUsed: 'נפח נתונים בשימוש',
      lastSavedAt: 'נשמר לאחרונה ב-',
      carsOverview: 'התפלגות צי הרכבים',
    },
    pagesEditor: {
      title: 'עורך דפים ומדורים ויזואלי',
      subtitle: 'עריכת כל הכותרות, התיאורים והכרזות בכל 3 השפות (עברית, ערבית, אנגלית)',
      selectPage: 'בחר דף לעריכה',
      homeTab: 'דף הבית',
      contactTab: 'יצירת קשר',
      policiesTab: 'מדיניות ותקנונים',
      heroSection: 'מדור פתיחה ראשי (Hero)',
      statsSection: 'פס מדדים ונתונים',
      marqueeSection: 'פס מותגי יוקרה נעים',
      globalReachSection: 'פריסה וייבוא גלובלי',
      servicesSection: 'שירותי VIP אקסקלוסיביים',
      ctaSection: 'קריאה לפעולה (CTA)',
      headlineLine1: 'שורה 1 בכותרת הראשית',
      headlineLine2: 'שורה 2',
      headlineLine3: 'שורה 3',
      headlineLine4: 'שורה 4',
      heroSubtitle: 'תיאור משנה של מדור הפתיחה',
      badgeText: 'תג יוקרה עליון',
      buttonSale: 'טקסט כפתור רכבים למכירה',
      buttonImport: 'טקסט כפתור ייבוא אישי',
      buttonShowroom: 'טקסט כפתור ביקור באולם',
      addStat: 'הוספת מדד חדש',
      addService: 'הוספת שירות VIP',
      addMarquee: 'הוספת מותג לרצועה',
      remove: 'מחיקה',
      statValue: 'ערך מספרי (לדוגמה: 500+)',
      statLabel: 'תווית והסבר',
      serviceTitle: 'שם השירות',
      serviceSubtitle: 'כותרת משנה לשירות',
      serviceDesc: 'תיאור השירות המלא',
      serviceFeatures: 'יתרונות ומאפיינים עיקריים',
      contactDetailsTitle: 'פרטי מיקום והתקשרות',
      socialLinksTitle: 'קישורי רשתות חברתיות רשמיים',
    },
    carsManager: {
      title: 'ניהול צי הרכבים',
      subtitle: 'הוספה, עריכה ומחיקה של רכבים למכירה מיידית וייבוא בהתאמה אישית',
      addNewCar: 'הוספת רכב חדש לצי',
      editCar: 'עריכת פרטי רכב',
      deleteCar: 'מחיקת רכב מהמאגר',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק רכב זה מצי הרכבים לצמיתות?',
      searchPlaceholder: 'חיפוש לפי יצרן, דגם או שנת ייצור…',
      filterAll: 'כל הרכבים',
      filterSale: 'רכבים למכירה מיידית',
      filterImport: 'הזמנת ייבוא אישי',
      filterAvailable: 'זמין באולם',
      filterReserved: 'בסטטוס שמור',
      filterSold: 'נמכר',
      filterIncoming: 'בדרך לישראל',
      typeLabel: 'סוג מלאי',
      makeLabel: 'יצרן (Make)',
      modelLabel: 'דגם (Model)',
      yearLabel: 'שנת ייצור',
      priceLabel: 'מחיר מבוקש',
      statusLabel: 'סטטוס זמינות',
      mileageLabel: 'קילומטראז׳',
      fuelLabel: 'מנוע וסוג דלק',
      transmissionLabel: 'תיבת הילוכים',
      imageLabel: 'קישור לתמונת הרכב',
      featuredLabel: 'הצג כרכב מובחר בדף הבית',
      specsLabel: 'מפרט טכני וביצועים',
      engine: 'נפח וסוג מנוע',
      horsepower: 'כוח סוס (HP)',
      acceleration: 'תאוצה (0-100 קמ״ש)',
      topSpeed: 'מהירות מרבית',
      bodyType: 'תצורת מרכב',
      color: 'גוון (חיצוני / פנימי)',
      saveCar: 'שמירת רכב',
      cancel: 'ביטול',
      carTitleMulti: 'שם וכותרת הרכב (ב-3 שפות)',
      carDescMulti: 'תיאור מפורט ומאפיינים (ב-3 שפות)',
    },
    productsManager: {
      title: 'קטלוג חלפים ושדרוגים',
      subtitle: 'ניהול חלקי חילוף, תאימות לדגמים, מעקב מק״טים וזמינות במלאי',
      addNewProduct: 'הוספת חלק חדש',
      editProduct: 'עריכת פרטי חלק',
      deleteProduct: 'מחיקת חלק מהחנות',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק מוצר זה מהקטלוג?',
      searchPlaceholder: 'חיפוש לפי מק״ט, שם חלק או קטגוריה…',
      nameLabel: 'שם החלק (ב-3 שפות)',
      skuLabel: 'מק״ט סידורי (SKU)',
      categoryLabel: 'קטגוריה',
      priceLabel: 'מחיר',
      inStockLabel: 'סטטוס זמינות במלאי',
      compatibilityLabel: 'תאימות לדגמי רכב',
      imageLabel: 'קישור לתמונה איכותית',
      descLabel: 'מפרט טכני והסבר (ב-3 שפות)',
      inStock: 'קיים במלאי',
      outOfStock: 'אזל זמנית מהמלאי',
      saveProduct: 'שמירת מוצר',
      cancel: 'ביטול',
    },
    blogManager: {
      title: 'ניהול מאמרים ובלוג',
      subtitle: 'פרסום מדריכים, עדכוני שוק וסקירות רכב ללקוחות ועוקבי האתר',
      addNewArticle: 'כתיבת מאמר חדש',
      editArticle: 'עריכת מאמר',
      deleteArticle: 'מחיקת מאמר',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק מאמר זה לצמיתות?',
      searchPlaceholder: 'חיפוש מאמרים לפי כותרת או תגיות…',
      articleTitle: 'כותרת המאמר (ב-3 שפות)',
      slugLabel: 'כתובת קישור (Slug)',
      authorLabel: 'שם הכותב או המחלקה',
      dateLabel: 'תאריך פרסום',
      readTimeLabel: 'זמן קריאה משוער (לדוגמה: 5 min)',
      coverImageLabel: 'קישור לתמונת שער',
      tagsLabel: 'תגיות חיפוש (מופרדות בפסיקים)',
      excerptLabel: 'תקציר קצר (ב-3 שפות)',
      contentLabel: 'תוכן המאמר המלא (ב-3 שפות)',
      saveArticle: 'פרסום ושמירה',
      cancel: 'ביטול',
    },
    inquiries: {
      title: 'פניות ולידים מהאתר',
      subtitle: 'ניהול פניות רכישה, תיאום נסיעות מבחן ופרויקטי התאמת VIP',
      filterAll: 'כל הפניות',
      filterNew: 'חדשות',
      filterContacted: 'בטיפול',
      filterResolved: 'הושלמו',
      clientName: 'שם הלקוח',
      email: 'דוא״ל',
      phone: 'מספר טלפון',
      serviceRequired: 'שירות / רכב מבוקש',
      date: 'מועד פנייה',
      status: 'סטטוס',
      actions: 'דרכי התקשרות',
      statusNew: 'פנייה חדשה',
      statusContacted: 'נוצר קשר',
      statusResolved: 'טופל בהצלחה',
      markContacted: 'סמן כ״נוצר קשר״',
      markResolved: 'סמן כ״הושלם״',
      openWhatsApp: 'שיחה ב-WhatsApp',
      sendEmail: 'שליחת דוא״ל',
      emptyState: 'לא נמצאו פניות התואמות את הסינון הנבחר.',
    },
    orders: {
      title: 'ניהול ומעקב הזמנות לקוחות',
      subtitle: 'מעקב אחר סטטוס טיפול, עדכון שלבי משלוח והזנת מספרי מעקב לוגיסטיים',
      searchPlaceholder: 'חיפוש לפי מספר הזמנה #ORD, שם לקוח, או טלפון…',
      filterAll: 'כל ההזמנות',
      filterPending: 'בבדיקה',
      filterConfirmed: 'אושר',
      filterProcessing: 'בהכנה ובדיקה',
      filterShipping: 'במשלוח / בדרך',
      filterDelivered: 'נמסר בהצלחה',
      filterCancelled: 'בוטל',
      orderNumber: 'מספר הזמנה',
      customer: 'לקוח',
      phone: 'טלפון',
      date: 'תאריך ושעה',
      itemsCount: 'פריטים',
      totalAmount: 'סכום כולל',
      paymentMethod: 'אמצעי תשלום',
      paymentStatus: 'סטטוס תשלום',
      orderStatus: 'סטטוס הזמנה',
      actions: 'פעולות',
      viewDetails: 'צפייה בפרטי הזמנה וחשבונית',
      updateStatus: 'עדכון סטטוס',
      trackingNumber: 'מספר מעקב (Tracking)',
      carrier: 'חברת שילוח / שליח',
      estimatedDelivery: 'מועד הגעה משוער',
      shippingAddress: 'כתובת למשלוח ומסירה',
      orderedItems: 'פירוט פריטים ומוצרים',
      notes: 'הערות ניהוליות',
      saveChanges: 'שמירה ועדכון הזמנה',
      printInvoice: 'הדפסת חשבונית',
      emptyState: 'לא נמצאו הזמנות התואמות את החתך הנבחר.',
      statusPending: 'ממתין לאישור',
      statusConfirmed: 'הזמנה אושרה',
      statusProcessing: 'בהכנה ובדיקה טכנית',
      statusShipping: 'נשלח / בדרך ללקוח',
      statusDelivered: 'נמסר בהצלחה ליעד',
      statusCancelled: 'הזמנה בוטלה',
    },
    customers: {
      title: 'ניהול לקוחות ו-VIP',
      subtitle: 'מעקב אחר תיקי לקוחות, היסטוריית רכישות, כתובות ופרטי התקשרות',
      addNewCustomer: 'הוספת לקוח חדש',
      editCustomer: 'עריכת פרטי לקוח',
      deleteCustomer: 'מחיקת לקוח',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק חשבון לקוח זה לצמיתות?',
      searchPlaceholder: 'חיפוש לפי שם, אימייל, טלפון או עיר…',
      filterAllTiers: 'כל הדירוגים',
      filterVip: 'לקוחות VIP',
      filterPlatinum: 'פלטינום',
      filterGold: 'זהב',
      filterRegular: 'רגיל',
      filterAllStatus: 'כל הסטטוסים',
      filterActive: 'פעיל',
      filterSuspended: 'מושהה',
      filterPending: 'בבדיקה',
      nameLabel: 'שם מלא / חברה',
      emailLabel: 'כתובת אימייל',
      phoneLabel: 'מספר טלפון',
      tierLabel: 'סיווג ודירוג לקוח',
      statusLabel: 'סטטוס חשבון',
      joinedDate: 'תאריך הצטרפות',
      totalSpent: 'סה״כ רכישות מצטבר',
      ordersCount: 'מספר הזמנות',
      billingAddress: 'כתובת לחיוב',
      shippingAddress: 'כתובת למשלוח ומסירה',
      notesLabel: 'הערות ניהוליות חסויות',
      interestedInLabel: 'דגמים ושירותים מועדפים',
      ordersHistory: 'היסטוריית עסקאות והזמנות',
      orderNumber: 'מספר הזמנה',
      orderDate: 'תאריך',
      orderTotal: 'סכום',
      orderStatus: 'סטטוס הזמנה',
      orderItems: 'פריטים / רכבים',
      noOrders: 'אין עדיין היסטוריית הזמנות לחשבון זה.',
      saveCustomer: 'שמירת לקוח',
      cancel: 'ביטול',
      emptyState: 'לא נמצאו לקוחות התואמים את הסינון.',
      openWhatsApp: 'שיחת WhatsApp',
      sendEmail: 'שליחת אימייל',
    },
    settings: {
      title: 'הגדרות מערכת ואבטחה מתקדמות',
      subtitle: 'שינוי סיסמה, ניהול מיתוג, סליקה, התראות וקידום אתרים',
      subtabs: {
        security: 'אבטחה וסיסמה',
        commerce: 'סחר ותשלומים',
        branding: 'מיתוג ושפה חזותית',
        notifications: 'התראות מיידיות',
        seo: 'קידום ו-SEO',
        maintenance: 'מצב תחזוקה',
        backup: 'גיבוי נתונים',
      },
      security: {
        title: 'אבטחת לוח הבקרה ושינוי סיסמה',
        subtitle: 'עדכון פרטי התחברות למנהל, תוקף פעילות ואימות דו-שלבי',
        currentPassword: 'סיסמה נוכחית',
        newPassword: 'סיסמה חדשה',
        confirmPassword: 'אימות סיסמה חדשה',
        changePasswordBtn: 'עדכון סיסמה',
        passwordChangedSuccess: 'הסיסמה עודכנה בהצלחה! שמור עליה במקום מאובטח.',
        passwordMismatchError: 'הסיסמה החדשה ואימות הסיסמה אינם תואמים!',
        wrongPasswordError: 'הסיסמה הנוכחית שהוזנה שגויה!',
        passwordEmptyError: 'נא להזין סיסמה חדשה באורך 6 תווים לפחות.',
        usernameLabel: 'שם משתמש מנהל',
        adminEmailLabel: 'דוא״ל מנהל מערכת',
        twoFactorTitle: 'אימות דו-שלבי (2FA)',
        twoFactorDesc: 'דרישת קוד אימות חד-פעמי בכניסה למערכת',
        sessionTimeoutLabel: 'תפוגת פעילות אוטומטית',
        min15: '15 דקות',
        min30: '30 דקות',
        hour1: 'שעה אחת',
        day1: '24 שעות',
        saveAccountDetails: 'שמירת פרטי חשבון',
      },
      commerce: {
        title: 'הגדרות סחר, מע״מ ותשלומים',
        subtitle: 'קביעת מיקום מטבע, אחוז מע״מ ואמצעי תשלום נתמכים',
        currencyLabel: 'סמל מטבע ראשי',
        currencyPosLabel: 'מיקום סמל המטבע',
        posBefore: 'לפני הסכום (למשל: ₪ 100)',
        posAfter: 'אחרי הסכום (למשל: 100 ₪)',
        taxRateLabel: 'שיעור מס ערך מוסף (מע״מ %)',
        freeShippingLabel: 'סף משלוח VIP חינם',
        paymentMethodsTitle: 'אמצעי תשלום פעילים באתר',
        cardPayment: 'כרטיסי אשראי (Visa / Mastercard / Stripe)',
        paypal: 'פייפאל (PayPal)',
        bankWire: 'העברה בנקאית ישירה',
        cashOnDelivery: 'תשלום במזומן בעת המסירה',
        whatsappCheckout: 'הזמנת קונסיירז׳ ישירה ב-WhatsApp',
      },
      branding: {
        title: 'זהות מותג ונראות',
        subtitle: 'לוגו למצב בהיר וכהה, פביקון, סלוגן רב-לשוני וצבע דגש',
        logoLight: 'קישור ללוגו למצב בהיר',
        logoDark: 'קישור ללוגו למצב כהה',
        favicon: 'קישור לאייקון הדפדפן (Favicon)',
        tagline: 'סלוגן המותג (ב-3 שפות)',
        accentColor: 'צבע הדגש של המותג (Accent Color)',
      },
      notifications: {
        title: 'התראות והודעות אוטומטיות',
        subtitle: 'הגדרת ערוצי קבלת התראות על פניות והזמנות רכב חדשות',
        alertEmail: 'דוא״ל לקבלת התראות',
        alertWhatsapp: 'מספר WhatsApp של צוות המכירות',
        soundAlerts: 'השמעת צליל התראה בעת קבלת פנייה חדשה',
        autoReply: 'שליחת אימייל אישור אוטומטי ללקוח עם קבלת הפנייה',
      },
      seo: {
        title: 'קידום אתרים ומערכות אנליטיקה',
        subtitle: 'הגדרת קודי מעקב של גוגל ומטא ותגיות מטא ראשיות',
        ga4: 'קוד Google Analytics 4 (Measurement ID)',
        pixel: 'קוד Meta Pixel ID',
        searchConsole: 'קוד אימות Google Search Console',
        defaultTitle: 'כותרת ברירת מחדל למנועי חיפוש (ב-3 שפות)',
        defaultDesc: 'תיאור ברירת מחדל בתוצאות חיפוש (ב-3 שפות)',
      },
      maintenance: {
        title: 'מצב תחזוקה והשבתה זמנית',
        subtitle: 'השבתת האתר הציבורי עם הודעת הסבר מעוצבת ב-3 שפות',
        enableMaintenance: 'הפעלת מצב תחזוקה לאתר',
        maintenanceWarning: 'בעת הפעלה, הגולשים יראו הודעת שדרוג בלבד, בעוד שלוח הניהול נותר זמין עבורך.',
        message: 'הודעת תחזוקה לגולשים (ב-3 שפות)',
        allowedIps: 'כתובות IP מורשות לעקיפת התחזוקה (מופרדות בפסיקים)',
      },
      backup: {
        title: 'גיבויים ושחזור נתונים',
        subtitle: 'הורדת גיבוי JSON מלא של האתר או שחזור snapshot קודם',
        exportBtn: 'הורדת גיבוי JSON מלא',
        importBtn: 'שחזור מקובץ גיבוי',
        importPrompt: 'הדבק כאן את תוכן קובץ ה-JSON לשחזור:',
        resetBtn: 'איפוס כל הנתונים לברירות המחדל המקוריות',
        resetConfirm: 'אזהרה: כל השינויים יימחקו והאתר יחזור לנתוני המקור. להמשיך?',
      },
    },
    common: {
      arabic: 'العربية',
      english: 'English',
      hebrew: 'עברית',
      switchLanguage: 'שפת ממשק',
      allLanguages: 'כל השפות (AR / EN / HE)',
      save: 'שמירה',
      cancel: 'ביטול',
      delete: 'מחיקה',
      edit: 'עריכה',
      view: 'צפייה',
      loading: 'טוען…',
      noData: 'אין נתונים זמינים',
    },
  },
}
