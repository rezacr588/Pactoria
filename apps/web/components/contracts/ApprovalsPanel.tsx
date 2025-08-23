'use client'

import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'
import type { ContractApproval } from '@/lib/types'
import { CheckCircle, XCircle, Clock, UserPlus, Send } from 'lucide-react'

interface ApprovalsPanelProps {
  contractId: string
  approvals: ContractApproval[]
}

export function ApprovalsPanel({ contractId, approvals }: ApprovalsPanelProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [approverEmail, setApproverEmail] = useState('')
  const [versionId, setVersionId] = useState('')

  const createApprovalMutation = useMutation({
    mutationFn: (data: { version_id: string; approver_ids: string[] }) =>
      apiClient.createApprovals(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
      setShowAddForm(false)
      setApproverEmail('')
      setVersionId('')
    },
  })

  const decisionMutation = useMutation({
    mutationFn: (params: { approvalId: string; status: 'approved' | 'rejected'; comment?: string }) =>
      apiClient.updateApprovalDecision(params.approvalId, {
        status: params.status,
        comment: params.comment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
    },
  })

  const getStatusIcon = (status: ContractApproval['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const myApprovals = approvals.filter((a) => a.approver_id === user?.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Approval Requests</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <UserPlus className="h-4 w-4" />
          <span>Request Approval</span>
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-900">Request New Approval</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              // In a real app, you'd look up the user ID by email
              // For now, we'll use a placeholder
              createApprovalMutation.mutate({
                version_id: versionId,
                approver_ids: [approverEmail], // This should be user IDs
              })
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Version ID</label>
              <input
                type="text"
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                placeholder="Enter version ID"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Approver Email</label>
              <input
                type="email"
                value={approverEmail}
                onChange={(e) => setApproverEmail(e.target.value)}
                placeholder="approver@example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createApprovalMutation.isPending}
                className="flex items-center space-x-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{createApprovalMutation.isPending ? 'Sending...' : 'Send Request'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setApproverEmail('')
                  setVersionId('')
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {myApprovals.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-blue-900">Your Pending Approvals</h4>
          <div className="space-y-3">
            {myApprovals
              .filter((a) => a.status === 'pending')
              .map((approval) => (
                <div key={approval.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Version {approval.version_id}</p>
                    <p className="text-xs text-gray-500">Requested {new Date(approval.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        decisionMutation.mutate({
                          approvalId: approval.id,
                          status: 'approved',
                        })
                      }
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        decisionMutation.mutate({
                          approvalId: approval.id,
                          status: 'rejected',
                        })
                      }
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {approvals.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No approval requests yet</p>
        ) : (
          approvals.map((approval) => (
            <div key={approval.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(approval.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Approver: {approval.approver_id === user?.id ? 'You' : approval.approver_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    Version: {approval.version_id} • Requested {new Date(approval.created_at).toLocaleDateString()}
                  </p>
                  {approval.comment && (
                    <p className="mt-1 text-xs text-gray-600">Comment: {approval.comment}</p>
                  )}
                </div>
              </div>
              <div className="text-sm">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    approval.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : approval.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {approval.status}
                </span>
                {approval.decided_at && (
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(approval.decided_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
