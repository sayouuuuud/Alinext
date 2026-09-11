import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminSiteContent, SITE_CONTENT_TAG } from '@/lib/content/repository'
import { AdminContentError, saveAdminSection } from '@/lib/admin/content-repository'
import { AdminResourceError, deleteAdminResource } from '@/lib/admin/resource-actions'
import { AdminSessionError, validateAdminSession } from '@/lib/admin/session-server'
import {
  BLOG_TAG,
  CARS_TAG,
  CATEGORIES_TAG,
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
      error instanceof AdminSessionError ? (error.code === 'not_authorized' || error.code === 'mfa_required' ? 403 : 401) : 500,
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
      categories: CATEGORIES_TAG,
      blog: BLOG_TAG,
      settings: SETTINGS_TAG,
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
    if (error instanceof AdminSessionError) {
      return json({ error: error.code }, error.code === 'not_authorized' || error.code === 'mfa_required' ? 403 : 401)
    }
    if (error instanceof AdminContentError) return json({ error: error.code }, 422)
    if (error instanceof ZodError) {
      return json({ error: 'validation_failed', fields: error.issues.map((issue) => issue.path.join('.')).filter(Boolean) }, 422)
    }
    if (error instanceof SyntaxError) return json({ error: 'invalid_json' }, 422)
    return json({ error: 'save_failed' }, 500)
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await request.json() as { resource?: unknown; id?: unknown }
    const result = await deleteAdminResource(payload.resource, payload.id)
    revalidateTag(SITE_CONTENT_TAG, { expire: 0 })
    revalidatePath('/', 'layout')
    return json({ success: true, ...result })
  } catch (error) {
    if (error instanceof AdminSessionError) {
      return json({ error: error.code }, error.code === 'not_authorized' || error.code === 'mfa_required' ? 403 : 401)
    }
    if (error instanceof AdminResourceError) return json({ error: error.code }, error.status)
    if (error instanceof ZodError) return json({ error: 'validation_failed' }, 422)
    if (error instanceof SyntaxError) return json({ error: 'invalid_json' }, 422)
    return json({ error: 'delete_failed' }, 500)
  }
}
