import { NextResponse } from 'next/server'
import { z } from 'zod'
import { decide, isAdmin, pendingReviews } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const decisionSchema = z.object({
  applicationId: z.uuid(),
  decision: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(600).default(''),
})

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'Not authorised.' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, items: await pendingReviews() })
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'Not authorised.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected JSON.' }, { status: 400 })
  }

  const parsed = decisionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid decision.' }, { status: 422 })
  }

  const result = await decide(parsed.data.applicationId, parsed.data.decision, parsed.data.note)
  const status = result.ok ? 200 : 500
  return NextResponse.json(result, { status })
}
