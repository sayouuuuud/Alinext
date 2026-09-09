'use client'

import NextLink from 'next/link'
import type { ComponentProps } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { localizeHref } from '@/lib/i18n/routing'

type LocaleLinkProps = ComponentProps<typeof NextLink>

export default function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const { locale } = useLanguage()
  const localizedHref = typeof href === 'string' ? localizeHref(href, locale) : href

  return <NextLink href={localizedHref} {...props} />
}
