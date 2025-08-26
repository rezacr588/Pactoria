'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'
import { defaultContractTemplate } from '@/lib/templates/legal-templates'

interface UseContractEditorProps {
  ydoc: Y.Doc
  provider: WebrtcProvider | null
  user: any
  initialContent?: any
  readOnly?: boolean
  onSave?: (content: any) => Promise<void>
  onContentChange?: (content: any) => void
  onTypingChange?: (isTyping: boolean) => void
}

export function useContractEditor({
  ydoc,
  provider,
  user,
  initialContent,
  readOnly = false,
  onSave,
  onContentChange,
  onTypingChange
}: UseContractEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Yjs handles history
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      ...(provider && user ? [
        CollaborationCursor.configure({
          provider,
          user: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
            color: getUserColor(user.id),
          },
        })
      ] : []),
    ],
    content: initialContent || defaultContractTemplate,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      setHasUnsavedChanges(true)
      if (onContentChange) {
        onContentChange(editor.getJSON())
      }
      if (onTypingChange) {
        onTypingChange(true)
        setTimeout(() => onTypingChange(false), 1000)
      }
    },
  }, [ydoc, provider, user])

  // Save handler
  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return

    setIsSaving(true)
    try {
      const content = editor.getJSON()
      await onSave(content)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

  // Insert content helpers
  const insertClause = useCallback((content: string) => {
    if (editor) {
      editor.chain().focus().insertContent(content).run()
    }
  }, [editor])

  const insertSection = useCallback((sectionType: string) => {
    if (!editor) return
    
    const templates: Record<string, string> = {
      preamble: '<h2>Preamble</h2><p>This Agreement is entered into as of [DATE], by and between [PARTY_A] and [PARTY_B].</p>',
      definitions: '<h2>Definitions</h2><p><strong>\"Agreement\"</strong> means this contract agreement.</p>',
      terms: '<h2>Terms and Conditions</h2><ol><li>[Term 1]</li><li>[Term 2]</li></ol>',
    }
    
    const template = templates[sectionType] || '<h2>Section</h2><p>[Content]</p>'
    editor.chain().focus().insertContent(template).run()
  }, [editor])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !onSave) return

    const autoSaveTimer = setTimeout(() => {
      handleSave().catch(console.error)
    }, 30000) // Auto-save after 30 seconds

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, handleSave, onSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave().catch(console.error)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  return {
    editor,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    handleSave,
    insertClause,
    insertSection
  }
}

// Utility function
function getUserColor(userId: string): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length] || '#4D96FF'
}