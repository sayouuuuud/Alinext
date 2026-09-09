import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { defaultSiteContent } from '@/lib/admin/default-content'
import type { SiteFullContent } from '@/lib/admin/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const CONTENT_FILE = path.join(DATA_DIR, 'site-content.json')

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export async function GET() {
  try {
    ensureDirectoryExists()
    if (fs.existsSync(CONTENT_FILE)) {
      const raw = fs.readFileSync(CONTENT_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed && parsed.pages && parsed.version === defaultSiteContent.version) {
        return NextResponse.json(parsed)
      }
    }
    // Return default if file doesn't exist or is older version
    return NextResponse.json(defaultSiteContent)
  } catch (error) {
    console.warn('API /api/admin/content GET error:', error)
    return NextResponse.json(defaultSiteContent)
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SiteFullContent
    if (!payload || !payload.pages) {
      return NextResponse.json({ error: 'Invalid content payload' }, { status: 400 })
    }

    ensureDirectoryExists()
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(payload, null, 2), 'utf8')
    return NextResponse.json({ success: true, lastSaved: payload.lastSaved })
  } catch (error) {
    console.error('API /api/admin/content POST error:', error)
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 })
  }
}
