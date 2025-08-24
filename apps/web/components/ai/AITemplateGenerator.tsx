'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Copy, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'

interface AITemplateGeneratorProps {
  onGenerated?: (template: { title: string; content: string; variables: any[] }) => void
  onSaved?: (templateId: string) => void
}

const categories = [
  { value: 'nda', label: 'Non-Disclosure Agreement' },
  { value: 'service', label: 'Service Agreement' },
  { value: 'employment', label: 'Employment Contract' },
  { value: 'sales', label: 'Sales Agreement' },
  { value: 'partnership', label: 'Partnership Agreement' },
  { value: 'licensing', label: 'Licensing Agreement' },
  { value: 'other', label: 'Other' },
]

export default function AITemplateGenerator({ onGenerated, onSaved }: AITemplateGeneratorProps) {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerateTemplate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for template generation')
      return
    }

    if (!user) {
      toast.error('Please sign in to generate templates')
      return
    }

    setIsGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('Please sign in to generate templates')
        return
      }

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'generateTemplate',
          prompt: prompt.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate template')
      }

      const { result } = await response.json()
      const content = result
      
      setGeneratedContent(content)
      
      // Auto-extract variables from the generated content
      const variables = extractVariables(content)
      
      // Auto-generate title if not provided
      if (!title) {
        setTitle(generateTitleFromPrompt(prompt))
      }
      
      onGenerated?.({
        title: title || generateTitleFromPrompt(prompt),
        content,
        variables
      })
      
      toast.success('Template generated successfully!')
    } catch (error) {
      console.error('Error generating template:', error)
      toast.error(`Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!generatedContent || !title || !category) {
      toast.error('Please fill in title, category, and generate content first')
      return
    }

    if (!user) {
      toast.error('Please sign in to save templates')
      return
    }

    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        toast.error('Please sign in to save templates')
        return
      }

      const variables = extractVariables(generatedContent)
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          content_md: generatedContent,
          tags,
          is_public: false,
          variables
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save template')
      }

      const { template } = await response.json()
      onSaved?.(template.id)
      toast.success('Template saved successfully!')
      
      // Reset form
      setPrompt('')
      setTitle('')
      setDescription('')
      setCategory('')
      setTags([])
      setGeneratedContent('')
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const extractVariables = (content: string): any[] => {
    // Extract variables in [VARIABLE_NAME] format
    const matches = content.match(/\[([A-Z_][A-Z0-9_]*)\]/g) || []
    const uniqueVars = [...new Set(matches)]
    
    return uniqueVars.map(match => {
      const name = match.slice(1, -1) // Remove brackets
      return {
        name,
        type: inferVariableType(name),
        label: formatVariableLabel(name),
        required: true
      }
    })
  }

  const inferVariableType = (name: string): string => {
    const lowercaseName = name.toLowerCase()
    if (lowercaseName.includes('date')) return 'date'
    if (lowercaseName.includes('amount') || lowercaseName.includes('price') || lowercaseName.includes('cost')) return 'number'
    if (lowercaseName.includes('description') || lowercaseName.includes('details')) return 'textarea'
    return 'text'
  }

  const formatVariableLabel = (name: string): string => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const generateTitleFromPrompt = (prompt: string): string => {
    const words = prompt.split(' ').slice(0, 6)
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const copyToClipboard = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent)
      toast.success('Content copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Template Generator
          </CardTitle>
          <CardDescription>
            Generate professional contract templates using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Template Title</label>
              <Input
                placeholder="e.g., Software Development Agreement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              placeholder="Brief description of the template"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">AI Generation Prompt</label>
            <Textarea
              placeholder="Describe the contract you want to generate. E.g., 'Create a software development contract for a freelancer working on a mobile app project with milestone payments'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleGenerateTemplate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Template
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveTemplate}
                  disabled={isSaving || !title || !category}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {generatedContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}