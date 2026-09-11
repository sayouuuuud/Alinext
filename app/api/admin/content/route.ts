import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { getAdminSiteContent, SITE_CONTENT_TAG } from '@/lib/content/repository'
import { saveAdminSection } from '@/lib/admin/content-repository'
import { AdminSessionError, validateAdminSession } from '@/lib/admin/session-server'
import {
  BLOG_TAG,
  CARS_TAG,
  PAGES_TAG,
  POLICIES_TAG,
  PRODUCTS_TAG,
  SETTINGS_TAG,
} from '@/lib/content/public-database'
import { SEO_TAG } from '@/lib/content/seo-tags'

export const dynamic = 'force-dynamic'

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function GET() {
  try {
    await validateAdminSession()
    return json(await getAdminSiteContent())
  } catch (error) {
    return json(
      { error: error instanceof AdminSessionError ? error.code : 'content_unavailable' },
      error instanceof AdminSessionError ? 401 : 500,
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await validateAdminSession()
    const payload = await request.json() as { scope?: unknown; data?: unknown }
    const saved = await saveAdminSection(payload.scope, payload.data, session)

    revalidateTag(SITE_CONTENT_TAG, { expire: 0 })
    const scopeTag = {
      pages: PAGES_TAG,
      cars: CARS_TAG,
      products: PRODUCTS_TAG,
      categories: PRODUCTS_TAG,
      blog: BLOG_TAG,
      settings: SETTINGS_TAG,
      orders: SITE_CONTENT_TAG,
      customers: SITE_CONTENT_TAG,
      inquiries: SITE_CONTENT_TAG,
    }[saved.scope]
    revalidateTag(scopeTag, { expire: 0 })
    if (saved.scope === 'pages') revalidateTag(POLICIES_TAG, { expire: 0 })
    if (saved.scope === 'settings' || saved.scope === 'pages') {
      revalidateTag(SEO_TAG, { expire: 0 })
    }

    revalidatePath('/', 'layout')
    revalidatePath('/cars')
    revalidatePath('/products')
    revalidatePath('/blog')

    return json({ success: true, scope: saved.scope, lastSaved: saved.lastSaved })
  } catch (error) {
    const unauthorized = error instanceof AdminSessionError
    return json(
      { error: unauthorized ? error.code : 'save_failed' },
      unauthorized ? 401 : 400,
    )
  }
}
