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
  description: string
  category: string
  tags: string[]
  is_featured: boolean
  usage_count: number
  rating: number
  price: number
  created_by: string
  created_at: string
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
      let query = supabase
        .from('templates')
        .select(`
          *,
          creator:created_by (
            email,
            raw_user_meta_data->name
          )
        `)

      if (activeTab === 'my-templates' && user) {
        query = query.eq('created_by', user.id)
      } else if (activeTab === 'saved' && user) {
        const { data: savedTemplates } = await supabase
          .from('user_templates')
          .select('template_id')
          .eq('user_id', user.id)

        const templateIds = savedTemplates?.map(st => st.template_id) || []
        query = query.in('id', templateIds)
      } else {
        query = query.eq('is_public', true)
      }

      const { data, error } = await query

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
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
        filtered.sort((a, b) => b.usage_count - a.usage_count)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
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
      // Increment usage count
      await supabase.rpc('increment_template_usage', { template_id: template.id })

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

      // Copy template content to contract
      if (template.content_json) {
        await supabase.rpc('take_snapshot', {
          p_contract_id: contract.id,
          p_content_json: template.content_json,
          p_content_md: template.content_md,
          p_ydoc_state_base64: null
        })
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

  const renderStars = (rating: number) => {
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
            <Badge variant="outline">{categories.find(c => c.value === template.category)?.label}</Badge>
            {template.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {renderStars(template.rating)}
              <span className="ml-1">({template.rating.toFixed(1)})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {template.usage_count}
              </span>
              {template.price > 0 && (
                <span className="font-semibold text-foreground">
                  ${template.price.toFixed(2)}
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
