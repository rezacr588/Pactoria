'use client'

import React, { useState } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  FileText,
  Library,
  GitCompare,
  MessageSquare,
  Variable,
  CheckCircle,
  XCircle,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  Scale,
  Shield,
  FileSignature,
  BookOpen,
  Gavel,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractToolbarProps {
  editor: Editor | null
  onClauseLibraryOpen?: () => void
  onVersionCompare?: () => void
  className?: string
}

export default function ContractToolbar({
  editor,
  onClauseLibraryOpen,
  onVersionCompare,
  className,
}: ContractToolbarProps) {
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showVariableDialog, setShowVariableDialog] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [variableName, setVariableName] = useState('')
  const [variableType, setVariableType] = useState('text')

  if (!editor) {
    return null
  }

  const addComment = () => {
    if (commentText && editor) {
      // TODO: Implement addCommentThread extension
      console.log('Adding comment:', commentText)
      setCommentText('')
      setShowCommentDialog(false)
    }
  }

  const insertVariable = () => {
    if (variableName && editor) {
      // TODO: Implement insertVariable extension
      console.log('Inserting variable:', variableName, variableType)
      setVariableName('')
      setVariableType('text')
      setShowVariableDialog(false)
    }
  }

  const insertLegalSection = (sectionType: string) => {
    // TODO: Implement insertSection extension
    console.log('Inserting legal section:', sectionType)
  }

  return (
    <>
      <div className={cn('border-b bg-white', className)}>
        <div className="flex items-center justify-between px-4 py-2">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-muted')}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-muted')}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('TODO: Implement underline extension')}
              className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-muted')}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Lists */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-muted')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-muted')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Alignment */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('TODO: Implement text alignment extension - left')}
              className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-muted')}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('TODO: Implement text alignment extension - center')}
              className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-muted')}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('TODO: Implement text alignment extension - right')}
              className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-muted')}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('TODO: Implement text alignment extension - justify')}
              className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'justify' }) && 'bg-muted')}
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Contract-Specific Tools */}
          <div className="flex items-center space-x-2">
            {/* Legal Sections Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Insert Section
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Legal Sections</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => insertLegalSection('Preamble')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Preamble
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Recitals')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Recitals
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Definitions')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Definitions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Terms and Conditions')}>
                  <Scale className="h-4 w-4 mr-2" />
                  Terms & Conditions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Warranties and Representations')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Warranties
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Indemnification')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Indemnification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Confidentiality')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Confidentiality
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Termination')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Termination
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Dispute Resolution')}>
                  <Gavel className="h-4 w-4 mr-2" />
                  Dispute Resolution
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('General Provisions')}>
                  <FileText className="h-4 w-4 mr-2" />
                  General Provisions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertLegalSection('Signatures')}>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Signatures
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clause Library */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClauseLibraryOpen}
              title="Clause Library"
            >
              <Library className="h-4 w-4 mr-2" />
              Clauses
            </Button>

            {/* Variables */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowVariableDialog(true)}
              title="Insert Variable"
            >
              <Variable className="h-4 w-4 mr-2" />
              Variable
            </Button>

            {/* Track Changes */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Track Changes
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => console.log('TODO: Implement toggleRedline extension - addition')}
                >
                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                  Mark as Addition
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => console.log('TODO: Implement toggleRedline extension - deletion')}
                >
                  <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                  Mark as Deletion
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => console.log('TODO: Implement acceptRedline extension')}
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Accept Change
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => console.log('TODO: Implement rejectRedline extension')}
                >
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Reject Change
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Comments */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCommentDialog(true)}
              title="Add Comment"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment
            </Button>

            {/* Version Compare */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onVersionCompare}
              title="Compare Versions"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to the selected text for review or discussion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your comment..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addComment}>Add Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variable Dialog */}
      <Dialog open={showVariableDialog} onOpenChange={setShowVariableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Variable</DialogTitle>
            <DialogDescription>
              Insert a variable that can be populated automatically from your contract data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="variable-name">Variable Name</Label>
              <Input
                id="variable-name"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                placeholder="e.g., CLIENT_NAME, CONTRACT_DATE"
              />
            </div>
            <div>
              <Label htmlFor="variable-type">Variable Type</Label>
              <select
                id="variable-type"
                value={variableType}
                onChange={(e) => setVariableType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="text">Text</option>
                <option value="date">Date</option>
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="party">Party Name</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariableDialog(false)}>
              Cancel
            </Button>
            <Button onClick={insertVariable}>Insert Variable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}