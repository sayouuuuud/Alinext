import { NextResponse } from 'next/server'
import { validateAdminSession, AdminSessionError } from '@/lib/admin/session-server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await validateAdminSession()
    const contentType = request.headers.get('content-type') || ''

    let buffer: Buffer
    let mimeType = 'image/jpeg'
    let originalName = 'upload.jpg'

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'no_file' }, { status: 400 })
      }
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      mimeType = file.type || 'image/jpeg'
      originalName = file.name || 'upload.jpg'
    } else {
      const body = await request.json()
      if (!body?.dataUrl) {
        return NextResponse.json({ error: 'missing_data' }, { status: 400 })
      }
      const match = String(body.dataUrl).match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
      if (!match) {
        return NextResponse.json({ error: 'invalid_data_url' }, { status: 400 })
      }
      mimeType = match[1]
      buffer = Buffer.from(match[2], 'base64')
      originalName = body.fileName || 'upload.jpg'
    }

    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const safeName = originalName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
    const filePath = `uploads/${Date.now()}-${safeName}.${ext}`

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from('alifleet-media')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ error: 'upload_failed', details: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = admin.storage
      .from('alifleet-media')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    })
  } catch (error) {
    if (error instanceof AdminSessionError) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    console.error('Upload handler error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
