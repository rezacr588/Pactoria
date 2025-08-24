'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import contractsService from '@/lib/services/contracts'
import apiClient from '@/lib/api-client'
import { useTemplates } from '@/hooks/useTemplates'
import LiveCollaborativeEditor from '@/components/editor/LiveCollaborativeEditor'
import PresenceAvatars from '@/components/editor/PresenceAvatars'
import { ShareContractDialog } from '@/components/contracts/ShareContractDialog'
import { 
  ArrowLeft,
  FileText,
  Sparkles,
  Save,
  Eye,
  Wand2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Share2,
  Users
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
  
  // Collaboration state
  const [contractId, setContractId] = useState<string | null>(null)
  const [activeCollaborators, setActiveCollaborators] = useState(0)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false)
  
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
      
      // If collaboration is enabled, the content will sync automatically
      if (isCollaborationEnabled && contractId) {
        toast.success('Generated content synced to collaborative editor!')
      }
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
      
      // If collaboration is enabled, the content will sync automatically
      if (isCollaborationEnabled && contractId) {
        toast.success('Generated content synced to collaborative editor!')
      }
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
    // Allow saving even without a title by providing a default
    try {
      setLoading(true)
      
      // Use default title if none provided
      const contractTitle = title.trim() || `Service Agreement - ${new Date().toLocaleDateString()}`
      
      const contract = await contractsService.createContract({
        title: contractTitle,
        description,
        content,
        status: 'draft'
      })
      
      // Update the title state with the final title
      setTitle(contractTitle)
      
      // Enable collaboration for the newly created draft
      setContractId(contract.id)
      setIsCollaborationEnabled(true)
      
      // If no content exists, set a default template for collaboration
      if (!content.trim()) {
        const defaultTemplate = `# Service Agreement

**Agreement Date:** [Date]  
**Parties:**
- **Client:** [Client Name]  
- **Service Provider:** [Your Company Name]

## 1. Services
The Service Provider agrees to provide the following services:
- [Describe the services to be provided]
- [Additional service details]

## 2. Timeline
- **Start Date:** [Start Date]
- **Completion Date:** [End Date]
- **Milestones:** [Key milestones and deliverables]

## 3. Payment Terms
- **Total Amount:** $[Amount]
- **Payment Schedule:** [Payment schedule details]
- **Late Payment:** [Late payment terms]

## 4. Responsibilities
**Client Responsibilities:**
- [List client responsibilities]

**Service Provider Responsibilities:**
- [List service provider responsibilities]

## 5. Termination
This agreement may be terminated by either party with [notice period] written notice.

## 6. Governing Law
This agreement shall be governed by the laws of [State/Country].

---
**Signatures**
- **Client:** _________________________ Date: _______
- **Service Provider:** _________________________ Date: _______`
        
        setContent(defaultTemplate)
      }
      
      toast.success('Draft saved successfully! Live collaboration is now enabled.')
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
              {/* Collaboration Features */}
              {isCollaborationEnabled && contractId && (
                <>
                  <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      {activeCollaborators} online
                    </span>
                  </div>
                  <PresenceAvatars
                    contractId={contractId}
                    maxVisible={3}
                    onActiveUsersChange={setActiveCollaborators}
                    className="flex items-center"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </>
              )}
              
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
                        {isCollaborationEnabled && contractId ? (
                          <div className="border rounded-lg">
                            <LiveCollaborativeEditor
                              contractId={contractId}
                              initialContent={content}
                              onSave={async (content: any) => {
                                // Handle content save - you can update the state here if needed
                                console.log('Content saved:', content)
                              }}
                              className="min-h-[400px]"
                            />
                          </div>
                        ) : (
                          <Textarea
                            id="content"
                            placeholder="Enter your contract content here... (Save as draft to enable live collaboration)"
                            rows={20}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="font-mono text-sm"
                          />
                        )}
                        {!isCollaborationEnabled && (
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Save as draft to enable live collaboration with others
                          </p>
                        )}
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
            {/* Collaboration Status Card */}
            {isCollaborationEnabled && contractId ? (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <Users className="h-5 w-5 mr-2" />
                    Live Collaboration
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Real-time editing is now active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Active users:</span>
                      <span className="font-medium text-green-800">{activeCollaborators}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Invite Collaborators
                    </Button>
                    <p className="text-xs text-green-600">
                      Changes are automatically synced across all users
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-amber-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Enable Collaboration
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Save as draft to start collaborating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-amber-700">
                      Once you save as draft, you can:
                    </p>
                    <ul className="text-xs text-amber-600 space-y-1">
                      <li>• See who's editing in real-time</li>
                      <li>• Share with collaborators</li>
                      <li>• Work together simultaneously</li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleSaveDraft}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft & Enable
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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

      {/* Share Dialog */}
      {contractId && (
        <ShareContractDialog
          contractId={contractId}
          contractTitle={title || 'New Contract'}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  )
}
