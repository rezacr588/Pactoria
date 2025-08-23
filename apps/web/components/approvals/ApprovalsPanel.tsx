'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Check, 
  X, 
  Clock, 
  User, 
  Plus,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Approval {
  id: string
  contract_id: string
  version_id: string
  approver_id: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  created_at: string
  decided_at?: string
  approver?: {
    id: string
    email: string
    name?: string
  }
}

interface ApprovalsData {
  approvals: Approval[]
}

interface ApprovalsPanelProps {
  contractId: string
  versionId?: string
  canRequestApprovals?: boolean
  className?: string
}

const getStatusIcon = (status: Approval['status']) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'pending':
    default:
      return <Clock className="h-4 w-4 text-yellow-600" />
  }
}

const getStatusBadge = (status: Approval['status']) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
    case 'pending':
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
  }
}

function getInitials(email: string): string {
  return email.split('@')[0]?.charAt(0)?.toUpperCase() || 'U'
}

export default function ApprovalsPanel({
  contractId,
  versionId,
  canRequestApprovals = false,
  className
}: ApprovalsPanelProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newApproverEmail, setNewApproverEmail] = useState('')
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [decisionComment, setDecisionComment] = useState('')
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | null>(null)

  // Fetch approvals for the contract
  const { data: approvalsData, isLoading, error } = useQuery({
    queryKey: ['approvals', contractId],
    queryFn: () => apiClient.request<ApprovalsData>(`/api/contracts/${contractId}/approvals`),
    enabled: !!contractId
  })

  // Request approval mutation
  const requestApprovalMutation = useMutation({
    mutationFn: async ({ approverEmail, versionId }: { approverEmail: string; versionId: string }) => {
      return apiClient.request('/api/contracts/' + contractId + '/approvals', {
        method: 'POST',
        body: JSON.stringify({
          version_id: versionId,
          approver_email: approverEmail
        })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', contractId] })
      setNewApproverEmail('')
      setIsRequestDialogOpen(false)
    }
  })

  // Decision mutation
  const decisionMutation = useMutation({
    mutationFn: async ({ 
      approvalId, 
      status, 
      comment 
    }: { 
      approvalId: string; 
      status: 'approved' | 'rejected'; 
      comment?: string 
    }) => {
      return apiClient.request(`/api/approvals/${approvalId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ status, comment })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', contractId] })
      setDecisionComment('')
      setSelectedApprovalId(null)
      setDecisionAction(null)
    }
  })

  const handleRequestApproval = () => {
    if (!newApproverEmail.trim() || !versionId) return

    requestApprovalMutation.mutate({
      approverEmail: newApproverEmail.trim(),
      versionId
    })
  }

  const handleDecision = (approvalId: string, action: 'approve' | 'reject') => {
    setSelectedApprovalId(approvalId)
    setDecisionAction(action)
  }

  const submitDecision = () => {
    if (!selectedApprovalId || !decisionAction) return

    const mutationData: any = {
      approvalId: selectedApprovalId,
      status: decisionAction === 'approve' ? 'approved' : 'rejected'
    }
    
    const trimmedComment = decisionComment.trim()
    if (trimmedComment) {
      mutationData.comment = trimmedComment
    }
    
    decisionMutation.mutate(mutationData)
  }

  const approvals = approvalsData?.approvals || []

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse" />
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
          <CardTitle className="text-lg">Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load approvals</p>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Approvals</CardTitle>
              <CardDescription>
                {approvals.length === 0 
                  ? 'No approval requests yet' 
                  : `${approvals.filter(a => a.status === 'approved').length} of ${approvals.length} approved`
                }
              </CardDescription>
            </div>
            
            {canRequestApprovals && versionId && (
              <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Request Approval
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Approval</DialogTitle>
                    <DialogDescription>
                      Enter the email address of the person you want to request approval from.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="approver-email">Approver Email</Label>
                      <Input
                        id="approver-email"
                        type="email"
                        placeholder="approver@company.com"
                        value={newApproverEmail}
                        onChange={(e) => setNewApproverEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleRequestApproval}
                      disabled={!newApproverEmail.trim() || requestApprovalMutation.isPending}
                    >
                      {requestApprovalMutation.isPending ? 'Requesting...' : 'Send Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {approvals.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No approvals requested</p>
              {canRequestApprovals && versionId && (
                <p className="text-xs text-muted-foreground">
                  Click "Request Approval" to send approval requests
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => {
                const isMyApproval = approval.approver_id === user?.id
                const canDecide = isMyApproval && approval.status === 'pending'
                
                return (
                  <div
                    key={approval.id}
                    className={cn(
                      'flex items-start space-x-3 p-3 rounded-lg border',
                      isMyApproval && approval.status === 'pending' && 'bg-yellow-50 border-yellow-200'
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(approval.approver?.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {approval.approver?.name || approval.approver?.email}
                          {isMyApproval && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                        </p>
                        {getStatusBadge(approval.status)}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {getStatusIcon(approval.status)}
                        <span>
                          Requested {formatDistanceToNow(new Date(approval.created_at))} ago
                        </span>
                      </div>
                      
                      {approval.comment && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <MessageCircle className="h-3 w-3 inline mr-1" />
                          {approval.comment}
                        </div>
                      )}
                      
                      {canDecide && (
                        <div className="flex items-center space-x-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleDecision(approval.id, 'approve')}
                            disabled={decisionMutation.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDecision(approval.id, 'reject')}
                            disabled={decisionMutation.isPending}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Summary stats */}
          {approvals.length > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-medium text-green-600">
                    {approvals.filter(a => a.status === 'approved').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-yellow-600">
                    {approvals.filter(a => a.status === 'pending').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-red-600">
                    {approvals.filter(a => a.status === 'rejected').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Decision dialog */}
      <Dialog open={!!selectedApprovalId} onOpenChange={(open) => {
        if (!open) {
          setSelectedApprovalId(null)
          setDecisionAction(null)
          setDecisionComment('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionAction === 'approve' ? 'Approve Contract' : 'Reject Contract'}
            </DialogTitle>
            <DialogDescription>
              {decisionAction === 'approve' 
                ? 'You are about to approve this contract version.'
                : 'You are about to reject this contract version.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="decision-comment">
                Comment {decisionAction === 'reject' ? '(required)' : '(optional)'}
              </Label>
              <Textarea
                id="decision-comment"
                placeholder={
                  decisionAction === 'approve' 
                    ? 'Add any comments about your approval...'
                    : 'Please explain why you are rejecting this contract...'
                }
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedApprovalId(null)
                setDecisionAction(null)
                setDecisionComment('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={submitDecision}
              disabled={
                decisionMutation.isPending ||
                (decisionAction === 'reject' && !decisionComment.trim())
              }
              variant={decisionAction === 'approve' ? 'default' : 'destructive'}
            >
              {decisionMutation.isPending ? 'Processing...' : (
                decisionAction === 'approve' ? 'Approve' : 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}