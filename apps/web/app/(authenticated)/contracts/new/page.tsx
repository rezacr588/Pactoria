'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import contractsService from '@/lib/services/contracts'
import apiClient from '@/lib/api-client'
import { useTemplates } from '@/hooks/useTemplates'
import { 
  ArrowLeft,
  FileText,
  Sparkles,
  Save,
  Eye,
  Wand2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

// Template categories aligned with database schema
const templateCategories = [
  { value: 'nda', label: 'Non-Disclosure Agreement' },
  { value: 'service', label: 'Service Agreement' },
  { value: 'employment', label: 'Employment Contract' },
  { value: 'sales', label: 'Sales Agreement' },
  { value: 'partnership', label: 'Partnership Agreement' },
  { value: 'licensing', label: 'Licensing Agreement' },
  { value: 'other', label: 'Other/Custom' }
]

export default function NewContract() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: templatesData, isLoading: templatesLoading } = useTemplates()
  const templates = templatesData?.templates || []
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  
  // Load template content when a template is selected
  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== 'none' && templates) {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (template) {
        setContent(template.content_md || '')
        setTitle(`${template.title} - Copy`)
        setDescription(template.description || '')
        setActiveTab('manual')
      }
    }
  }, [selectedTemplateId, templates])

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description for the AI to generate')
      return
    }

    try {
      setGenerating(true)
      const generateRequest: any = { prompt: aiPrompt };
      if (selectedTemplateId && selectedTemplateId !== 'none') {
        generateRequest.templateId = selectedTemplateId;
      }
      const result = await apiClient.generateTemplate(generateRequest)
      
      setGeneratedContent(result.result)
      setContent(result.result)
      toast.success('Contract generated successfully!')
      
      // Switch to manual tab to show the generated content
      setActiveTab('manual')
    } catch (error) {
      console.error('Error generating contract:', error)
      toast.error('Failed to generate contract')
    } finally {
      setGenerating(false)
    }
  }

  const handleStreamGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description for the AI to generate')
      return
    }

    try {
      setGenerating(true)
      setGeneratedContent('')
      
      const stream = await apiClient.streamGenerateTemplate(aiPrompt)
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      let fullContent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        fullContent += chunk
        setGeneratedContent(fullContent)
      }
      
      setContent(fullContent)
      toast.success('Contract generated successfully!')
      setActiveTab('manual')
    } catch (error) {
      console.error('Error streaming contract:', error)
      toast.error('Failed to generate contract')
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateContract = async () => {
    if (!title.trim()) {
      toast.error('Please enter a contract title')
      return
    }

    try {
      setLoading(true)
      const contract = await contractsService.createContract({
        title,
        description,
        content,
        status: 'draft'
      })
      
      toast.success('Contract created successfully!')
      router.push(`/contracts/${contract.id}`)
    } catch (error) {
      console.error('Error creating contract:', error)
      toast.error('Failed to create contract')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error('Please enter a contract title')
      return
    }

    try {
      setLoading(true)
      const contract = await contractsService.createContract({
        title,
        description,
        content,
        status: 'draft'
      })
      
      toast.success('Draft saved successfully!')
      router.push(`/contracts/${contract.id}`)
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">Create New Contract</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" disabled={loading}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button onClick={handleCreateContract} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Create Contract
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
                <CardDescription>
                  Fill in the contract information or use AI to generate content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Contract Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Service Agreement with TechCorp"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the contract"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Content Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                      <TabsTrigger value="ai">AI Generate</TabsTrigger>
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4">
                      <div>
                        <Label htmlFor="content">Contract Content</Label>
                        <Textarea
                          id="content"
                          placeholder="Enter your contract content here..."
                          rows={20}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="space-y-4">
                      <div>
                        <Label htmlFor="category">Category (Optional)</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {templateCategories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="template">Template (Optional)</Label>
                        <Select 
                          value={selectedTemplateId} 
                          onValueChange={setSelectedTemplateId}
                          disabled={templatesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {templates
                              ?.filter(t => !selectedCategory || t.category === selectedCategory)
                              ?.filter(t => t.is_public)
                              ?.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{template.title}</span>
                                    <div className="flex items-center space-x-1">
                                      {template.is_featured && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                          Featured
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500">
                                        {template.usage_count || 0} uses
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="prompt">Describe Your Contract</Label>
                        <Textarea
                          id="prompt"
                          placeholder="Describe what you need in the contract. Be specific about parties, terms, conditions, etc."
                          rows={6}
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-3">
                        <Button 
                          onClick={handleGenerateWithAI}
                          disabled={generating}
                          className="flex-1"
                        >
                          {generating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Generate with AI
                        </Button>
                        <Button 
                          onClick={handleStreamGenerate}
                          disabled={generating}
                          variant="outline"
                          className="flex-1"
                        >
                          {generating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4 mr-2" />
                          )}
                          Stream Generate
                        </Button>
                      </div>
                      {generatedContent && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>Content Generated!</AlertTitle>
                          <AlertDescription>
                            The AI has generated contract content. Switch to the Manual Entry tab to review and edit.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Coming Soon</AlertTitle>
                        <AlertDescription>
                          File upload functionality is currently under development. Please use manual entry or AI generation for now.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-indigo-600" />
                  AI Assistant Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Be specific about party names and roles</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Include key terms like payment, duration, and deliverables</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Mention jurisdiction and governing law</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Specify any special clauses or conditions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Templates Card */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Templates</CardTitle>
                <CardDescription>
                  Quick start with pre-built templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templatesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : templates && templates.length > 0 ? (
                    templates
                      .filter(t => t.is_featured)
                      .slice(0, 5)
                      .map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedTemplateId(template.id)
                            setActiveTab('manual')
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {template.title}
                        </Button>
                      ))
                  ) : (
                    templateCategories.slice(0, 5).map((cat) => (
                      <Button
                        key={cat.value}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCategory(cat.value)
                          setActiveTab('ai')
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {cat.label}
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Need Help?</AlertTitle>
              <AlertDescription>
                Check our <a href="#" className="underline">documentation</a> or contact support for assistance with contract creation.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
