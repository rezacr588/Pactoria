'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Star, Eye, Users, Clock, Tag, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface Template {
  id: string
  title: string
  description?: string
  category: string
  content_md?: string
  content_json?: any
  variables?: any[]
  rating?: number
  usage_count?: number
  reviews_count?: number
  is_featured?: boolean
  tier_required?: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
  tags?: string[]
}

const categories = {
  nda: 'Non-Disclosure',
  service: 'Service Agreement',
  employment: 'Employment',
  sales: 'Sales',
  partnership: 'Partnership',
  licensing: 'Licensing',
  other: 'Other',
}

export default function TemplateDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [using, setUsing] = useState(false)

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId])

  const fetchTemplate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch template')
      }
      
      setTemplate(result.template)
    } catch (error) {
      console.error('Error fetching template:', error)
      toast.error('Failed to load template')
      router.push('/templates')
    } finally {
      setLoading(false)
    }
  }

  const useTemplate = async () => {
    if (!user) {
      toast.error('Please sign in to use templates')
      router.push('/login')
      return
    }

    if (!template) return

    setUsing(true)
    try {
      // Create new contract from template
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          title: `${template.title} - Copy`,
          owner_id: user.id,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      // Copy template content to contract if available
      if (template.content_md || template.content_json) {
        try {
          await supabase.rpc('take_snapshot', {
            p_contract_id: contract.id,
            p_content_json: template.content_json || null,
            p_content_md: template.content_md || null,
            p_ydoc_state_base64: null
          })
        } catch (snapshotError) {
          console.warn('take_snapshot RPC failed, creating version directly:', snapshotError)
          
          // Fallback: create version directly
          await supabase
            .from('contract_versions')
            .insert({
              contract_id: contract.id,
              version_number: 1,
              content_md: template.content_md || `# ${template.title}\n\nTemplate content will be loaded here.`,
              content_json: template.content_json,
              created_by: user.id
            })
        }
      }

      toast.success('Contract created from template')
      router.push(`/contracts/${contract.id}`)
    } catch (error) {
      console.error('Error using template:', error)
      toast.error('Failed to use template')
    } finally {
      setUsing(false)
    }
  }

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-10 w-full mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Template not found</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/templates')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/templates')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to templates</span>
          </Button>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {template.is_featured && (
                <Badge variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline">
                {categories[template.category as keyof typeof categories] || template.category}
              </Badge>
            </div>
            
            <h1 className="text-3xl font-bold">{template.title}</h1>
            
            {template.description && (
              <p className="text-lg text-muted-foreground">{template.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {renderStars(template.rating || 0)}
                <span className="ml-1">({(template.rating || 0).toFixed(1)})</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{template.usage_count || 0} uses</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{template.reviews_count || 0} reviews</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template content preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Template Preview
                </CardTitle>
                <CardDescription>
                  Preview of the template content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {template.content_md ? (
                  <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm">
                      {template.content_md.length > 1000 
                        ? `${template.content_md.substring(0, 1000)}...` 
                        : template.content_md
                      }
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p>No content preview available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variables */}
            {template.variables && template.variables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Template Variables
                  </CardTitle>
                  <CardDescription>
                    Customizable fields in this template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {template.variables.map((variable: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="font-medium">{variable.name || `Variable ${index + 1}`}</span>
                        <Badge variant="outline">{variable.type || 'text'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action card */}
            <Card>
              <CardContent className="p-6">
                <Button 
                  onClick={useTemplate}
                  disabled={using}
                  className="w-full mb-4"
                  size="lg"
                >
                  {using ? 'Creating Contract...' : 'Use This Template'}
                </Button>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span>{categories[template.category as keyof typeof categories] || template.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage Count</span>
                    <span>{template.usage_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <span>{(template.rating || 0).toFixed(1)}/5</span>
                  </div>
                  {template.tier_required && template.tier_required !== 'free' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tier Required</span>
                      <Badge variant="outline">{template.tier_required}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}