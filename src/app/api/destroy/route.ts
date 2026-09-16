// api/destroy/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateChannelRepo } from '../../../channel'
import config from '../../../config'
import { isRateLimited, normalizeClientIp } from '../../../utils/rateLimit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = normalizeClientIp(request.headers.get('x-forwarded-for'))
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { slug, secret } = body as { slug?: unknown; secret?: unknown }

  // Validate slug shape before touching storage.
  if (typeof slug !== 'string' || slug.length < 3 || slug.length > 256) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }
  if (typeof secret !== 'string' || secret.length === 0) {
    return NextResponse.json({ error: 'Secret is required' }, { status: 400 })
  }

  // Enforce configured slug length bounds when available.
  const maxSlug = config.bodyKeys.slug.max
  const minSlug = config.bodyKeys.slug.min
  if (slug.length < minSlug || slug.length > maxSlug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  try {
    // Only the uploader holding the channel secret can destroy the channel.
    const deleted = await getOrCreateChannelRepo().destroyChannel(slug, secret)
    return NextResponse.json({ success: deleted }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to destroy channel' },
      { status: 500 },
    )
  }
}
