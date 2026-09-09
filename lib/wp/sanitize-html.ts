import 'server-only'

import sanitizeHtml from 'sanitize-html'

const SAFE_REL_VALUES = new Set(['nofollow', 'noopener', 'noreferrer', 'ugc'])

function safeUrl(value: string | undefined, image = false) {
  if (!value) return ''
  const normalized = value.trim()
  if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized) || normalized.includes('\\')) {
    return ''
  }

  if (normalized.startsWith('#')) return image ? '' : normalized
  if (!/^[a-z][a-z\d+.-]*:/i.test(normalized)) {
    return normalized.startsWith('//') ? '' : normalized
  }

  try {
    const url = new URL(normalized)
    const allowedProtocols = image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:', 'tel:']
    if (!allowedProtocols.includes(url.protocol) || url.username || url.password) return ''
    if (url.protocol === 'http:' && url.hostname.toLowerCase() === 'a-f.site') {
      url.protocol = 'https:'
    }
    return url.toString()
  } catch {
    return ''
  }
}

function safeSrcSet(value: string | undefined) {
  if (!value) return ''
  return value
    .split(',')
    .map((candidate) => {
      const [url, descriptor, ...rest] = candidate.trim().split(/\s+/)
      const cleanUrl = safeUrl(url, true)
      if (!cleanUrl || rest.length > 0) return ''
      if (descriptor && !/^\d+(?:\.\d+)?[wx]$/.test(descriptor)) return ''
      return [cleanUrl, descriptor].filter(Boolean).join(' ')
    })
    .filter(Boolean)
    .join(', ')
}

const options = {
  allowedTags: [
    'a',
    'blockquote',
    'br',
    'caption',
    'code',
    'dd',
    'div',
    'dl',
    'dt',
    'em',
    'figcaption',
    'figure',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'img',
    'li',
    'ol',
    'p',
    'pre',
    'span',
    'strong',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
  ],
  allowedAttributes: {
    '*': ['class', 'dir', 'lang'],
    a: ['aria-label', 'href', 'rel', 'role', 'target'],
    img: [
      'alt',
      'class',
      'decoding',
      'height',
      'loading',
      'role',
      'sizes',
      'src',
      'srcset',
      'title',
      'width',
    ],
    ol: ['start'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'data-align', 'rowspan', 'scope'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  nestingLimit: 30,
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  parseStyleAttributes: false,
  transformTags: {
    a: (_tagName: string, attributes: sanitizeHtml.Attributes) => {
      const href = safeUrl(attributes.href)
      const transformed = { ...attributes }
      if (href) transformed.href = href
      else delete transformed.href

      const rel = new Set(
        (attributes.rel ?? '')
          .split(/\s+/)
          .map((value) => value.toLowerCase())
          .filter((value) => SAFE_REL_VALUES.has(value))
      )
      if (attributes.target === '_blank') {
        rel.add('noopener')
        rel.add('noreferrer')
        transformed.target = '_blank'
      } else {
        delete transformed.target
      }
      if (rel.size) transformed.rel = [...rel].join(' ')
      else delete transformed.rel
      return { tagName: 'a', attribs: transformed }
    },
    img: (_tagName: string, attributes: sanitizeHtml.Attributes) => {
      const transformed = { ...attributes }
      const src = safeUrl(attributes.src, true)
      const srcset = safeSrcSet(attributes.srcset)
      if (src) transformed.src = src
      else delete transformed.src
      if (srcset) transformed.srcset = srcset
      else delete transformed.srcset
      if (!['async', 'auto', 'sync'].includes(transformed.decoding ?? '')) {
        delete transformed.decoding
      }
      if (!['eager', 'lazy'].includes(transformed.loading ?? '')) {
        delete transformed.loading
      }
      return { tagName: 'img', attribs: transformed }
    },
  },
} satisfies sanitizeHtml.IOptions

export function sanitizeWordPressHtml(value: string | null | undefined) {
  return sanitizeHtml(value ?? '', options)
}
