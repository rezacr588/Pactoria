'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { ContractEditor } from '@/components/editor/ContractEditor'
import { VersionTimeline } from '@/components/contracts/VersionTimeline'
import { ApprovalsPanel } from '@/components/contracts/ApprovalsPanel'
import { RiskAnalysisPanel } from '@/components/contracts/RiskAnalysisPanel'
import type { Contract, ContractVersion, ContractApproval } from '@/lib/types'
import { ArrowLeft, Save, Users, History, Shield, FileText } from 'lucide-react'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const contractId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'editor' | 'versions' | 'approvals' | 'risk'>('editor')
  const [editorContent, setEditorContent] = useState<any>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => apiClient.getContract(contractId),
  })

  const snapshotMutation = useMutation({
    mutationFn: (content: any) =>
      apiClient.createSnapshot(contractId, {
        content_json: content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (updates: { title?: string; status?: Contract['status'] }) =>
      apiClient.updateContract(contractId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load contract</p>
      </div>
    )
  }

  const { contract, versions, approvals } = data

  const handleSaveSnapshot = () => {
    if (editorContent) {
      snapshotMutation.mutate(editorContent)
    }
  }

  const tabs = [
    { id: 'editor', label: 'Editor', icon: FileText },
    { id: 'versions', label: 'Versions', icon: History, count: versions.length },
    { id: 'approvals', label: 'Approvals', icon: Users, count: approvals.length },
    { id: 'risk', label: 'Risk Analysis', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/contracts')}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to contracts</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <p className="text-sm text-gray-500">ID: {contract.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={contract.status}
            onChange={(e) => updateMutation.mutate({ status: e.target.value as Contract['status'] })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="signed">Signed</option>
          </select>
          <button
            onClick={handleSaveSnapshot}
            disabled={snapshotMutation.isPending}
            className="flex items-center space-x-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{snapshotMutation.isPending ? 'Saving...' : 'Save Version'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        {activeTab === 'editor' && (
          <ContractEditor
            contractId={contractId}
            initialContent={
              versions.length > 0 ? versions[0].content_json : undefined
            }
            onContentChange={setEditorContent}
          />
        )}
        {activeTab === 'versions' && (
          <VersionTimeline contractId={contractId} versions={versions} />
        )}
        {activeTab === 'approvals' && (
          <ApprovalsPanel contractId={contractId} approvals={approvals} />
        )}
        {activeTab === 'risk' && (
          <RiskAnalysisPanel
            contractText={editorContent ? JSON.stringify(editorContent) : ''}
          />
        )}
      </div>
    </div>
  )
}
