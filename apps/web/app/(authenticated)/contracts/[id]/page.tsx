'use client'

import React, { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import CollaborativeEditor from '@/components/editor/CollaborativeEditor'
import PresenceAvatars from '@/components/editor/PresenceAvatars'
import VersionTimeline from '@/components/versions/VersionTimeline'
import ApprovalsPanel from '@/components/approvals/ApprovalsPanel'
import { RiskAnalysisPanel } from '@/components/contracts/RiskAnalysisPanel'
import { ExportButton } from '@/components/contracts/export-button'
import type { ContractData } from '@/lib/export/document-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import type { Contract, ContractDetailResponse } from '@/types'
import { 
  ArrowLeft, 
  Users, 
  History, 
  Shield, 
  FileText, 
  Eye,
  Settings,
  Download,
  Share
} from 'lucide-react'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const contractId = params.id as string
  
  const [isReadOnly, setIsReadOnly] = useState(false)

  // Fetch contract details
  const { data: contractData, isLoading, error } = useQuery<ContractDetailResponse>({
    queryKey: ['contract', contractId],
    queryFn: () => apiClient.request(`/api/contracts/${contractId}`),
    enabled: !!contractId
  })

  // Fetch latest version for initial content
  const { data: versionsData } = useQuery({
    queryKey: ['versions', contractId],
    queryFn: () => apiClient.request(`/api/contracts/${contractId}/versions`),
    enabled: !!contractId
  })

  // Create version snapshot
  const snapshotMutation = useMutation({
    mutationFn: (content: any) => {
      return apiClient.request(`/api/contracts/${contractId}/snapshot`, {
        method: 'POST',
        body: JSON.stringify({
          content_json: content,
          content_md: null, // Could extract markdown from TipTap
          ydoc_state: null
        })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
      queryClient.invalidateQueries({ queryKey: ['versions', contractId] })
    },
  })

  // Update contract metadata
  const updateMutation = useMutation({
    mutationFn: (updates: { title?: string; status?: Contract['status'] }) => {
      return apiClient.request(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
    },
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

  if (error || !contractData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load contract</p>
      </div>
    )
  }

  const contract = contractData?.contract
  const versions = contractData?.versions || versionsData || []
  const latestVersion = versions[0] // Versions are sorted by version_number DESC
  
  // Get status badge color
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

  // Handle saving snapshot from collaborative editor
  const handleSaveSnapshot = useCallback(async (content: any) => {
    if (content) {
      await snapshotMutation.mutateAsync(content)
    }
  }, [snapshotMutation])
  
  // Handle version restoration
  const handleRestoreVersion = useCallback(async (_versionId: string, content: any) => {
    // Create a new version with the restored content
    await snapshotMutation.mutateAsync(content)
  }, [snapshotMutation])
  
  // Handle view version
  const handleViewVersion = useCallback((version: any) => {
    // Could open a modal or navigate to a read-only view
    console.log('View version:', version)
  }, [])

  // Transform contract data for export
  const exportContractData: ContractData | undefined = contract ? {
    id: contract.id,
    title: contract.title,
    content: latestVersion?.content_md || '',
    parties: [], // Will be populated by the API from database
    metadata: {
      createdAt: new Date(contract.created_at),
      updatedAt: new Date(contract.updated_at),
      version: contract.latest_version_number?.toString() || '1',
      status: contract.status,
    },
    signatures: [],
    approvals: [],
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/contracts')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to contracts</span>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      v{contract.latest_version_number || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {versions.length} version{versions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Presence avatars */}
                <PresenceAvatars contractId={contractId} />
                
                {/* Status selector */}
                <select
                  value={contract.status}
                  onChange={(e) => updateMutation.mutate({ status: e.target.value as Contract['status'] })}
                  className="rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  disabled={updateMutation.isPending}
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="signed">Signed</option>
                </select>
                
                {/* Action buttons */}
                <Button
                  variant="outline"
                  onClick={() => setIsReadOnly(!isReadOnly)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isReadOnly ? 'Edit' : 'Preview'}
                </Button>
                
                {exportContractData && (
                  <ExportButton 
                    contract={exportContractData}
                    variant="outline"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="editor" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="editor" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Editor</span>
                  </TabsTrigger>
                  <TabsTrigger value="versions" className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>Versions</span>
                    {versions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 text-xs">
                        {versions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approvals" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Approvals</span>
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Risk</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-4">
                  <CollaborativeEditor
                    contractId={contractId}
                    initialContent={latestVersion?.content_json}
                    onSave={handleSaveSnapshot}
                    readOnly={isReadOnly}
                    className="min-h-[600px]"
                  />
                </TabsContent>

                <TabsContent value="versions" className="space-y-4">
                  <VersionTimeline
                    contractId={contractId}
                    currentVersion={contract.latest_version_number}
                    onRestoreVersion={handleRestoreVersion}
                    onViewVersion={handleViewVersion}
                  />
                </TabsContent>

                <TabsContent value="approvals" className="space-y-4">
                  <ApprovalsPanel
                    contractId={contractId}
                    {...(latestVersion?.id && { versionId: latestVersion.id })}
                    canRequestApprovals={!isReadOnly}
                  />
                </TabsContent>

                <TabsContent value="risk" className="space-y-4">
                  {latestVersion?.content_md ? (
                    <RiskAnalysisPanel
                      contractText={latestVersion?.content_md}
                    />
                  ) : (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No content to analyze</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add content to the editor to enable risk analysis
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contract Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Created</span>
                    <p className="text-sm">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Last Updated</span>
                    <p className="text-sm">
                      {new Date(contract.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">ID</span>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {contract.id}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Share className="h-4 w-4 mr-2" />
                    Share Contract
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}