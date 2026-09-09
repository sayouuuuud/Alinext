'use client'

import React, { useState } from 'react'
import {
  Layers,
  Sparkles,
  BarChart3,
  Globe2,
  Briefcase,
  Megaphone,
  PhoneCall,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Car,
  Package,
  Truck,
  Image as ImageIcon,
  Layout,
} from 'lucide-react'
import { useAdmin } from '@/lib/admin/admin-context'
import { MultiLangInput } from '../multilang-input'
import { ImageUpload } from '@/components/admin/image-upload'
import type { MultiLangString } from '@/lib/admin/types'

type PageSubTab = 'home' | 'cars' | 'products' | 'contact' | 'policies'
type HomeSection = 'hero' | 'fleet' | 'stats' | 'marquee' | 'global' | 'services' | 'cta'

export function PagesEditorTab() {
  const { t, content, updateContent, saveAll, showToast } = useAdmin()
  const [activePage, setActivePage] = useState<PageSubTab>('home')
  const [activeSection, setActiveSection] = useState<HomeSection>('hero')

  const home = content.pages.home
  const contact = content.general.contact
  const policies = content.pages.policies
  const carsPage = content.pages.cars
  const productsPage = content.pages.products

  // Handlers for Home -> Hero
  const handleHeroChange = (field: keyof typeof home.hero, val: MultiLangString) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          hero: {
            ...prev.pages.home.hero,
            [field]: val,
          },
        },
      },
    }))
  }

  const handleHeroSlideImage = (index: number, url: string) => {
    updateContent((prev) => {
      const current = [...(prev.pages.home.hero.slideImages || [
        '/images/hero-showroom.png',
        '/images/fleet-truck.png',
        '/images/hero-truck.png',
        '/images/import-landcruiser.png',
        '/images/fleet-suv.png',
        '/images/fleet-van.png',
      ])]
      while (current.length <= index) current.push('')
      current[index] = url
      return {
        ...prev,
        pages: {
          ...prev.pages,
          home: {
            ...prev.pages.home,
            hero: {
              ...prev.pages.home.hero,
              heroImage: index === 0 ? url : (prev.pages.home.hero.heroImage || url),
              slideImages: current,
            },
          },
        },
      }
    })
  }

  const handleHeroSlideLabel = (index: number, label: MultiLangString) => {
    updateContent((prev) => {
      const current = [...(prev.pages.home.hero.slideLabels || [
        { ar: 'الشاحنة الرئيسية', en: 'Flagship Mercedes', he: 'משאית הדגל' },
        { ar: 'الشاحنات الثقيلة', en: 'Heavy Duty Trucks', he: 'משאיות כבדות' },
        { ar: 'الفانات الفاخرة VIP', en: 'Luxury VIP Vans', he: 'ואנים יוקרתיים' },
        { ar: 'سيارات الدفع الرباعي', en: 'Executive 4x4 SUVs', he: 'רכבי שטח 4x4' },
        { ar: 'النقل واللوجستيات', en: 'Highway Haulers', he: 'תובלה מהירה' },
        { ar: 'الاستيراد الخاص المباشر', en: 'Direct Custom Imports', he: 'ייבוא אישי ישיר' },
      ])]
      while (current.length <= index) current.push({ ar: '', en: '', he: '' })
      current[index] = label
      return {
        ...prev,
        pages: {
          ...prev.pages,
          home: {
            ...prev.pages.home,
            hero: {
              ...prev.pages.home.hero,
              slideLabels: current,
            },
          },
        },
      }
    })
  }

  const handleHeroAvatar = (url: string) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          hero: {
            ...prev.pages.home.hero,
            avatarImage: url,
          },
        },
      },
    }))
  }

  // Handlers for Fleet Showcase
  const handleFleetHeading = (
    field: 'eyebrow' | 'titleStart' | 'titleEm' | 'titleEnd' | 'lead',
    val: MultiLangString
  ) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          fleet: {
            vehicles: prev.pages.home.fleet?.vehicles || [],
            ...prev.pages.home.fleet,
            [field]: val,
          },
        },
      },
    }))
  }

  const handleFleetVehicle = (
    vehicleId: string,
    field: 'title' | 'tag' | 'description' | 'image',
    val: any
  ) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          fleet: {
            ...prev.pages.home.fleet,
            vehicles: (prev.pages.home.fleet?.vehicles || []).map((v) =>
              v.id === vehicleId ? { ...v, [field]: val } : v
            ),
          },
        },
      },
    }))
  }

  // Handlers for Cars and Products Pages
  const handleCarsPage = (field: string, val: any) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        cars: {
          ...prev.pages.cars,
          [field]: val,
        },
      },
    }))
  }

  const handleProductsPage = (field: string, val: any) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        products: {
          ...prev.pages.products,
          [field]: val,
        },
      },
    }))
  }

  // Handlers for Stats
  const handleStatChange = (id: string, field: 'value' | 'label', val: any) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          stats: prev.pages.home.stats.map((s) =>
            s.id === id ? { ...s, [field]: val } : s
          ),
        },
      },
    }))
  }

  const addStat = () => {
    const newId = `stat-${Date.now()}`
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          stats: [
            ...prev.pages.home.stats,
            {
              id: newId,
              value: '100+',
              label: { ar: 'ميزة جديدة', en: 'New Metric', he: 'מדד חדש' },
            },
          ],
        },
      },
    }))
    showToast('تمت إضافة الإحصائية بنجاح')
  }

  const removeStat = (id: string) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          stats: prev.pages.home.stats.filter((s) => s.id !== id),
        },
      },
    }))
  }

  // Handlers for Marquee
  const handleMarqueeChange = (index: number, val: MultiLangString) => {
    updateContent((prev) => {
      const items = [...prev.pages.home.marquee]
      items[index] = val
      return {
        ...prev,
        pages: {
          ...prev.pages,
          home: {
            ...prev.pages.home,
            marquee: items,
          },
        },
      }
    })
  }

  const addMarqueeItem = () => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          marquee: [
            ...prev.pages.home.marquee,
            { ar: 'ماركة فاخرة', en: 'Luxury Brand', he: 'מותג יוקרה' },
          ],
        },
      },
    }))
  }

  const removeMarqueeItem = (index: number) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          marquee: prev.pages.home.marquee.filter((_, i) => i !== index),
        },
      },
    }))
  }

  // Handlers for Global Reach
  const handleGlobalChange = (field: keyof typeof home.globalReach, val: any) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          globalReach: {
            ...prev.pages.home.globalReach,
            [field]: val,
          },
        },
      },
    }))
  }

  // Handlers for Services
  const handleServiceChange = (id: string, field: string, val: any) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          services: prev.pages.home.services.map((srv) =>
            srv.id === id ? { ...srv, [field]: val } : srv
          ),
        },
      },
    }))
  }

  // Handlers for CTA
  const handleCtaChange = (field: keyof typeof home.cta, val: any) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        home: {
          ...prev.pages.home,
          cta: {
            ...prev.pages.home.cta,
            [field]: val,
          },
        },
      },
    }))
  }

  // Handlers for Policies
  const handlePolicyChange = (id: string, field: 'title' | 'content', val: MultiLangString) => {
    updateContent((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        policies: prev.pages.policies.map((p) =>
          p.id === id ? { ...p, [field]: val } : p
        ),
      },
    }))
  }

  // Handlers for Contact
  const handleContactChange = (field: keyof typeof contact, val: any) => {
    updateContent((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        contact: {
          ...prev.general.contact,
          [field]: val,
        },
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.pagesEditor.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t.pagesEditor.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/30 hover:opacity-95"
        >
          <Save className="h-4 w-4" />
          <span>{t.header.saveAll}</span>
        </button>
      </div>

      {/* Main Page Selector Tabs */}
      <div className="flex flex-wrap border-b border-border bg-card rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setActivePage('home')}
          className={`flex-1 min-w-[120px] rounded-lg py-2 text-xs font-semibold transition-all ${
            activePage === 'home'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {t.pagesEditor.homeTab}
        </button>
        <button
          type="button"
          onClick={() => setActivePage('cars')}
          className={`flex-1 min-w-[120px] rounded-lg py-2 text-xs font-semibold transition-all ${
            activePage === 'cars'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          صفحة أسطول السيارات (/cars)
        </button>
        <button
          type="button"
          onClick={() => setActivePage('products')}
          className={`flex-1 min-w-[120px] rounded-lg py-2 text-xs font-semibold transition-all ${
            activePage === 'products'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          صفحة قطع الغيار (/products)
        </button>
        <button
          type="button"
          onClick={() => setActivePage('contact')}
          className={`flex-1 min-w-[120px] rounded-lg py-2 text-xs font-semibold transition-all ${
            activePage === 'contact'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {t.pagesEditor.contactTab}
        </button>
        <button
          type="button"
          onClick={() => setActivePage('policies')}
          className={`flex-1 min-w-[120px] rounded-lg py-2 text-xs font-semibold transition-all ${
            activePage === 'policies'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {t.pagesEditor.policiesTab}
        </button>
      </div>

      {/* HOME PAGE SUBSECTIONS */}
      {activePage === 'home' && (
        <div className="space-y-6">
          {/* Section pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'hero', label: 'البداية وسلايدر الصور الـ 6', icon: Sparkles },
              { id: 'fleet', label: 'أسطول المركبات (الكروت الـ 3)', icon: Truck },
              { id: 'stats', label: t.pagesEditor.statsSection, icon: BarChart3 },
              { id: 'marquee', label: t.pagesEditor.marqueeSection, icon: Megaphone },
              { id: 'global', label: t.pagesEditor.globalReachSection, icon: Globe2 },
              { id: 'services', label: t.pagesEditor.servicesSection, icon: Briefcase },
              { id: 'cta', label: t.pagesEditor.ctaSection, icon: ShieldCheck },
            ].map((sec) => {
              const Icon = sec.icon
              const isSelected = activeSection === sec.id
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id as HomeSection)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{sec.label}</span>
                </button>
              )
            })}
          </div>

          {/* SECTION: HERO */}
          {activeSection === 'hero' && (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="border-b border-border/70 pb-3">
                <h2 className="text-sm font-bold text-foreground">
                  {t.pagesEditor.heroSection}
                </h2>
                <p className="text-xs text-muted-foreground">
                  تحكم في السطور الأربعة للعنوان الرئيسي والفقرة التوضيحية وشارات العرض
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <MultiLangInput
                  label={t.pagesEditor.headlineLine1}
                  value={home.hero.line1}
                  onChange={(v) => handleHeroChange('line1', v)}
                />
                <MultiLangInput
                  label={t.pagesEditor.headlineLine2}
                  value={home.hero.line2}
                  onChange={(v) => handleHeroChange('line2', v)}
                />
                <MultiLangInput
                  label={t.pagesEditor.headlineLine3}
                  value={home.hero.line3}
                  onChange={(v) => handleHeroChange('line3', v)}
                />
                <MultiLangInput
                  label={t.pagesEditor.headlineLine4}
                  value={home.hero.line4}
                  onChange={(v) => handleHeroChange('line4', v)}
                />
              </div>

              <MultiLangInput
                label={t.pagesEditor.heroSubtitle}
                value={home.hero.subtitle}
                onChange={(v) => handleHeroChange('subtitle', v)}
                textarea
                rows={3}
              />

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <MultiLangInput
                  label={t.pagesEditor.buttonSale}
                  value={home.hero.ctaSale}
                  onChange={(v) => handleHeroChange('ctaSale', v)}
                />
                <MultiLangInput
                  label={t.pagesEditor.buttonImport}
                  value={home.hero.ctaImport}
                  onChange={(v) => handleHeroChange('ctaImport', v)}
                />
                <MultiLangInput
                  label={t.pagesEditor.badgeText}
                  value={home.hero.badge}
                  onChange={(v) => handleHeroChange('badge', v)}
                />
              </div>

              {/* Hero Circular Avatar */}
              <div className="border-t border-border/70 pt-5 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    الصورة الدائرية المصغرة بجانب العنوان الرئيسي (Avatar Image)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    الأيقونة الدائرية التي تظهر مدمجة داخل السطر الأول من العنوان الرئيسي
                  </p>
                </div>
                <ImageUpload
                  label="الصورة الدائرية المصغرة"
                  value={home.hero.avatarImage || '/images/hero-avatars.png'}
                  onChange={handleHeroAvatar}
                  aspectHint="مربعة 1:1 أو دائرية"
                />
              </div>

              {/* 6 Hero Slides Manager */}
              <div className="border-t border-border/70 pt-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <span>إدارة سلايدر وصور البداية (جميع الصور الـ 6 وبطاقة العرض الثلاثية)</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    السلايدر يعرض 6 صور رئيسية مع بطاقة معاينة ثلاثية متحركة. يمكنك تغيير ورفع كل صورة وعنوانها الخاص بنقرة واحدة:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 0, defaultTitle: 'الشاحنة الرئيسية (Flagship)', defaultImg: '/images/hero-showroom.png' },
                    { id: 1, defaultTitle: 'الشاحنات الثقيلة (Trucks)', defaultImg: '/images/fleet-truck.png' },
                    { id: 2, defaultTitle: 'الفانات الفاخرة (Vans)', defaultImg: '/images/hero-truck.png' },
                    { id: 3, defaultTitle: 'سيارات الدفع الرباعي (SUVs)', defaultImg: '/images/import-landcruiser.png' },
                    { id: 4, defaultTitle: 'النقل واللوجستيات (Highway)', defaultImg: '/images/fleet-suv.png' },
                    { id: 5, defaultTitle: 'الاستيراد المباشر (Imports)', defaultImg: '/images/fleet-van.png' },
                  ].map((slideItem) => {
                    const slideImg = home.hero.slideImages?.[slideItem.id] || (slideItem.id === 0 ? home.hero.heroImage : '') || slideItem.defaultImg
                    const slideLabel = home.hero.slideLabels?.[slideItem.id] || {
                      ar: slideItem.defaultTitle,
                      en: slideItem.defaultTitle,
                      he: slideItem.defaultTitle,
                    }

                    return (
                      <div
                        key={slideItem.id}
                        className="rounded-xl border border-border bg-background/60 p-4 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs font-bold text-primary">
                            سلايد رقم #{slideItem.id + 1}
                          </span>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                            Slide {slideItem.id + 1} of 6
                          </span>
                        </div>

                        <ImageUpload
                          label={`صورة السلايد #${slideItem.id + 1}`}
                          value={slideImg}
                          onChange={(url) => handleHeroSlideImage(slideItem.id, url)}
                          aspectHint="16:9 أو بانورامي بجودة عالية"
                        />

                        <MultiLangInput
                          label={`عنوان وتسمية السلايد #${slideItem.id + 1}`}
                          value={slideLabel}
                          onChange={(val) => handleHeroSlideLabel(slideItem.id, val)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: FLEET SHOWCASE */}
          {activeSection === 'fleet' && (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="border-b border-border/70 pb-3">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Truck className="size-4 text-primary" />
                  <span>معرض أسطول المركبات (Fleet Showcase - الكروت الـ 3 التفاعلية)</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  تحكم في الكروت الثلاثة العملاقة المعروضة في الصفحة الرئيسية مع نصوصها وعناوينها وصورها
                </p>
              </div>

              {/* Fleet Section Header */}
              <div className="space-y-4 rounded-xl border border-border/70 bg-background/40 p-4">
                <h3 className="text-xs font-bold text-foreground">
                  نصوص وعناوين قسم الأسطول الرئيسي
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MultiLangInput
                    label="النص التمهيدي (Eyebrow)"
                    value={home.fleet?.eyebrow || { ar: 'أسطول علي فليت 2026', en: 'ALI FLEET 2026', he: 'צי עלי פליט 2026' }}
                    onChange={(v) => handleFleetHeading('eyebrow', v)}
                  />
                  <MultiLangInput
                    label="بداية العنوان (Title Start)"
                    value={home.fleet?.titleStart || { ar: 'أسطول متكامل مصمم للسيطرة', en: 'An engineered fleet built for', he: 'צי שלם שנבנה עבור' }}
                    onChange={(v) => handleFleetHeading('titleStart', v)}
                  />
                  <MultiLangInput
                    label="الكلمة المميزة بخط مائل (Title Highlight / Italic)"
                    value={home.fleet?.titleEm || { ar: 'على الطرق والأعمال', en: 'command and presence', he: 'שליטה ונוכחות' }}
                    onChange={(v) => handleFleetHeading('titleEm', v)}
                  />
                  <MultiLangInput
                    label="نهاية العنوان (Title End)"
                    value={home.fleet?.titleEnd || { ar: 'بأعلى معايير القوة والفخامة', en: 'across every sector', he: 'בכל תחום' }}
                    onChange={(v) => handleFleetHeading('titleEnd', v)}
                  />
                </div>
                <MultiLangInput
                  label="الوصف التوضيحي للقسم (Lead Description)"
                  value={home.fleet?.lead || { ar: 'من شاحنات الشحن الثقيل العابرة للقارات، إلى مقصورات رجال الأعمال وفانات المرافقة الفارهة، كل مركبة تم اختيارها بعناية فائقة.', en: 'From continental heavy haulers to executive VIP transport and luxury support vans, each vehicle represents pinnacle engineering.', he: 'החל ממשאיות תובלה כבדה ועד לרכבי מנהלים מפוארים וואנים יוקרתיים, כל רכב נבחר בקפידה עילאית.' }}
                  onChange={(v) => handleFleetHeading('lead', v)}
                  textarea
                  rows={2}
                />
              </div>

              {/* 3 Vehicle Panels */}
              <div className="space-y-6">
                {(home.fleet?.vehicles || [
                  {
                    id: 'fleet-1',
                    title: { ar: 'شاحنات النقل الثقيل', en: 'Commercial Trucks', he: 'משאיות כבדות' },
                    tag: { ar: 'خدمة شاقة • 500+ حصان', en: 'Heavy Duty • 500+ HP', he: 'עבודה קשה • 500+ כ״ס' },
                    description: { ar: 'شاحنات مرسيدس وسكانيا وفولفو بأعلى مواصفات القطر والتحمل والسلامة الأوروبية مع أنظمة قيادة ذكية.', en: 'Mercedes-Benz, Scania and Volvo tractor units engineered for maximum payload, reliability and continental transport.', he: 'משאיות מרצדס, סקאניה ווולוו עם מפרטי הגרירה והבטיחות האירופאיים הגבוהים ביותר.' },
                    image: '/images/fleet-truck.png',
                  },
                  {
                    id: 'fleet-2',
                    title: { ar: 'الفانات والميني باص الفاخر VIP', en: 'Luxury Commercial Vans', he: 'ואנים יוקרתיים' },
                    tag: { ar: 'مقصورات كبار الشخصيات', en: 'VIP Lounge Spec', he: 'תצורת VIP' },
                    description: { ar: 'مرسيدس سبرينتر وفئات V-Class مجهزة بمقاعد جلدية كهربائية، شاشات ترفيه ذكية، وعزل صوتي فائق.', en: 'Mercedes Sprinter and V-Class executive conversions with handcrafted leather, ambient suites and private partitions.', he: 'מרצדס ספרינטר ו-V-Class מותאמים עם מושבי עור חשמליים, מערכות בידור ובידוד רעשים מעולה.' },
                    image: '/images/fleet-van.png',
                  },
                  {
                    id: 'fleet-3',
                    title: { ar: 'سيارات الدفع الرباعي والمرافقة الفارهة', en: 'Executive & Armored SUVs', he: 'רכבי שטח יוקרתיים' },
                    tag: { ar: 'دفع كلي 4x4 • حماية قصوى', en: 'All-Terrain 4x4 • Armored Available', he: 'הנעה 4x4 • מיגון זמין' },
                    description: { ar: 'تويوتا لاند كروزر ولكزس ورينج روفر بمحركات V8 و V6 توربو مزدوج جاهزة للعمل في أصعب الظروف بأعلى رفاهية.', en: 'Toyota Land Cruiser 300 and Lexus LX platforms tuned for unmatched durability, desert expeditions and executive escorts.', he: 'טויוטה לנד קרוזר ולקסוס עם מנועי טורבו כפולים המוכנים לכל תנאי שטח בנוחות מרבית.' },
                    image: '/images/fleet-suv.png',
                  },
                ]).map((veh, idx) => (
                  <div
                    key={veh.id}
                    className="rounded-2xl border border-border bg-background/60 p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-border/70 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-foreground">
                          {idx === 0 ? 'الكارت الأول: الشاحنات التجارية (Commercial Trucks)' : idx === 1 ? 'الكارت الثاني: الفانات الفاخرة (Luxury Vans)' : 'الكارت الثالث: سيارات الدفع الرباعي (Executive SUVs)'}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        ID: {veh.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-5">
                        <ImageUpload
                          label={`صورة الكارت رقم #${idx + 1}`}
                          value={veh.image}
                          onChange={(url) => handleFleetVehicle(veh.id, 'image', url)}
                          aspectHint="صورة سيارة أو شاحنة بنسبة 16:9 أو 4:3 بدون خلفية مشوشة"
                        />
                      </div>

                      <div className="lg:col-span-7 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <MultiLangInput
                            label="عنوان الكارت (Vehicle Title)"
                            value={veh.title}
                            onChange={(v) => handleFleetVehicle(veh.id, 'title', v)}
                          />
                          <MultiLangInput
                            label="الوسم المميز (Tag Badge)"
                            value={veh.tag}
                            onChange={(v) => handleFleetVehicle(veh.id, 'tag', v)}
                          />
                        </div>

                        <MultiLangInput
                          label="الوصف التفصيلي (Description)"
                          value={veh.description}
                          onChange={(v) => handleFleetVehicle(veh.id, 'description', v)}
                          textarea
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: STATS STRIP */}
          {activeSection === 'stats' && (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {t.pagesEditor.statsSection}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    إدارة مؤشرات وإحصائيات الثقة المعروضة أسفل قسم البداية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addStat}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.pagesEditor.addStat}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {home.stats.map((stat, idx) => (
                  <div
                    key={stat.id}
                    className="relative rounded-xl border border-border bg-background/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">
                        مؤشر رقم #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStat(stat.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground">
                        {t.pagesEditor.statValue}
                      </label>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => handleStatChange(stat.id, 'value', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
                      />
                    </div>

                    <MultiLangInput
                      label={t.pagesEditor.statLabel}
                      value={stat.label}
                      onChange={(val) => handleStatChange(stat.id, 'label', val)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: MARQUEE */}
          {activeSection === 'marquee' && (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {t.pagesEditor.marqueeSection}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    العلامات التجارية الفاخرة التي تتحرك أفقياً في الصفحة
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMarqueeItem}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.pagesEditor.addMarquee}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {home.marquee.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-xl border border-border bg-background/50 p-3"
                  >
                    <div className="flex-1">
                      <MultiLangInput
                        label={`ماركة #${idx + 1}`}
                        value={item}
                        onChange={(val) => handleMarqueeChange(idx, val)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMarqueeItem(idx)}
                      className="mt-6 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: GLOBAL REACH */}
          {activeSection === 'global' && (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="border-b border-border/70 pb-3">
                <h2 className="text-sm font-bold text-foreground">
                  {t.pagesEditor.globalReachSection}
                </h2>
                <p className="text-xs text-muted-foreground">
                  محتوى قسم الانتشار العالمي ومصادر التوريد المباشرة
                </p>
              </div>

              <MultiLangInput
                label="عنوان القسم الرئيسي"
                value={home.globalReach.title}
                onChange={(v) => handleGlobalChange('title', v)}
              />
              <MultiLangInput
                label="العنوان الفرعي"
                value={home.globalReach.subtitle}
                onChange={(v) => handleGlobalChange('subtitle', v)}
              />
              <MultiLangInput
                label="الوصف التفصيلي"
                value={home.globalReach.description}
                onChange={(v) => handleGlobalChange('description', v)}
                textarea
                rows={3}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    عدد الدول (Countries Count)
                  </label>
                  <input
                    type="text"
                    value={home.globalReach.countriesCount}
                    onChange={(e) => handleGlobalChange('countriesCount', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    السيارات المسلمة (Vehicles Delivered)
                  </label>
                  <input
                    type="text"
                    value={home.globalReach.vehiclesDelivered}
                    onChange={(e) => handleGlobalChange('vehiclesDelivered', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    نسبة رضا كبار الشخصيات (VIP Satisfaction)
                  </label>
                  <input
                    type="text"
                    value={home.globalReach.vipSatisfaction}
                    onChange={(e) => handleGlobalChange('vipSatisfaction', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION: SERVICES */}
          {activeSection === 'services' && (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="border-b border-border/70 pb-3">
                <h2 className="text-sm font-bold text-foreground">
                  {t.pagesEditor.servicesSection}
                </h2>
                <p className="text-xs text-muted-foreground">
                  خدمات علي فليت الحصرية (الاستيراد، تجهيز مقصورات VIP، التصفيح)
                </p>
              </div>

              <div className="space-y-6">
                {home.services.map((srv, idx) => (
                  <div
                    key={srv.id}
                    className="rounded-xl border border-border bg-background/50 p-5 space-y-4"
                  >
                    <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      خدمة #{idx + 1}
                    </span>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <MultiLangInput
                        label={t.pagesEditor.serviceTitle}
                        value={srv.title}
                        onChange={(v) => handleServiceChange(srv.id, 'title', v)}
                      />
                      <MultiLangInput
                        label={t.pagesEditor.serviceSubtitle}
                        value={srv.subtitle}
                        onChange={(v) => handleServiceChange(srv.id, 'subtitle', v)}
                      />
                    </div>

                    <MultiLangInput
                      label={t.pagesEditor.serviceDesc}
                      value={srv.description}
                      onChange={(v) => handleServiceChange(srv.id, 'description', v)}
                      textarea
                      rows={3}
                    />

                    <ImageUpload
                      label="صورة الخدمة الفاخرة (Service Card Image)"
                      value={srv.image}
                      onChange={(url) => handleServiceChange(srv.id, 'image', url)}
                      aspectHint="16:9 أو 4:3 موصى به"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: CTA */}
          {activeSection === 'cta' && (
            <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
              <div className="border-b border-border/70 pb-3">
                <h2 className="text-sm font-bold text-foreground">
                  {t.pagesEditor.ctaSection}
                </h2>
                <p className="text-xs text-muted-foreground">
                  قسم الدعوة للتواصل والحجز في نهاية الصفحة
                </p>
              </div>

              <MultiLangInput
                label="العنوان الرئيسي للدعوة"
                value={home.cta.title}
                onChange={(v) => handleCtaChange('title', v)}
              />
              <MultiLangInput
                label="النص التوضيحي"
                value={home.cta.description}
                onChange={(v) => handleCtaChange('description', v)}
                textarea
                rows={2}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <MultiLangInput
                  label="نص زر الحجز الأساسي"
                  value={home.cta.buttonText}
                  onChange={(v) => handleCtaChange('buttonText', v)}
                />
                <MultiLangInput
                  label="نص زر الواتساب الثانوي"
                  value={home.cta.secondaryText}
                  onChange={(v) => handleCtaChange('secondaryText', v)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTACT PAGE TAB */}
      {activePage === 'contact' && (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground">
              {t.pagesEditor.contactDetailsTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              تعديل بيانات التواصل، العناوين، وساعات العمل الرسمية
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-foreground">
                اسم الشركة
              </label>
              <input
                type="text"
                value={contact.companyName}
                onChange={(e) => handleContactChange('companyName', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">
                رقم الهاتف المباشر
              </label>
              <input
                type="text"
                value={contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">
                رقم الواتساب (بدون +)
              </label>
              <input
                type="text"
                value={contact.whatsapp}
                onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          <MultiLangInput
            label="عنوان المعرض والمكتب (Address)"
            value={contact.address}
            onChange={(v) => handleContactChange('address', v)}
          />

          <MultiLangInput
            label="ساعات وأيام العمل (Hours)"
            value={contact.hours}
            onChange={(v) => handleContactChange('hours', v)}
          />
        </div>
      )}

      {/* CARS PAGE TAB */}
      {activePage === 'cars' && (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Car className="size-4 text-primary" />
              <span>محتوى وبانر صفحة أسطول السيارات والبيع والاستيراد (/cars)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              تحكم في صورة البانر وعناوين ونصوص واجهة صفحة السيارات المعروضة للجمهور
            </p>
          </div>

          <ImageUpload
            label="صورة بانر صفحة السيارات الرئيسي (Cars Page Banner)"
            value={carsPage?.bannerImage || '/images/hero-showroom.png'}
            onChange={(url) => handleCarsPage('bannerImage', url)}
            aspectHint="16:9 أو بانورامي"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiLangInput
              label="النص التمهيدي (Eyebrow)"
              value={carsPage?.eyebrow || { ar: 'معرض الأسطول والمخزون', en: 'Fleet Inventory & Showroom', he: 'מלאי הצי ואולם התצוגה' }}
              onChange={(v) => handleCarsPage('eyebrow', v)}
            />
            <MultiLangInput
              label="العنوان الأساسي (Title)"
              value={carsPage?.title || { ar: 'السيارات المتاحة', en: 'Available Vehicles &', he: 'רכבים זמינים ו' }}
              onChange={(v) => handleCarsPage('title', v)}
            />
            <MultiLangInput
              label="الكلمة المميزة بالخط المائل (Title Italic / Em)"
              value={carsPage?.titleEm || { ar: 'والاستيراد المباشر', en: 'Direct Custom Imports', he: 'ייבוא אישי ישיר' }}
              onChange={(v) => handleCarsPage('titleEm', v)}
            />
          </div>

          <MultiLangInput
            label="الوصف التوضيحي لصفحة السيارات (Lead Description)"
            value={carsPage?.lead || { ar: 'شاحنات تجارية جاهزة للتسليم الفوري من ساحتنا، بالإضافة إلى خدمة استيراد مخصصة من أوروبا والإمارات واليابان.', en: 'Commercial vehicles in stock ready for instant delivery, plus bespoke importing tailored to your fleet requirements.', he: 'משאיות מסחריות זמינות למסירה מיידית מהמגרש שלנו, לצד שירות ייבוא אישי בהתאמה מלאה.' }}
            onChange={(v) => handleCarsPage('lead', v)}
            textarea
            rows={3}
          />
        </div>
      )}

      {/* PRODUCTS / SPARE PARTS PAGE TAB */}
      {activePage === 'products' && (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xs">
          <div className="border-b border-border/70 pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Package className="size-4 text-primary" />
              <span>محتوى وبانر صفحة قطع الغيار الأصلية (/products)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              تحكم في صورة البانر وعناوين ونصوص واجهة متجر قطع الغيار المعروضة للجمهور
            </p>
          </div>

          <ImageUpload
            label="صورة بانر صفحة قطع الغيار الرئيسي (Products Page Banner)"
            value={productsPage?.bannerImage || '/images/part-brake-pads.png'}
            onChange={(url) => handleProductsPage('bannerImage', url)}
            aspectHint="16:9 أو بانورامي"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiLangInput
              label="النص التمهيدي (Eyebrow)"
              value={productsPage?.eyebrow || { ar: 'قطع غيار شاحنات أصلية', en: 'Genuine Commercial Spare Parts', he: 'חלקי חילוף מקוריים למשאיות' }}
              onChange={(v) => handleProductsPage('eyebrow', v)}
            />
            <MultiLangInput
              label="العنوان الأساسي (Title)"
              value={productsPage?.title || { ar: 'قطع الغيار الأصلية المعتمدة', en: 'Certified Genuine OEM Parts &', he: 'חלפים מקוריים מוסמכים ו' }}
              onChange={(v) => handleProductsPage('title', v)}
            />
            <MultiLangInput
              label="الكلمة المميزة بالخط المائل (Title Italic / Em)"
              value={productsPage?.titleEm || { ar: 'لجميع الشاحنات الأوروبية', en: 'Heavy Duty Components', he: 'רכיבים לכל המשאיات' }}
              onChange={(v) => handleProductsPage('titleEm', v)}
            />
          </div>

          <MultiLangInput
            label="الوصف التوضيحي لصفحة قطع الغيار (Lead Description)"
            value={productsPage?.lead || { ar: 'كتالوج متكامل لقطع غيار مرسيدس أكتروس، مان، سكانيا، وفولفو مع ضمان أصلي وتوصيل سريع وشحن دولي.', en: 'Complete catalog of genuine OEM replacement parts for Mercedes Actros, MAN, Scania, and Volvo with express dispatch.', he: 'קטלוג מקיף של חלקי חילוף מקוריים למרצדס אקטרוס, סקאניה ווולוו עם משלוח מהיר ואחריות מלאה.' }}
            onChange={(v) => handleProductsPage('lead', v)}
            textarea
            rows={3}
          />
        </div>
      )}

      {/* POLICIES TAB */}
      {activePage === 'policies' && (
        <div className="space-y-6">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4"
            >
              <div className="border-b border-border/70 pb-3">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary uppercase">
                  {policy.id}
                </span>
              </div>

              <MultiLangInput
                label="عنوان السياسة"
                value={policy.title}
                onChange={(v) => handlePolicyChange(policy.id, 'title', v)}
              />

              <MultiLangInput
                label="النص والبنود القانونية الكاملة"
                value={policy.content}
                onChange={(v) => handlePolicyChange(policy.id, 'content', v)}
                textarea
                rows={5}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
