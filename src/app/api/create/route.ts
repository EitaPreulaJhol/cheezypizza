// api/create/route.ts

import { NextResponse } from 'next/server'
import { getOrCreateChannelRepo } from '../../../channel'
import config from '../../../config'

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { uploaderPeerID } = body as { uploaderPeerID?: unknown }

  // Validate peer ID shape before creating storage entries.
  if (typeof uploaderPeerID !== 'string') {
    return NextResponse.json(
      { error: 'Uploader peer ID is required' },
      { status: 400 },
    )
  }
  const { min, max } = config.bodyKeys.uploaderPeerID
  if (uploaderPeerID.length < min || uploaderPeerID.length > max) {
    return NextResponse.json(
      { error: 'Invalid uploader peer ID' },
      { status: 400 },
    )
  }

  const channel = await getOrCreateChannelRepo().createChannel(uploaderPeerID)
  return NextResponse.json(channel)
}
