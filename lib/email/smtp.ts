import 'server-only'

import { createTransport, type Transporter } from 'nodemailer'

type SmtpConfig = {
  user: string
  password: string
  fromEmail: string
  fromName: string
}

let transporter: Transporter | null = null
let transporterKey = ''

export function getSmtpConfig(): SmtpConfig | null {
  const user = process.env.SMTP_USER?.trim().toLowerCase()
  const password = process.env.SMTP_APP_PASSWORD?.replace(/\s+/g, '')
  if (!user || !password) return null

  return {
    user,
    password,
    fromEmail: process.env.SMTP_FROM_EMAIL?.trim() || user,
    fromName: process.env.SMTP_FROM_NAME?.trim() || 'ALI FLEET',
  }
}

export function getSmtpTransport(config: SmtpConfig) {
  const key = `${config.user}:${config.fromEmail}`
  if (transporter && transporterKey === key) return transporter

  transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: 'TLSv1.2' },
  })
  transporterKey = key
  return transporter
}
