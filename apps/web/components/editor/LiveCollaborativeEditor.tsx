'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  Wifi,
  WifiOff,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { defaultContractTemplate } from '@/lib/templates/legal-templates'

interface LiveCollaborativeEditorProps {
  contractId: string
  initialContent?: any
  onSave?: (content: any) => Promise<void>
  className?: string
  readOnly?: boolean
}

interface ConnectedUser {
  id: string
  name: string
  email: string
  color: string
  cursor?: { x: number; y: number }
  isTyping: boolean
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
]

function getUserColor(userId: string): string {
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return USER_COLORS[index % USER_COLORS.length] || '#4D96FF'
}

export default function LiveCollaborativeEditor({
  contractId,
  initialContent,
  onSave,
  className,
  readOnly = false
}: LiveCollaborativeEditorProps) {
  const { user } = useAuth()
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebrtcProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [comments] = useState<any[]>([])
  const [isCommentMode, setIsCommentMode] = useState(false)
  const providerRef = useRef<WebrtcProvider | null>(null)

  // Initialize collaboration
  useEffect(() => {
    if (!user || !contractId) return

    const initializeCollaboration = async () => {
      try {
        // Initialize Y.js document and WebRTC provider
        const roomName = `contract:${contractId}`
        const webrtcProvider = new WebrtcProvider(roomName, ydoc, {
          signaling: ['wss://signaling.yjs.dev'],
          // Add more signaling servers for reliability
          maxConns: 20,
          filterBcConns: true,
          password: contractId // Simple room password
        })

        providerRef.current = webrtcProvider
        setProvider(webrtcProvider)

        // Connection status handling
        webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
          setIsConnected(connected)
          console.log('WebRTC connection status:', connected)
        })

        // Handle user awareness updates
        webrtcProvider.on('peers', () => {
          updateConnectedUsers()
        })

        // Initialize Supabase Realtime for presence
        const presenceChannel = supabase.channel(`presence:contract:${contractId}`, {
          config: { presence: { key: user.id } }
        })

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            updateConnectedUsers()
          })
          .on('presence', { event: 'join' }, () => {
            updateConnectedUsers()
          })
          .on('presence', { event: 'leave' }, () => {
            updateConnectedUsers()
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await presenceChannel.track({
                user_id: user.id,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                email: user.email || '',
                color: getUserColor(user.id),
                online_at: new Date().toISOString(),
                contract_id: contractId,
                is_editing: true
              })
            }
          })

        return () => {
          presenceChannel.untrack()
          presenceChannel.unsubscribe()
        }

      } catch (error) {
        console.error('Failed to initialize collaboration:', error)
        setIsConnected(false)
        return undefined
      }
    }

    initializeCollaboration()

    return () => {
      if (providerRef.current) {
        providerRef.current.destroy()
      }
    }
  }, [user, contractId, ydoc])

  const updateConnectedUsers = useCallback(() => {
    if (!provider) return

    const awarenessUsers: ConnectedUser[] = Array.from(provider.awareness.getStates().values())
      .filter((state: any) => state.user && state.user.id !== user?.id)
      .map((state: any) => ({
        id: state.user.id,
        name: state.user.name,
        email: state.user.email,
        color: state.user.color,
        cursor: state.cursor,
        isTyping: state.isTyping || false
      }))
    
    setConnectedUsers(awarenessUsers)
  }, [provider, user?.id])

  // Initialize editor with collaboration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Disable history - Yjs handles it
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure(
        user ? {
          provider,
          user: {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
            color: getUserColor(user.id),
          },
        } : { provider }
      ),
    ],
    content: initialContent || defaultContractTemplate,
    editable: !readOnly,
    onUpdate: () => {
      setHasUnsavedChanges(true)
      // Update typing status in awareness
      if (provider) {
        provider.awareness.setLocalStateField('isTyping', true)
        setTimeout(() => {
          provider.awareness.setLocalStateField('isTyping', false)
        }, 1000)
      }
    },
  }, [ydoc, provider, user])

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
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !onSave) return

    const autoSaveTimer = setTimeout(() => {
      handleSave()
    }, 30000) // Auto-save after 30 seconds

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, handleSave, onSave])

  // Keyboard shortcuts
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
          <p className="text-sm text-muted-foreground">Initializing collaborative editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg bg-white', className)}>
      {/* Collaboration Status Bar */}
      <div className="border-b p-2 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Connecting...</span>
              </>
            )}
          </div>

          {/* Connected Users */}
          {connectedUsers.length > 0 && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-600" />
              <div className="flex -space-x-1">
                {connectedUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white relative"
                    style={{ backgroundColor: user.color }}
                    title={`${user.name} ${user.isTyping ? '(typing...)' : ''}`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                    {user.isTyping && (
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                ))}
                {connectedUsers.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-medium text-white">
                    +{connectedUsers.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-600 ml-2">
                {connectedUsers.length} collaborator{connectedUsers.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Comment Mode Toggle */}
          <Button
            variant={isCommentMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsCommentMode(!isCommentMode)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Comments
          </Button>

          {/* Save Status */}
          <div className="flex items-center space-x-1">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                <span className="text-xs text-gray-600">Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <AlertCircle className="h-3 w-3 text-yellow-600" />
                <span className="text-xs text-yellow-600">Unsaved</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">Saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Editor Toolbar */}
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

          {/* Save button */}
          {onSave && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              variant={hasUnsavedChanges ? 'default' : 'outline'}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
            </Button>
          )}
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex">
        {/* Editor Content */}
        <div className="flex-1 relative">
          <EditorContent
            editor={editor}
            className="min-h-[600px] max-h-[800px] overflow-y-auto p-6 prose prose-lg max-w-none focus-within:outline-none"
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
              {isCommentMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Handle adding comment
                    console.log('Add comment at selection')
                  }}
                  className="h-8 w-8 p-0 text-white hover:bg-gray-700"
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
              )}
            </BubbleMenu>
          )}
        </div>

        {/* Comments Sidebar */}
        {isCommentMode && (
          <div className="w-80 border-l bg-gray-50 p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments & Suggestions
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">No comments yet. Select text to add a comment.</p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment) => (
                  <Card key={comment.id} className="p-3">
                    <CardContent className="p-0">
                      <p className="text-sm">{comment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{comment.author}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-gray-50">
        {readOnly ? (
          'Read-only mode'
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span>
                {editor.storage.characterCount?.characters() || editor.state.doc.textContent.length} characters, {' '}
                {editor.storage.characterCount?.words() || editor.state.doc.textContent.split(/\s+/).filter(Boolean).length} words
              </span>
              {lastSaved && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isConnected && connectedUsers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Live collaboration active
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}