// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: contracts
// Baseline CRUD + versions + approvals routes using RLS-aware client.

import { Hono } from 'https://deno.land/x/hono@v3.12.0/mod.ts'
import { cors } from 'https://deno.land/x/hono@v3.12.0/middleware/cors/index.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const app = new Hono()
app.use('*', cors())

function makeRlsClient(req: Request) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
}

app.get('/', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const { data, error } = await sb.from('contracts').select('*').order('updated_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

app.post('/', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const body = await c.req.json().catch(() => ({})) as { title?: string }
  if (!body.title) return c.json({ error: 'title required' }, 400)
  const { data: userRes, error: uerr } = await sb.auth.getUser()
  if (uerr || !userRes.user) return c.json({ error: 'unauthorized' }, 401)
  const owner_id = userRes.user.id
  const { data, error } = await sb.from('contracts').insert({ title: body.title, owner_id }).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ contract: data })
})

app.get('/:id', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const id = c.req.param('id')
  const { data, error } = await sb.from('contracts').select('*').eq('id', id).single()
  if (error) return c.json({ error: error.message }, 404)
  return c.json({ contract: data })
})

app.patch('/:id', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { title?: string; status?: string }
  const patch: Record<string, unknown> = {}
  if (typeof body.title === 'string') patch.title = body.title
  if (typeof body.status === 'string') patch.status = body.status
  if (!Object.keys(patch).length) return c.json({ error: 'no fields to update' }, 400)
  const { data, error } = await sb.from('contracts').update(patch).eq('id', id).select('*').single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ contract: data })
})

app.delete('/:id', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const id = c.req.param('id')
  const { error } = await sb.from('contracts').delete().eq('id', id)
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ ok: true })
})

// Versions
app.get('/:id/versions', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const id = c.req.param('id')
  const { data, error } = await sb.from('contract_versions').select('*').eq('contract_id', id).order('version_number', { ascending: false })
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ items: data })
})

app.post('/:id/versions/snapshot', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { content_json?: unknown; content_md?: string; ydoc_state?: string }
  const { data: userRes, error: uerr } = await sb.auth.getUser()
  if (uerr || !userRes.user) return c.json({ error: 'unauthorized' }, 401)

  const { data: contract, error: cerr } = await sb.from('contracts').select('id, latest_version_number').eq('id', id).single()
  if (cerr) return c.json({ error: cerr.message }, 404)

  const next = (contract.latest_version_number ?? 0) + 1
  const { data: ver, error: verr } = await sb
    .from('contract_versions')
    .insert({
      contract_id: id,
      version_number: next,
      content_json: body.content_json ?? null,
      content_md: body.content_md ?? null,
      // PostgREST expects bytea as base64-encoded string in JSON
      ydoc_state: typeof body.ydoc_state === 'string' ? body.ydoc_state : null,
      created_by: userRes.user.id,
    })
    .select('*')
    .single()
  if (verr) return c.json({ error: verr.message }, 400)

  const { error: uerr2 } = await sb.from('contracts').update({ latest_version_number: next }).eq('id', id)
  if (uerr2) return c.json({ error: uerr2.message, version: ver }, 207)
  return c.json({ version: ver })
})

// Approvals
app.post('/:id/approvals', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { version_id?: string; approver_ids?: string[] }
  if (!body.version_id || !Array.isArray(body.approver_ids) || body.approver_ids.length === 0) {
    return c.json({ error: 'version_id and approver_ids[] required' }, 400)
  }
  const rows = body.approver_ids.map((approver_id) => ({ contract_id: id, version_id: body.version_id!, approver_id }))
  const { data, error } = await sb.from('contract_approvals').insert(rows).select('*')
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ approvals: data })
})

app.post('/approvals/:approvalId/decision', async (c) => {
  const sb = makeRlsClient(c.req.raw)
  const approvalId = c.req.param('approvalId')
  const body = await c.req.json().catch(() => ({})) as { status?: 'approved' | 'rejected'; comment?: string }
  if (body.status !== 'approved' && body.status !== 'rejected') return c.json({ error: 'status must be approved|rejected' }, 400)
  const { data, error } = await sb
    .from('contract_approvals')
    .update({ status: body.status, comment: body.comment ?? null, decided_at: new Date().toISOString() })
    .eq('id', approvalId)
    .select('*')
    .single()
  if (error) return c.json({ error: error.message }, 400)
  return c.json({ approval: data })
})

Deno.serve(app.fetch)
