'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { useAuth } from '@/contexts/AuthContext'
import { ContractValidationExtension, useContractValidation } from '@/lib/contract-generation/editor-validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Lightbulb,
  Users,
  Shield,
  Zap,
  RefreshCw,
  Wand2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedLiveCollaborativeEditorProps {
  contractId: string
  initialContent?: string
  onSave?: (content: any) => Promise<void>
  className?: string
  readOnly?: boolean
  enableAIGeneration?: boolean
  enableRealTimeValidation?: boolean
}

interface ValidationPanelProps {
  validationResults: any
  onFixIssue: (issueType: string) => void
  onValidate: () => void
  isValidating: boolean
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationResults,
  onFixIssue,
  onValidate,
  isValidating
}) => {
  if (!validationResults) return null

  const { isValid, score, errors, warnings, suggestions } = validationResults

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <Card className={cn('w-full', getScoreBgColor(score))}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm">
            <Shield className="h-4 w-4 mr-2" />
            Contract Validation
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className={cn('text-sm font-bold', getScoreColor(score))}>
              {score}/100
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onValidate}
              disabled={isValidating}
            >
              {isValidating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <Progress value={score} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-700">Critical Issues</span>
            </div>
            {errors.map((error: string, index: number) => (
              <Alert key={index} className="border-red-200">
                <AlertDescription className="text-red-800 text-xs">
                  {error}
                  {error.includes('Missing document title') && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-2 text-red-600"
                      onClick={() => onFixIssue('add_title')}
                    >
                      Fix
                    </Button>
                  )}
                  {error.includes('Missing party') && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-2 text-red-600"
                      onClick={() => onFixIssue('add_parties')}
                    >
                      Fix
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-yellow-700">Warnings</span>
            </div>
            {warnings.map((warning: string, index: number) => (
              <Alert key={index} className="border-yellow-200">
                <AlertDescription className="text-yellow-800 text-xs">
                  {warning}
                  {warning.includes('effective date') && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-2 text-yellow-600"
                      onClick={() => onFixIssue('add_date')}
                    >
                      Add Date
                    </Button>
                  )}
                  {warning.includes('signature') && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto ml-2 text-yellow-600"
                      onClick={() => onFixIssue('add_signatures')}
                    >
                      Add Signatures
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-700">Suggestions</span>
            </div>
            {suggestions.map((suggestion: string, index: number) => (
              <div key={index} className="text-xs text-blue-600 pl-6">
                • {suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Validation Status Badge */}
        <div className="pt-2 border-t">
          <Badge variant={isValid ? "default" : "danger"} className="text-xs">
            {isValid ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Contract Valid
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Issues Found
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EnhancedLiveCollaborativeEditor({
  contractId,
  initialContent = '',
  onSave,
  className,
  readOnly = false,
  enableAIGeneration = true,
  enableRealTimeValidation = true
}: EnhancedLiveCollaborativeEditorProps) {
  const { user } = useAuth()
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebrtcProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Initialize collaboration
  useEffect(() => {
    if (!contractId || !user) return

    const webrtcProvider = new WebrtcProvider(
      `contract-${contractId}`,
      ydoc,
      {
        signaling: ['wss://signaling.yjs.dev'],
      }
    )

    // Set user awareness after provider creation
    webrtcProvider.awareness.setLocalStateField('user', {
      name: user.email?.split('@')[0] || 'Anonymous',
      email: user.email,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    })

    webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
      setIsConnected(connected)
    })

    webrtcProvider.awareness.on('change', () => {
      setActiveUsers(Array.from(webrtcProvider.awareness.getStates().values()))
    })

    setProvider(webrtcProvider)

    return () => {
      webrtcProvider.destroy()
    }
  }, [contractId, user, ydoc])

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: user ? {
          name: user.email?.split('@')[0] || 'Anonymous',
          email: user.email,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        } : {
          name: 'Anonymous',
          email: '',
          color: '#000000',
        },
      }),
      ContractValidationExtension.configure({
        enableRealTimeValidation,
        validationDelay: 1000,
        showInlineErrors: true,
        autoCorrectSuggestions: true
      })
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Auto-save functionality could go here
      if (onSave) {
        const content = editor.getJSON()
        // Debounced save
        setTimeout(() => onSave(content), 2000)
      }
    },
  })

  // Validation hook
  const { validationResults, isValidating, validateNow, fixIssue } = useContractValidation(editor)

  // AI Generation handler
  const handleAIGeneration = useCallback(async () => {
    if (!editor || !enableAIGeneration) return

    setIsGeneratingAI(true)
    try {
      // This would integrate with your AI service
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateTemplate',
          prompt: 'Generate a professional service agreement template'
        })
      })
      
      if (response.ok) {
        const { result } = await response.json()
        editor.commands.setContent(result)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }, [editor, enableAIGeneration])

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Initializing collaborative editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Editor Header with Collaboration Status */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {activeUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {activeUsers.length} online
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {enableAIGeneration && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIGeneration}
              disabled={isGeneratingAI}
            >
              {isGeneratingAI ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              AI Generate
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={validateNow}>
            <Shield className="h-4 w-4 mr-2" />
            Validate
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg">
            <EditorContent
              editor={editor}
              className="prose max-w-none p-4 min-h-[400px] focus-within:outline-none"
            />
          </div>
        </div>

        {/* Validation Panel */}
        <div className="space-y-4">
          <ValidationPanel
            validationResults={validationResults}
            onFixIssue={fixIssue}
            onValidate={validateNow}
            isValidating={isValidating}
          />
          
          {/* Active Users Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2" />
                Active Collaborators ({activeUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeUsers.map((user: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-xs text-gray-600">{user.name}</span>
                  </div>
                ))}
                {activeUsers.length === 0 && (
                  <p className="text-xs text-gray-400">No active users</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bubble Menu for Quick Actions */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center space-x-1 bg-white border rounded-lg shadow-lg p-1">
          <Button variant="ghost" size="sm" onClick={validateNow}>
            <Shield className="h-4 w-4" />
          </Button>
          {enableAIGeneration && (
            <Button variant="ghost" size="sm" onClick={handleAIGeneration}>
              <Zap className="h-4 w-4" />
            </Button>
          )}
        </div>
      </BubbleMenu>
    </div>
  )
}