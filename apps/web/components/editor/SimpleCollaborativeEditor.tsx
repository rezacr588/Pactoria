'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo, 
  Redo,
  Save,
  Wifi
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { defaultContractTemplate } from '@/lib/templates/legal-templates'

interface SimpleCollaborativeEditorProps {
  contractId: string
  initialContent?: any
  onSave?: (content: any) => Promise<void>
  className?: string
  readOnly?: boolean
}

export default function SimpleCollaborativeEditor({
  contractId,
  initialContent,
  onSave,
  className,
  readOnly = false
}: SimpleCollaborativeEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Use contractId for logging or other purposes
  console.log('Editor initialized for contract:', contractId)

  // Initialize editor with StarterKit only (no collaboration for now)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // history is enabled by default in StarterKit
      }),
    ],
    content: initialContent || defaultContractTemplate,
    editable: !readOnly,
    onUpdate: () => {
      setHasUnsavedChanges(true)
    },
  })

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
      // Show error toast or notification here
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !onSave) return

    const autoSaveTimer = setTimeout(() => {
      handleSave()
    }, 10000) // Auto-save after 10 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, handleSave, onSave])

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  if (!editor) {
    return (
      <div className={cn('flex items-center justify-center h-64 border rounded-lg', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg bg-white', className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b p-2 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* Format buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('bold') && 'bg-muted'
              )}
            >
              <Bold className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('italic') && 'bg-muted'
              )}
            >
              <Italic className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('bulletList') && 'bg-muted'
              )}
            >
              <List className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('orderedList') && 'bg-muted'
              )}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('blockquote') && 'bg-muted'
              )}
            >
              <Quote className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('codeBlock') && 'bg-muted'
              )}
            >
              <Code className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Connection status - simplified */}
            <div className="flex items-center space-x-1">
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>

            {/* Save button */}
            {onSave && (
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                size="sm"
                variant={hasUnsavedChanges ? 'default' : 'outline'}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 prose prose-sm max-w-none focus-within:outline-none"
        />

        {/* Bubble menu for text selection */}
        {editor && !readOnly && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-black text-white px-2 py-1 rounded-lg flex items-center space-x-1"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                'h-8 w-8 p-0 text-white hover:bg-gray-700',
                editor.isActive('bold') && 'bg-gray-600'
              )}
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                'h-8 w-8 p-0 text-white hover:bg-gray-700',
                editor.isActive('italic') && 'bg-gray-600'
              )}
            >
              <Italic className="h-3 w-3" />
            </Button>
          </BubbleMenu>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-gray-50">
        {readOnly ? (
          'Read-only mode'
        ) : (
          <div className="flex justify-between">
            <span>
              {editor.storage.characterCount?.characters() || editor.state.doc.textContent.length} characters, {' '}
              {editor.storage.characterCount?.words() || editor.state.doc.textContent.split(/\s+/).filter(Boolean).length} words
            </span>
            <span>
              {hasUnsavedChanges ? 'Unsaved changes' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'All changes saved'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}