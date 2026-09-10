import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { getAdminSiteContent, SITE_CONTENT_TAG } from '@/lib/content/repository'
import { saveAdminContent } from '@/lib/admin/content-repository'
import { AdminSessionError, validateAdminSession } from '@/lib/admin/session-server'
import type { SiteFullContent } from '@/lib/admin/types'

export const dynamic = 'force-dynamic'

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET() {
  try {
    await validateAdminSession()
    return json(await getAdminSiteContent())
  } catch (error) {
    return json({ error: error instanceof AdminSessionError ? error.code : 'content_unavailable' }, error instanceof AdminSessionError ? 401 : 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await validateAdminSession()
    const payload = await request.json() as SiteFullContent
    const saved = await saveAdminContent(payload, session)
    revalidateTag(SITE_CONTENT_TAG, { expire: 0 })
    return json({ success: true, lastSaved: saved.lastSaved })
  } catch (error) {
    const unauthorized = error instanceof AdminSessionError
    return json({ error: unauthorized ? error.code : 'save_failed' }, unauthorized ? 401 : 400)
  }
}
