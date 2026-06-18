import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config })
  
  try {
    const teams = await payload.find({ collection: 'team-members', limit: 5 })
    return NextResponse.json({ success: true, teams })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message, stack: error instanceof Error ? error.stack : undefined })
  }
}
