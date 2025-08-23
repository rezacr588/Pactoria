import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { Template } from '@/types'

export interface TemplateWithVariables extends Omit<Template, 'variables'> {
  variables?: Array<{
    name: string
    type: string
    label: string
    default?: any
    options?: string[]
    required?: boolean
  }>
}

export function useTemplates(params?: {
  category?: string
  featured?: boolean
  limit?: number
}) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: async () => {
      const response = await apiClient.getTemplates(params)
      return {
        templates: response.templates as TemplateWithVariables[],
        categories: response.categories
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      const response = await apiClient.getTemplate(id)
      return response.template as TemplateWithVariables
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useFeaturedTemplates(limit: number = 6) {
  return useQuery({
    queryKey: ['templates', 'featured', limit],
    queryFn: async () => {
      const response = await apiClient.getTemplates({ featured: true, limit })
      return response.templates as TemplateWithVariables[]
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

export function useTemplateCategories() {
  return useQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const response = await apiClient.getTemplates({ limit: 1 })
      return response.categories
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}