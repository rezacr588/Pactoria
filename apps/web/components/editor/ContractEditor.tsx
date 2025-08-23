"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { supabase, functionsUrl } from '../../lib/supabaseClient'
import { uint8ToBase64 } from './y-base64'

interface ContractEditorProps {
  contractId: string;
  initialContent?: any;
  onContentChange?: (content: any) => void;
}

export function ContractEditor({ contractId, initialContent, onContentChange }: ContractEditorProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [template, setTemplate] = useState<string | null>(null)
  const [peerCount, setPeerCount] = useState(1)
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const room = `contract:${contractId}`

  // Create Y.Doc instance with proper cleanup
  useEffect(() => {
    const doc = new Y.Doc()
    setYdoc(doc)
    
    return () => {
      // Cleanup Y.Doc when component unmounts or contractId changes
      doc.destroy()
    }
  }, [contractId])

  // Init TipTap with Yjs document
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      ydoc ? Collaboration.configure({ document: ydoc }) : StarterKit,
    ],
    editable: true,
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getJSON())
      }
    },
  }, [ydoc]) // Re-create editor when ydoc changes

  // Load initial content or latest saved content
  useEffect(() => {
    if (!editor || !ydoc) return
    
    // If initialContent is provided, use it
    if (initialContent) {
      editor.commands.setContent(initialContent)
      return
    }
    
    // Otherwise, load from database
    const controller = new AbortController()
    
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('contract_versions')
          .select('content_json')
          .eq('contract_id', contractId)
          .order('version_number', { ascending: false })
          .limit(1)
        
        if (controller.signal.aborted) return
        
        if (error) throw error
        const latest = data?.[0]?.content_json
        if (latest) {
          editor.commands.setContent(latest)
        }
      } catch (_) {
        // ignore initial load errors
      }
    })()
    
    return () => {
      controller.abort()
    }
  }, [contractId, editor, initialContent, ydoc])

  // Attach y-webrtc provider (P2P) so Yjs can sync with peers
  useEffect(() => {
    if (!ydoc) return
    
    let provider: any
    let cancelled = false
    
    ;(async () => {
      const mod = await import('y-webrtc')
      if (cancelled || !ydoc) return
      
      const WebrtcProvider = mod.WebrtcProvider
      provider = new WebrtcProvider(room, ydoc, {
        signaling: ['wss://signaling.yjs.dev'],
      })
      
      try {
        const aw = provider.awareness
        const update = () => {
          if (!cancelled) {
            try {
              setPeerCount(aw.getStates().size)
            } catch (_) {}
          }
        }
        aw.on('change', update)
        update()
      } catch (_) {}
    })()
    
    return () => {
      cancelled = true
      if (provider) {
        provider.destroy()
      }
    }
  }, [room, ydoc])

  const saveSnapshot = useCallback(async () => {
    if (!editor || !ydoc) return
    setSaving(true)
    setError(null)
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    try {
      const contentJson = editor.getJSON() as any
      const update = Y.encodeStateAsUpdate(ydoc)
      const base64 = uint8ToBase64(update)

      // Use Supabase RPC instead of Next.js API for consistency
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase.rpc('take_snapshot', {
        p_contract_id: contractId,
        p_content_json: contentJson,
        p_content_md: null,
        p_ydoc_state_base64: base64,
      })

      if (error) throw error
      
      // Notify listeners (e.g., VersionTimeline) that a snapshot was saved
      try {
        window.dispatchEvent(new CustomEvent('contract:snapshot-saved', { detail: { contractId } }))
      } catch (_) {}
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError(e?.message ?? 'Failed to save snapshot')
      }
    } finally {
      setSaving(false)
      abortControllerRef.current = null
    }
  }, [contractId, editor, ydoc])

  const analyzeRisks = useCallback(async () => {
    if (!editor) return
    setAnalyzing(true)
    setError(null)
    
    const controller = new AbortController()
    
    try {
      const text = editor.getText()
      const { data: sess } = await supabase.auth.getSession()
      const res = await fetch(`${functionsUrl}/functions/v1/ai/analyze-risks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sess.session?.access_token ? { 'Authorization': `Bearer ${sess.session.access_token}` } : {}),
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'AI analyze failed')
      setAnalysis(json)
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError(e?.message ?? 'Failed to analyze risks')
      }
    } finally {
      setAnalyzing(false)
    }
  }, [editor])

  const generateTemplate = useCallback(async () => {
    if (!editor) return
    setGenerating(true)
    setError(null)
    setTemplate(null)
    
    const controller = new AbortController()
    
    try {
      const { data: sess } = await supabase.auth.getSession()
      const res = await fetch(`${functionsUrl}/functions/v1/ai/generate-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sess.session?.access_token ? { 'Authorization': `Bearer ${sess.session.access_token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'AI generate failed')
      setTemplate(json.result || '')
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError(e?.message ?? 'Failed to generate template')
      }
    } finally {
      setGenerating(false)
    }
  }, [prompt, editor])

  const insertTemplateIntoEditor = useCallback(() => {
    if (!editor || !template) return
    // Simple transform: split by double newline into paragraphs
    const paras = template.split(/\n\n+/).map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p }] }))
    editor.commands.setContent({ type: 'doc', content: paras })
  }, [editor, template])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Room: <span className="font-mono">{room}</span> · Peers: <span className="font-mono">{peerCount}</span></div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveSnapshot}
            disabled={saving}
            className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Snapshot'}
          </button>
          <button
            onClick={analyzeRisks}
            disabled={analyzing}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {analyzing ? 'Analyzing…' : 'Analyze Risks'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500 bg-red-50 p-2 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-white p-4 shadow-card">
        <h3 className="mb-2 font-medium">AI Template Generator</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 2-page NDA between startup and contractor"
            className="min-w-[280px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={generateTemplate}
            disabled={generating || !prompt.trim()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
          <button
            onClick={insertTemplateIntoEditor}
            disabled={!template}
            className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            Insert into Editor
          </button>
        </div>
        {template && (
          <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-xs text-gray-800">{template}</pre>
        )}
      </div>

      <div className="rounded-md border bg-white p-3 shadow-card" data-testid="contract-editor">
        <EditorContent editor={editor} />
      </div>

      {analysis && (
        <div className="rounded-lg bg-white p-4 shadow-card">
          <h3 className="mb-2 font-medium">Risk Analysis</h3>
          <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-xs text-gray-800">{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
