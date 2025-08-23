'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, FileText, Tag, ChevronDown, LayoutGrid, List } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  type: 'contract' | 'template'
  status?: string
  category?: string
  description?: string
  created_at: string
  updated_at: string
  owner?: {
    id: string
    email: string
    name?: string
  }
  collaborators?: Array<{
    id: string
    email: string
    name?: string
  }>
  tags?: string[]
  usage_count?: number
  average_rating?: number
}

interface SearchFilters {
  query: string
  type: 'all' | 'contract' | 'template'
  status?: string[]
  category?: string[]
  dateRange?: {
    from: Date | null
    to: Date | null
  }
  owner?: string
  sortBy: 'relevance' | 'date_newest' | 'date_oldest' | 'title' | 'popularity'
}

export default function SearchPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    sortBy: 'relevance'
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const resultsPerPage = 20

  // Perform search
  const performSearch = async () => {
    setLoading(true)
    try {
      const searchResults: SearchResult[] = []

      // Search contracts
      if (filters.type === 'all' || filters.type === 'contract') {
        let contractQuery = supabase
          .from('contracts')
          .select(`
            id,
            title,
            status,
            description,
            created_at,
            updated_at,
            owner:owner_id (
              id,
              email,
              raw_user_meta_data->name
            ),
            collaborators:contract_collaborators (
              user:user_id (
                id,
                email,
                raw_user_meta_data->name
              )
            )
          `, { count: 'exact' })

        if (filters.query) {
          contractQuery = contractQuery.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
        }

        if (filters.status && filters.status.length > 0) {
          contractQuery = contractQuery.in('status', filters.status)
        }

        if (filters.dateRange?.from) {
          contractQuery = contractQuery.gte('created_at', filters.dateRange.from.toISOString())
        }

        if (filters.dateRange?.to) {
          contractQuery = contractQuery.lte('created_at', filters.dateRange.to.toISOString())
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'date_newest':
            contractQuery = contractQuery.order('created_at', { ascending: false })
            break
          case 'date_oldest':
            contractQuery = contractQuery.order('created_at', { ascending: true })
            break
          case 'title':
            contractQuery = contractQuery.order('title', { ascending: true })
            break
          default:
            contractQuery = contractQuery.order('updated_at', { ascending: false })
        }

        contractQuery = contractQuery
          .range((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage - 1)

        const { data: contracts, count } = await contractQuery

        if (contracts) {
          searchResults.push(
            ...contracts.map(c => ({
              ...c,
              type: 'contract' as const,
              collaborators: c.collaborators?.map((collab: any) => collab.user).filter(Boolean) || []
            }))
          )
          if (count) setTotalResults(prev => prev + count)
        }
      }

      // Search templates
      if (filters.type === 'all' || filters.type === 'template') {
        let templateQuery = supabase
          .from('templates')
          .select(`
            id,
            title,
            description,
            category,
            tags,
            usage_count,
            average_rating,
            created_at,
            updated_at,
            owner:created_by (
              id,
              email,
              raw_user_meta_data->name
            )
          `, { count: 'exact' })
          .eq('is_public', true)

        if (filters.query) {
          templateQuery = templateQuery.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
        }

        if (filters.category && filters.category.length > 0) {
          templateQuery = templateQuery.in('category', filters.category)
        }

        if (filters.dateRange?.from) {
          templateQuery = templateQuery.gte('created_at', filters.dateRange.from.toISOString())
        }

        if (filters.dateRange?.to) {
          templateQuery = templateQuery.lte('created_at', filters.dateRange.to.toISOString())
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'date_newest':
            templateQuery = templateQuery.order('created_at', { ascending: false })
            break
          case 'date_oldest':
            templateQuery = templateQuery.order('created_at', { ascending: true })
            break
          case 'title':
            templateQuery = templateQuery.order('title', { ascending: true })
            break
          case 'popularity':
            templateQuery = templateQuery.order('usage_count', { ascending: false })
            break
          default:
            templateQuery = templateQuery.order('updated_at', { ascending: false })
        }

        templateQuery = templateQuery
          .range((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage - 1)

        const { data: templates, count } = await templateQuery

        if (templates) {
          searchResults.push(
            ...templates.map(t => ({
              ...t,
              type: 'template' as const
            }))
          )
          if (count) setTotalResults(prev => prev + count)
        }
      }

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setTotalResults(0)
    performSearch()
  }, [filters, currentPage])

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'contract') {
      router.push(`/contracts/${result.id}`)
    } else {
      router.push(`/templates/${result.id}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'signed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Find contracts and templates across your workspace
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          embedded
          showFilters={false}
          placeholder="Search by title, description, or content..."
          className="max-w-2xl"
          onResultSelect={handleResultClick}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Tabs value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value as any })}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="contract">Contracts</TabsTrigger>
            <TabsTrigger value="template">Templates</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="date_newest">Newest First</SelectItem>
            <SelectItem value="date_oldest">Oldest First</SelectItem>
            <SelectItem value="title">Title (A-Z)</SelectItem>
            <SelectItem value="popularity">Most Popular</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {['draft', 'in_review', 'approved', 'rejected', 'signed'].map((status) => (
              <DropdownMenuItem
                key={status}
                onSelect={() => {
                  const currentStatuses = filters.status || []
                  if (currentStatuses.includes(status)) {
                    setFilters({
                      ...filters,
                      status: currentStatuses.filter(s => s !== status)
                    })
                  } else {
                    setFilters({
                      ...filters,
                      status: [...currentStatuses, status]
                    })
                  }
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  {filters.status?.includes(status) && (
                    <Badge variant="secondary" className="ml-2">✓</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-accent' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.status && filters.status.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.status.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setFilters({
                ...filters,
                status: filters.status?.filter(s => s !== status)
              })}
            >
              {status.replace('_', ' ')}
              <span className="ml-1">×</span>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ ...filters, status: undefined })}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Search className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Searching...</p>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {totalResults} results
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleResultClick(result)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {result.type === 'contract' ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Tag className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge variant="outline">
                            {result.type}
                          </Badge>
                          {result.status && (
                            <Badge className={getStatusColor(result.status)}>
                              {result.status.replace('_', ' ')}
                            </Badge>
                          )}
                          {result.category && (
                            <Badge variant="secondary">
                              {result.category}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{result.title}</CardTitle>
                        {result.description && (
                          <CardDescription className="mt-2 line-clamp-2">
                            {result.description}
                          </CardDescription>
                        )}
                      </div>
                      {result.average_rating && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium">{result.average_rating.toFixed(1)}</span>
                          </div>
                          {result.usage_count && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {result.usage_count} uses
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {result.owner && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{result.owner.name || result.owner.email.split('@')[0]}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {format(new Date(result.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                      {result.collaborators && result.collaborators.length > 0 && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>+{result.collaborators.length} collaborators</span>
                        </div>
                      )}
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {result.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleResultClick(result)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {result.type === 'contract' ? (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Tag className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{result.title}</CardTitle>
                    {result.description && (
                      <CardDescription className="line-clamp-2">
                        {result.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.status && (
                        <Badge className={cn('w-fit', getStatusColor(result.status))}>
                          {result.status.replace('_', ' ')}
                        </Badge>
                      )}
                      {result.category && (
                        <Badge variant="secondary" className="w-fit">
                          {result.category}
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground pt-2">
                        {format(new Date(result.updated_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalResults > resultsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(totalResults / resultsPerPage)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
