import 'server-only'

import nodemailer, { type Transporter } from 'nodemailer'

export type SmtpConfig = {
  user: string
  pass: string
  fromEmail: string
  fromName: string
}

let cachedTransporter: Transporter | null = null
let cachedKey = ''

export function getSmtpConfig(): SmtpConfig | null {
  const user = (process.env.SMTP_USER || '').trim()
  const pass = (process.env.SMTP_APP_PASSWORD || '').trim()
  if (!user || !pass) return null
  return {
    user,
    pass,
    fromEmail: (process.env.SMTP_FROM_EMAIL || '').trim() || user,
    fromName: (process.env.SMTP_FROM_NAME || '').trim() || 'ALI FLEET',
  }
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null
}

function transporterFor(config: SmtpConfig): Transporter {
  const key = `${config.user}\n${config.fromEmail}`
  if (!cachedTransporter || cachedKey !== key) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: config.user, pass: config.pass },
    })
    cachedKey = key
  }
  return cachedTransporter
}

export type SendMailInput = {
  to: string
  subject: string
  html: string
  text: string
  messageId: string
}

export async function sendSmtpMail(input: SendMailInput): Promise<{ skipped: boolean; messageId?: string }> {
  const config = getSmtpConfig()
  if (!config) return { skipped: true }
  const to = input.to.trim()
  if (!to || !to.includes('@')) throw new Error('invalid_recipient')
  const transporter = transporterFor(config)
  const info = await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: { 'Message-ID': input.messageId },
  })
  const providerId = typeof info?.messageId === 'string' && info.messageId ? info.messageId : input.messageId
  return { skipped: false, messageId: providerId.slice(0, 500) }
}
