'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { useAuth } from '@/contexts/AuthContext'
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
  Users,
  Wifi,
  WifiOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollaborativeEditorProps {
  contractId: string
  initialContent?: any
  onSave?: (content: any) => Promise<void>
  className?: string
  readOnly?: boolean
}

interface User {
  id: string
  name: string
  color: string
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
]

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)] || '#4D96FF'
}

export default function CollaborativeEditor({
  contractId,
  initialContent,
  onSave,
  className,
  readOnly = false
}: CollaborativeEditorProps) {
  const { user } = useAuth()
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebrtcProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize collaboration
  useEffect(() => {
    if (!user || !contractId) return

    const roomName = `contract:${contractId}`
    const webrtcProvider = new WebrtcProvider(roomName, ydoc, {
      signaling: ['wss://signaling.yjs.dev']
    })

    setProvider(webrtcProvider)

    // Connection status

    webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
      setIsConnected(connected)
    })

    webrtcProvider.on('peers', () => {
      // Update connected users based on awareness
      const awarenessUsers: User[] = Array.from(webrtcProvider.awareness.getStates().values())
        .filter((state: any) => state.user)
        .map((state: any) => state.user)
      
      setConnectedUsers(awarenessUsers)
    })

    return () => {
      webrtcProvider.destroy()
    }
  }, [user, contractId, ydoc])

  // Set user awareness
  useEffect(() => {
    if (!provider || !user) return

    provider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.email?.split('@')[0] || 'Anonymous',
      color: getRandomColor()
    })

    return () => {
      provider.awareness.setLocalState(null)
    }
  }, [provider, user])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Important: disable history since Yjs provides it
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure(
        user ? {
          provider,
          user: {
            name: user.email?.split('@')[0] || 'Anonymous',
            color: getRandomColor()
          },
        } : {
          provider,
        }
      ),
    ],
    content: initialContent,
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
    } catch (error) {
      console.error('Failed to save:', error)
      // You could show a toast error here
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !onSave) return

    const autoSaveTimer = setTimeout(() => {
      handleSave()
    }, 30000) // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, handleSave, onSave])

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
            {/* Connection status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Connected users */}
            {connectedUsers.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <div className="flex -space-x-1">
                  {connectedUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: user.color }}
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {connectedUsers.length > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-medium text-white">
                      +{connectedUsers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

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
              {editor.storage.characterCount?.characters() || 0} characters, {' '}
              {editor.storage.characterCount?.words() || 0} words
            </span>
            <span>
              {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}