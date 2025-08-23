// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: collab-token
// Mint ephemeral tokens for collaboration providers; verify access via RLS.

import { Hono } from 'https://deno.land/x/hono@v3.12.0/mod.ts'
import { cors } from 'https://deno.land/x/hono@v3.12.0/middleware/cors/index.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { sign } from 'https://deno.land/x/hono@v3.12.0/middleware/jwt/index.ts'

const app = new Hono()
app.use('*', cors())

function makeRlsClient(req: Request) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
}

app.get('/', (c) => c.json({ name: 'collab-token', status: 'ok' }))

app.post('/', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const body = await c.req.json().catch(() => ({})) as {
    contractId?: string
    provider?: 'y-webrtc' | 'hocuspocus' | 'liveblocks'
    roomId?: string
  }

  if (!body.contractId || !body.provider || !body.roomId) {
    return c.json({ error: 'contractId, provider, roomId required' }, 400)
  }

  // Ensure user is authenticated and has access to the contract
  const { data: userRes, error: uerr } = await sb.auth.getUser()
  if (uerr || !userRes.user) return c.json({ error: 'unauthorized' }, 401)
  const userId = userRes.user.id

  const { data: contract, error: cerr } = await sb
    .from('contracts')
    .select('id')
    .eq('id', body.contractId)
    .single()
  if (cerr || !contract) return c.json({ error: 'forbidden' }, 403)

  if (body.provider === 'y-webrtc') {
    // No token needed; gate by app auth & RLS
    return c.json({ ok: true })
  }

  if (body.provider === 'hocuspocus') {
    const secret = Deno.env.get('HOCUSPOCUS_JWT_SECRET')
    if (!secret) return c.json({ error: 'server not configured' }, 500)
    const exp = Math.floor(Date.now() / 1000) + 10 * 60 // 10 minutes
    const token = await sign({ roomId: body.roomId, contractId: body.contractId, userId, exp }, secret)
    return c.json({ token, provider: 'hocuspocus', exp })
  }

  if (body.provider === 'liveblocks') {
    // Post-MVP: implement per Liveblocks server-token requirements
    return c.json({ error: 'provider not enabled' }, 400)
  }

  return c.json({ error: 'invalid provider' }, 400)
})

Deno.serve(app.fetch)
