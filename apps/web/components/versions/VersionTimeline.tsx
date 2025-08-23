'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { 
  History, 
  Eye, 
  RotateCcw, 
  GitBranch, 
  User, 
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'

interface ContractVersion {
  id: string
  contract_id: string
  version_number: number
  content_md?: string
  content_json?: any
  ydoc_state?: string
  created_by: string
  created_at: string
  creator?: {
    id: string
    email: string
    name?: string
  }
}

interface VersionsData {
  versions: ContractVersion[]
}

interface VersionTimelineProps {
  contractId: string
  currentVersion?: number
  onRestoreVersion?: (versionId: string, content: any) => Promise<void>
  onViewVersion?: (version: ContractVersion) => void
  className?: string
}


function getVersionBadgeVariant(versionNumber: number, currentVersion?: number) {
  if (currentVersion && versionNumber === currentVersion) {
    return 'default'
  }
  return 'secondary'
}

export default function VersionTimeline({
  contractId,
  currentVersion,
  onRestoreVersion,
  onViewVersion,
  className
}: VersionTimelineProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedVersion, setSelectedVersion] = useState<ContractVersion | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)

  // Fetch versions for the contract
  const { data: versionsData, isLoading, error } = useQuery({
    queryKey: ['versions', contractId],
    queryFn: () => apiClient.request<VersionsData>(`/api/contracts/${contractId}/versions`),
    enabled: !!contractId
  })

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (version: ContractVersion) => {
      if (onRestoreVersion) {
        await onRestoreVersion(version.id, version.content_json)
      }
      return version
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
      queryClient.invalidateQueries({ queryKey: ['versions', contractId] })
      setShowRestoreDialog(false)
      setSelectedVersion(null)
    }
  })

  const handleRestoreVersion = (version: ContractVersion) => {
    setSelectedVersion(version)
    setShowRestoreDialog(true)
  }

  const handleViewVersion = (version: ContractVersion) => {
    setSelectedVersion(version)
    if (onViewVersion) {
      onViewVersion(version)
    } else {
      setShowViewDialog(true)
    }
  }

  const confirmRestore = () => {
    if (selectedVersion) {
      restoreVersionMutation.mutate(selectedVersion)
    }
  }

  const versions = versionsData?.versions || []
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <History className="h-5 w-5 mr-2" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <History className="h-5 w-5 mr-2" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load version history</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <History className="h-5 w-5 mr-2" />
            Version History
          </CardTitle>
          <CardDescription>
            {versions.length === 0 
              ? 'No versions saved yet' 
              : `${versions.length} version${versions.length === 1 ? '' : 's'} saved`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No versions saved</p>
              <p className="text-xs text-muted-foreground">
                Versions are automatically saved when you make changes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVersions.map((version, index) => {
                const isCurrentVersion = currentVersion === version.version_number
                const isCreatedByCurrentUser = version.created_by === user?.id
                
                return (
                  <div
                    key={version.id}
                    className={cn(
                      'relative flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                      isCurrentVersion && 'bg-primary/5 border-primary/20'
                    )}
                  >
                    {/* Timeline connector */}
                    {index < sortedVersions.length - 1 && (
                      <div className="absolute left-7 top-12 bottom-0 w-px bg-border" />
                    )}
                    
                    {/* Version indicator */}
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
                      isCurrentVersion ? 'border-primary text-primary' : 'border-border text-muted-foreground'
                    )}>
                      <GitBranch className="h-3 w-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getVersionBadgeVariant(version.version_number, currentVersion)}>
                            v{version.version_number}
                          </Badge>
                          {isCurrentVersion && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewVersion(version)}
                            className="h-8 w-8 p-0"
                            title="View version"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {!isCurrentVersion && onRestoreVersion && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                              className="h-8 w-8 p-0"
                              title="Restore version"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                        <User className="h-3 w-3" />
                        <span>
                          {isCreatedByCurrentUser ? 'You' : (version.creator?.name || version.creator?.email)}
                        </span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span title={format(new Date(version.created_at), 'PPpp')}>
                          {formatDistanceToNow(new Date(version.created_at))} ago
                        </span>
                      </div>
                      
                      {/* Content preview */}
                      {version.content_json && (
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mt-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText className="h-3 w-3" />
                            <span className="font-medium">Content Preview</span>
                          </div>
                          <div className="line-clamp-2">
                            {version.content_md?.substring(0, 100) || 'Contract content...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Summary stats */}
          {versions.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-medium">
                    {versions.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Versions</div>
                </div>
                <div>
                  <div className="text-lg font-medium">
                    {new Set(versions.map(v => v.created_by)).size}
                  </div>
                  <div className="text-xs text-muted-foreground">Contributors</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Restore confirmation dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore version {selectedVersion?.version_number}? 
              This will create a new version with the content from version {selectedVersion?.version_number}.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 text-sm font-medium mb-2">
                  <GitBranch className="h-4 w-4" />
                  Version {selectedVersion.version_number}
                </div>
                <div className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(selectedVersion.created_at))} ago
                  {selectedVersion.creator?.email && ` by ${selectedVersion.creator.email}`}
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>Note:</strong> This action will create a new version and does not delete any existing versions.
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRestore}
              disabled={restoreVersionMutation.isPending}
            >
              {restoreVersionMutation.isPending ? 'Restoring...' : 'Restore Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View version dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.version_number} Preview
            </DialogTitle>
            <DialogDescription>
              Created {selectedVersion && formatDistanceToNow(new Date(selectedVersion.created_at))} ago
              {selectedVersion?.creator?.email && ` by ${selectedVersion.creator.email}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedVersion?.content_md ? (
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/30">
                <pre className="whitespace-pre-wrap text-sm">
                  {selectedVersion.content_md}
                </pre>
              </div>
            ) : selectedVersion?.content_json ? (
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/30">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(selectedVersion.content_json, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No content available for this version</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!currentVersion || selectedVersion?.version_number !== currentVersion ? (
              <Button
                onClick={() => selectedVersion && handleRestoreVersion(selectedVersion)}
                disabled={restoreVersionMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}