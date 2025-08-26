'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Save,
  Wifi,
  WifiOff,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Library,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { defaultContractTemplate } from '@/lib/templates/legal-templates'

// Types
interface ContractEditorProps {
  contractId: string
  initialContent?: any
  onSave?: (content: any) => Promise<void>
  onContentChange?: (content: any) => void
  className?: string
  readOnly?: boolean
}

interface ConnectedUser {
  id: string
  name: string
  email: string
  color: string
  isTyping: boolean
}

interface Comment {
  id: string
  content: string
  author: string
  created_at: string
  is_resolved: boolean
  selection_start?: number
  selection_end?: number
}


interface Clause {
  id: string
  title: string
  category: string
  content: string
  description: string
  risk_level: 'low' | 'medium' | 'high'
}

// Utility functions
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
]

function getUserColor(userId: string): string {
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return USER_COLORS[index % USER_COLORS.length] || '#4D96FF'
}

// Main Component
export default function ContractEditor({
  contractId,
  initialContent,
  onSave,
  onContentChange,
  className,
  readOnly = false
}: ContractEditorProps) {
  // Core state
  const { user } = useAuth()
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebrtcProvider | null>(null)
  const providerRef = useRef<WebrtcProvider | null>(null)
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  
  // Editor state
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // UI state
  const [showComments, setShowComments] = useState(false)
  const [showClauseLibrary, setShowClauseLibrary] = useState(false)
  
  // Data state
  const [comments, setComments] = useState<Comment[]>([])
  const [clauses, setClauses] = useState<Clause[]>([])

  // Initialize collaboration
  useEffect(() => {
    if (!user || !contractId) return

    const initializeCollaboration = async () => {
      try {
        const roomName = `contract:${contractId}`
        const webrtcProvider = new WebrtcProvider(roomName, ydoc, {
          signaling: ['wss://signaling.yjs.dev'],
          maxConns: 20,
          filterBcConns: true,
          password: contractId
        })

        providerRef.current = webrtcProvider
        setProvider(webrtcProvider)

        webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
          setIsConnected(connected)
        })

        webrtcProvider.on('peers', () => {
          updateConnectedUsers()
        })

        // Initialize Supabase Realtime for presence
        const presenceChannel = supabase.channel(`presence:contract:${contractId}`, {
          config: { presence: { key: user.id } }
        })

        presenceChannel
          .on('presence', { event: 'sync' }, () => updateConnectedUsers())
          .on('presence', { event: 'join' }, () => updateConnectedUsers())
          .on('presence', { event: 'leave' }, () => updateConnectedUsers())
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
        return () => {} // Return empty cleanup function on error
      }
    }

    initializeCollaboration()

    return () => {
      if (providerRef.current) {
        providerRef.current.destroy()
      }
    }
  }, [user, contractId, ydoc])

  // Update connected users
  const updateConnectedUsers = useCallback(() => {
    if (!provider || !user) return

    const awarenessUsers: ConnectedUser[] = Array.from(provider.awareness.getStates().values())
      .filter((state: any) => state.user && state.user.id !== user.id)
      .map((state: any) => ({
        id: state.user.id,
        name: state.user.name,
        email: state.user.email,
        color: state.user.color,
        isTyping: state.isTyping || false
      }))
    
    setConnectedUsers(awarenessUsers)
  }, [provider, user])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commentsRes, clausesRes] = await Promise.all([
          fetch(`/api/contracts/${contractId}/comments`).catch(() => ({ ok: false })),
          fetch('/api/clauses?limit=20').catch(() => ({ ok: false }))
        ])
        
        if (commentsRes.ok && 'json' in commentsRes) {
          const data = await commentsRes.json()
          setComments(data.comments || [])
        }

        if (clausesRes.ok && 'json' in clausesRes) {
          const data = await clausesRes.json()
          setClauses(data.clauses || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    if (contractId) {
      fetchData()
    }
  }, [contractId])

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
      // Update typing status in awareness
      if (provider) {
        provider.awareness.setLocalStateField('isTyping', true)
        setTimeout(() => {
          provider.awareness.setLocalStateField('isTyping', false)
        }, 1000)
      }
    },
  }, [ydoc, provider, user])

  // Handlers
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

  const insertClause = useCallback((clause: Clause) => {
    if (editor) {
      editor.chain().focus().insertContent(clause.content).run()
      setShowClauseLibrary(false)
    }
  }, [editor])

  const insertSection = useCallback((sectionType: string) => {
    if (!editor) return
    
    const templates: Record<string, string> = {
      preamble: '<h2>Preamble</h2><p>This Agreement is entered into as of [DATE], by and between [PARTY_A] and [PARTY_B].</p>',
      definitions: '<h2>Definitions</h2><p><strong>"Agreement"</strong> means this contract agreement.</p>',
      terms: '<h2>Terms and Conditions</h2><ol><li>[Term 1]</li><li>[Term 2]</li></ol>',
    }
    
    const template = templates[sectionType] || '<h2>Section</h2><p>[Content]</p>'
    editor.chain().focus().insertContent(template).run()
  }, [editor])

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
          <p className="text-sm text-muted-foreground">Initializing contract editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full border rounded-lg bg-white', className)}>
      {/* Toolbar */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Formatting Tools */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-muted')}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-muted')}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-muted')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-muted')}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

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

          {/* Contract Tools */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertSection('preamble')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Sections
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClauseLibrary(true)}
            >
              <Library className="h-4 w-4 mr-2" />
              Clauses
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={cn(showComments && 'bg-muted')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments ({comments.filter(c => !c.is_resolved).length})
            </Button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-b px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={cn('flex items-center space-x-1', {
              'text-green-600': isConnected,
              'text-red-600': !isConnected
            })}>
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="text-xs font-medium">
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>

            {/* Connected Users */}
            {connectedUsers.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
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
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {connectedUsers.length} online
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Save Status */}
            <div className="flex items-center space-x-1 text-xs">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                  <span className="text-muted-foreground">Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <AlertCircle className="h-3 w-3 text-yellow-600" />
                  <span className="text-yellow-600">Unsaved changes</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Saved</span>
                  {lastSaved && (
                    <span className="text-muted-foreground ml-2">
                      {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </>
              )}
            </div>

            {onSave && (
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 relative">
          <EditorContent
            editor={editor}
            className="h-full prose prose-lg max-w-none p-6 focus-within:outline-none overflow-auto"
          />

          {/* Bubble Menu */}
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
                className={cn('h-8 w-8 p-0 text-white hover:bg-gray-700', editor.isActive('bold') && 'bg-gray-600')}
              >
                <Bold className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn('h-8 w-8 p-0 text-white hover:bg-gray-700', editor.isActive('italic') && 'bg-gray-600')}
              >
                <Italic className="h-3 w-3" />
              </Button>
            </BubbleMenu>
          )}
        </div>

        {/* Side Panel */}
        {(showComments || showClauseLibrary) && (
          <div className="w-80 border-l bg-gray-50 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {showComments && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Comments</h3>
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No comments yet. Select text and add a comment to get started.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <Card key={comment.id} className="p-3">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{comment.content}</p>
                          {!comment.is_resolved && (
                            <Button variant="outline" size="sm">
                              Resolve
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {showClauseLibrary && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Clause Library</h3>
                  {clauses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No clauses available.
                    </p>
                  ) : (
                    clauses.map((clause) => (
                      <Card key={clause.id} className="p-3 cursor-pointer hover:bg-gray-50" onClick={() => insertClause(clause)}>
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{clause.title}</h4>
                            <Badge variant={clause.risk_level === 'high' ? 'secondary' : 'secondary'} className="text-xs">
                              {clause.risk_level}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{clause.description}</p>
                          <Badge variant="outline" className="text-xs">{clause.category}</Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
