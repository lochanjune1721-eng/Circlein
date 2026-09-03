import { NextResponse } from 'next/server'
import { statusByToken } from '@/lib/applications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * An applicant checks their own application with the token they were given.
 * The token is the only credential, so it is never listed anywhere and the
 * response contains nothing about anyone else.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token || token.length < 16) {
    return NextResponse.json({ ok: false, error: 'Missing token.' }, { status: 400 })
  }

  const view = await statusByToken(token)
  if (!view) {
    return NextResponse.json({ ok: false, error: 'No application found for that link.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, application: view })
}
