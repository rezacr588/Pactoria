'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { Contract, ContractWithRelations } from '@/types'
import { Plus, FileText, Clock, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react'

export function ContractsList() {
  const [newTitle, setNewTitle] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => apiClient.getContracts(),
  })

  const createMutation = useMutation({
    mutationFn: (title: string) => apiClient.createContract({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setNewTitle('')
      setShowCreateForm(false)
    },
    onError: (error) => {
      console.error('Failed to create contract:', error)
      // You could add toast notification here
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
    onError: (error) => {
      console.error('Failed to delete contract:', error)
      // You could add toast notification here
    },
  })

  // Memoized status configurations for better performance
  const statusConfig = useMemo(() => ({
    draft: { 
      icon: <Edit2 className="h-4 w-4 text-gray-500" />, 
      badge: 'bg-gray-100 text-gray-800',
      label: 'Draft'
    },
    in_review: { 
      icon: <Clock className="h-4 w-4 text-yellow-500" />, 
      badge: 'bg-yellow-100 text-yellow-800',
      label: 'In Review'
    },
    approved: { 
      icon: <CheckCircle className="h-4 w-4 text-green-500" />, 
      badge: 'bg-green-100 text-green-800',
      label: 'Approved'
    },
    rejected: { 
      icon: <XCircle className="h-4 w-4 text-red-500" />, 
      badge: 'bg-red-100 text-red-800',
      label: 'Rejected'
    },
    signed: { 
      icon: <CheckCircle className="h-4 w-4 text-blue-500" />, 
      badge: 'bg-blue-100 text-blue-800',
      label: 'Signed'
    }
  }), [])

  const getStatusIcon = useCallback((status: Contract['status']) => {
    return statusConfig[status as keyof typeof statusConfig]?.icon || <FileText className="h-4 w-4 text-gray-400" />
  }, [statusConfig])

  const getStatusBadge = useCallback((status: Contract['status']) => {
    return statusConfig[status as keyof typeof statusConfig]?.badge || 'bg-gray-100 text-gray-800'
  }, [statusConfig])

  const getStatusLabel = useCallback((status: Contract['status']) => {
    return statusConfig[status as keyof typeof statusConfig]?.label || status.replace('_', ' ')
  }, [statusConfig])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load contracts</p>
      </div>
    )
  }

  const contracts: ContractWithRelations[] = data?.contracts || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Create new contract"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New Contract</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-gray-900">Create New Contract</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newTitle.trim()) {
                createMutation.mutate(newTitle.trim())
              }
            }}
            className="flex space-x-3"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contract title"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={createMutation.isPending}
              aria-label="Contract title"
              aria-describedby="title-help"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={createMutation.isPending || !newTitle.trim()}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-describedby="create-button-help"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setNewTitle('')
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Cancel contract creation"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {contracts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No contracts</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new contract.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Create your first contract"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Contract
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Updated
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                      aria-label={`View contract: ${contract.title}`}
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      <span>{contract.title}</span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                        contract.status
                      )}`}
                    >
                      {getStatusIcon(contract.status)}
                      <span>{getStatusLabel(contract.status)}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    v{contract.latest_version_number || 0}
                    {contract.contract_versions && contract.contract_versions.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({contract.contract_versions.length} versions)
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(contract.updated_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="text-primary-600 hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
                        aria-label={`Edit contract: ${contract.title}`}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${contract.title}"? This action cannot be undone.`)) {
                            deleteMutation.mutate(contract.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Delete contract: ${contract.title}`}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
