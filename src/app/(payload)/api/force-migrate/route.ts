import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import * as catchupMigration from '../../../../migrations/20260618_150000_add_missing_enum_columns'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config })
  
  try {
    // Run the migration SQL directly against the drizzle instance
    await catchupMigration.up({ payload, db: payload.db.drizzle as any, req: {} as any })
    return NextResponse.json({ success: true, message: 'Forced migration successful!' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message })
  }
}
