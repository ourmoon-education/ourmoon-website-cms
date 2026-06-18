import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config })
  
  try {
    const columns = await payload.db.drizzle.execute(
      `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('team_members', 'impact_stats')`
    );
    return NextResponse.json({ success: true, columns: columns.rows || columns });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message, stack: error instanceof Error ? error.stack : undefined })
  }
}
