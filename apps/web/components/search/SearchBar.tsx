'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, Filter, FileText, Calendar, User, Tag, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'

interface SearchResult {
  id: string
  title: string
  type: 'contract' | 'template'
  status?: string
  created_at: string
  updated_at: string
  owner?: {
    id: string
    email: string
    name?: string
  }
  snippet?: string
  score?: number
}

interface SearchFilters {
  type: 'all' | 'contract' | 'template'
  status?: string
  dateRange?: {
    from: Date
    to: Date
  }
  owner?: string
}

interface SearchBarProps {
  className?: string
  onResultSelect?: (result: SearchResult) => void
  placeholder?: string
  showFilters?: boolean
  embedded?: boolean
}

export default function SearchBar({
  className,
  onResultSelect,
  placeholder = 'Search contracts, templates...',
  showFilters = true,
  embedded = false
}: SearchBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({ type: 'all' })
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([])
        return
      }

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
              created_at,
              updated_at,
              owner:owner_id (
                email,
                raw_user_meta_data->name
              )
            `)
            .ilike('title', `%${searchQuery}%`)
            .limit(5)

          if (filters.status) {
            contractQuery = contractQuery.eq('status', filters.status)
          }

          const { data: contracts } = await contractQuery

          if (contracts) {
            searchResults.push(
              ...contracts.map(c => ({
                ...c,
                type: 'contract' as const,
                snippet: `Status: ${c.status}`,
                owner: (c as any).owner?.[0] || undefined,
              }))
            )
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
              created_at,
              updated_at,
              owner:created_by (
                email,
                raw_user_meta_data->name
              )
            `)
            .eq('is_public', true)
            .ilike('title', `%${searchQuery}%`)
            .limit(5)

          const { data: templates } = await templateQuery

          if (templates) {
            searchResults.push(
              ...templates.map(t => ({
                ...t,
                type: 'template' as const,
                snippet: t.description || `Category: ${t.category}`,
                owner: (t as any).owner?.[0] || undefined,
              }))
            )
          }
        }

        // Sort by relevance (simple scoring based on title match)
        searchResults.sort((a, b) => {
          const aScore = a.title.toLowerCase().indexOf(searchQuery.toLowerCase())
          const bScore = b.title.toLowerCase().indexOf(searchQuery.toLowerCase())
          return aScore - bScore
        })

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    [filters]
  )

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result)
    } else {
      if (result.type === 'contract') {
        router.push(`/contracts/${result.id}`)
      } else {
        router.push(`/templates/${result.id}`)
      }
    }
    setOpen(false)
    setQuery('')
  }


  if (embedded) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {query && results.length > 0 && (
          <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-2 shadow-lg z-50">
            {results.map((result) => (
              <button
                key={result.id}
                className="flex w-full items-center justify-between rounded-sm px-2 py-2 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(result)}
              >
                <div className="flex items-center gap-2">
                  {result.type === 'contract' ? (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">{result.title}</p>
                    <p className="text-xs text-muted-foreground">{result.snippet}</p>
                  </div>
                </div>
                {result.status && (
                  <Badge variant="outline" className="ml-2">
                    {result.status}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative w-full justify-start text-sm text-muted-foreground",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        {placeholder}
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!loading && query && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!loading && !query && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Type to search contracts and templates
                </p>
              </div>
            </CommandEmpty>
          )}

          {results.length > 0 && (
            <>
              {/* Group by type */}
              {['contract', 'template'].map((type) => {
                const typeResults = results.filter(r => r.type === type)
                if (typeResults.length === 0) return null

                return (
                  <CommandGroup key={type} heading={type === 'contract' ? 'Contracts' : 'Templates'}>
                    {typeResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {result.type === 'contract' ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Tag className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{result.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {result.snippet && <span>{result.snippet}</span>}
                              {result.owner && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {result.owner.name || result.owner.email.split('@')[0]}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(result.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.status && (
                            <Badge variant="outline">
                              {result.status}
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </>
          )}

          {showFilters && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                <CommandItem onSelect={() => setShowFilterDialog(true)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filter results
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="mt-2 flex gap-2">
                <Button
                  variant={filters.type === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, type: 'all' })}
                >
                  All
                </Button>
                <Button
                  variant={filters.type === 'contract' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, type: 'contract' })}
                >
                  Contracts
                </Button>
                <Button
                  variant={filters.type === 'template' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, type: 'template' })}
                >
                  Templates
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['draft', 'in_review', 'approved', 'rejected', 'signed'].map((status) => (
                  <Button
                    key={status}
                    variant={filters.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newStatus = filters.status === status ? undefined : status;
                      if (newStatus) {
                        setFilters({ ...filters, status: newStatus });
                      } else {
                        const { status: _, ...rest } = filters;
                        setFilters(rest);
                      }
                    }}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ type: 'all' })
                  setShowFilterDialog(false)
                }}
              >
                Reset
              </Button>
              <Button onClick={() => setShowFilterDialog(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
