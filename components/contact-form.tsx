'use client'

import { useActionState, useState } from 'react'
import { CheckCircle2, Loader2, MessageCircle, Send } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/language-context'
import { whatsappLink } from '@/lib/site-config'
import { useStore } from '@/lib/store-context'
import { submitInquiryAction } from '@/lib/commerce/actions'
import { idleInquiryState, type InquiryErrorCode } from '@/lib/commerce/types'

type SubjectKey = 'parts' | 'import' | 'fleet' | 'other'
const subjectKeys: SubjectKey[] = ['parts', 'import', 'fleet', 'other']

function errorMessage(code: InquiryErrorCode, locale: 'ar' | 'en' | 'he') {
  const messages = {
    ar: {
      invalid_fields: 'تحقق من الحقول المطلوبة. يجب أن تتضمن الرسالة تفاصيل كافية.',
      rate_limited: 'تم إرسال عدة طلبات. انتظر قليلاً ثم حاول مجدداً.',
      submit_failed: 'تعذر حفظ طلبك الآن. يمكنك استخدام واتساب أو المحاولة مرة أخرى.',
    },
    en: {
      invalid_fields: 'Check the required fields and include enough detail in your message.',
      rate_limited: 'Too many requests were sent. Wait a moment and try again.',
      submit_failed: 'We could not save your request. Try again or use WhatsApp.',
    },
    he: {
      invalid_fields: 'בדקו את שדות החובה והוסיפו מספיק פרטים להודעה.',
      rate_limited: 'נשלחו יותר מדי בקשות. המתינו מעט ונסו שוב.',
      submit_failed: 'לא הצלחנו לשמור את הפנייה. נסו שוב או השתמשו ב-WhatsApp.',
    },
  }
  return messages[locale][code]
}

export function ContactForm() {
  const { t, locale } = useLanguage()
  const store = useStore()
  const searchParams = useSearchParams()
  const initialSubject = searchParams.get('subject')
  const [state, formAction, pending] = useActionState(submitInquiryAction, idleInquiryState)
  const [subject, setSubject] = useState<SubjectKey>(
    subjectKeys.includes(initialSubject as SubjectKey) ? (initialSubject as SubjectKey) : 'parts',
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const composed = [
    `${t.contact.subject}: ${t.contact.subjects[subject]}`,
    `${t.contact.name}: ${name}`,
    `${t.contact.phone}: ${phone}`,
    `${t.common.email}: ${email}`,
    '',
    message,
  ].join('\n')

  const fieldClass =
    'mt-2 w-full rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-accent disabled:opacity-60'
  const labelClass = 'block text-sm font-medium text-foreground'

  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-card p-8 text-center ring-1 ring-border md:p-12" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-balance font-serif text-2xl tracking-tight text-foreground">
          {locale === 'ar' ? 'تم استلام طلبك' : locale === 'he' ? 'הפנייה התקבלה' : 'Your request is in'}
        </h2>
        <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {locale === 'ar'
            ? 'حُفظت رسالتك لدى فريق علي فليت، وسنتواصل معك خلال يوم عمل واحد.'
            : locale === 'he'
              ? 'ההודעה נשמרה אצל צוות ALI FLEET ונחזור אליכם בתוך יום עסקים אחד.'
              : 'Your message is saved with the ALI FLEET team. We will respond within one business day.'}
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8">
      <h2 className="font-serif text-2xl tracking-tight text-foreground">{t.contact.formTitle}</h2>

      <div className="mt-7 flex flex-col gap-5">
        {state.status === 'error' ? (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-destructive ring-1 ring-destructive/20">
            {errorMessage(state.code, locale)}
          </p>
        ) : null}

        <div className="sr-only" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={labelClass}>
              {t.contact.name} <span className="text-accent">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.contact.namePlaceholder}
              disabled={pending}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="contact-phone" className={labelClass}>
              {t.contact.phone} <span className="text-accent">*</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              required
              minLength={5}
              maxLength={40}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t.contact.phonePlaceholder}
              disabled={pending}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClass}>
            {t.common.email} <span className="text-accent">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            required
            type="email"
            dir="ltr"
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.contact.emailPlaceholder}
            disabled={pending}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="contact-subject" className={labelClass}>{t.contact.subject}</label>
          <select
            id="contact-subject"
            name="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value as SubjectKey)}
            disabled={pending}
            className={fieldClass}
          >
            {subjectKeys.map((key) => (
              <option key={key} value={key}>{t.contact.subjects[key]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClass}>
            {t.contact.message} <span className="text-accent">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t.contact.messagePlaceholder}
            disabled={pending}
            className={`${fieldClass} resize-y`}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            {pending
              ? locale === 'ar' ? 'جاري الإرسال...' : locale === 'he' ? 'שולח...' : 'Sending...'
              : t.contact.send}
          </button>
          {store.whatsapp ? (
            <a
              href={whatsappLink(composed, store.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t.contact.sendWhatsapp}
            </a>
          ) : null}
        </div>
      </div>
    </form>
  )
}
