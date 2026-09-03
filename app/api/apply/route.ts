import { NextResponse } from 'next/server'
import { submitApplication } from '@/lib/applications'
import { applySchema, fieldErrors } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected JSON.' }, { status: 400 })
  }

  const parsed = applySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Some details need another look.', fields: fieldErrors(parsed.error) },
      { status: 422 },
    )
  }

  // Honeypot. Bots fill every field they find; answer as if it worked so they
  // do not learn to leave it alone.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, statusToken: 'x', status: 'pending' })
  }

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null

  const result = await submitApplication({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    linkedinUrl: parsed.data.linkedinUrl,
    whatsapp: parsed.data.whatsapp,
    citySlug: parsed.data.citySlug,
    nicheSlug: parsed.data.nicheSlug,
    rawTitle: parsed.data.rawTitle,
    company: parsed.data.company ?? null,
    note: parsed.data.note ?? null,
    declaredStartedAt: parsed.data.declaredStartedAt ?? null,
    ip,
    userAgent: request.headers.get('user-agent'),
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 409 })
  }

  return NextResponse.json({ ok: true, statusToken: result.statusToken, status: result.status })
}
