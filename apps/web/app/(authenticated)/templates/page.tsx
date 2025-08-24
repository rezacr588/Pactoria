'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Star, Download, Eye, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

interface Template {
  id: string
  title: string
  description?: string
  category: string
  tags?: string[]
  is_featured?: boolean
  usage_count?: number
  rating?: number
  reviews_count?: number
  price?: number
  created_by?: string
  created_at: string
  content_md?: string
  content_json?: any
  variables?: any[]
  creator?: {
    email: string
    name?: string
  }
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'nda', label: 'Non-Disclosure' },
  { value: 'service', label: 'Service Agreement' },
  { value: 'employment', label: 'Employment' },
  { value: 'sales', label: 'Sales' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'other', label: 'Other' },
]

export default function TemplatesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => {
    fetchTemplates()
  }, [activeTab])

  useEffect(() => {
    filterAndSortTemplates()
  }, [templates, searchQuery, selectedCategory, sortBy])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      if (activeTab === 'my-templates' && user) {
        // Fetch user's own templates
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setTemplates(data || [])
      } else if (activeTab === 'saved' && user) {
        // Fetch saved templates (simplified - just show public ones for now)
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('is_public', true)
          .eq('published', true)
          .limit(10)
          .order('usage_count', { ascending: false })
        
        if (error) throw error
        setTemplates(data || [])
      } else {
        // Fetch public templates using API
        try {
          const response = await fetch('/api/templates')
          const result = await response.json()
          setTemplates(result.templates || [])
        } catch (apiError) {
          // Fallback to direct Supabase query
          const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('is_public', true)
            .eq('published', true)
            .order('usage_count', { ascending: false })
            .limit(20)
          
          if (error) throw error
          setTemplates(data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
      setTemplates([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortTemplates = () => {
    let filtered = [...templates]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        template =>
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // Sort templates
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
    }

    setFilteredTemplates(filtered)
  }

  const useTemplate = async (template: Template) => {
    if (!user) {
      toast.error('Please sign in to use templates')
      router.push('/login')
      return
    }

    try {
      // Increment usage count if function exists
      try {
        await supabase.rpc('increment_template_usage', { template_id: template.id })
      } catch (rpcError) {
        // Function might not exist yet, just log and continue
        console.warn('increment_template_usage function not found:', rpcError)
        
        // Manual increment as fallback
        await supabase
          .from('templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', template.id)
      }

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
    }
  }

  const saveTemplate = async (template: Template) => {
    if (!user) {
      toast.error('Please sign in to save templates')
      router.push('/login')
      return
    }

    try {
      const { error } = await supabase
        .from('user_templates')
        .insert({
          user_id: user.id,
          template_id: template.id
        })

      if (error) {
        if (error.code === '23505') {
          toast.info('Template already saved')
        } else {
          throw error
        }
      } else {
        toast.success('Template saved to your collection')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
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

  const renderTemplateCard = (template: Template) => (
    <Card key={template.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <CardDescription className="mt-1">
              {template.description || 'No description available'}
            </CardDescription>
          </div>
          {template.is_featured && (
            <Badge variant="secondary" className="ml-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{categories.find(c => c.value === template.category)?.label || template.category}</Badge>
            {template.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {renderStars(template.rating || 0)}
              <span className="ml-1">({(template.rating || 0).toFixed(1)})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {template.usage_count || 0}
              </span>
              {(template.price || 0) > 0 && (
                <span className="font-semibold text-foreground">
                  ${(template.price || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {template.creator && (
            <p className="text-xs text-muted-foreground">
              By {template.creator.name || template.creator.email.split('@')[0]}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="flex-1"
          onClick={() => useTemplate(template)}
        >
          Use Template
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => saveTemplate(template)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Template Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Browse and use professional contract templates to get started quickly
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/templates/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Link>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          {user && (
            <>
              <TabsTrigger value="saved">Saved Templates</TabsTrigger>
              <TabsTrigger value="my-templates">My Templates</TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No templates found</p>
              {user && activeTab === 'my-templates' && (
                <Button asChild className="mt-4">
                  <Link href="/templates/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(renderTemplateCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
