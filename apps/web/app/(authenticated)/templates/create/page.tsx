'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AITemplateGenerator from '@/components/ai/AITemplateGenerator'
import { toast } from 'sonner'

export default function CreateTemplatePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('ai-generate')

  const handleTemplateGenerated = (_template: { title: string; content: string; variables: any[] }) => {
    toast.success('Template generated! Review and save when ready.')
  }

  const handleTemplateSaved = (_templateId: string) => {
    toast.success('Template saved successfully!')
    router.push('/templates')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Create New Template</h1>
          <p className="text-muted-foreground mt-2">
            Use AI to generate professional contract templates or create from scratch
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="ai-generate">AI Generator</TabsTrigger>
          <TabsTrigger value="manual">Manual Creation</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-generate">
          <AITemplateGenerator 
            onGenerated={handleTemplateGenerated}
            onSaved={handleTemplateSaved}
          />
        </TabsContent>

        <TabsContent value="manual">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Manual template creation coming soon. Use AI Generator for now.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}