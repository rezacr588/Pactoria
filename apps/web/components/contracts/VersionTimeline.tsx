"use client"

import React from 'react'
import { useQuery } from '@tanstack/react-query'

type Version = {
  id: string
  version_number: number
  created_at: string
  created_by: string | null
}

export function VersionTimeline({ contractId }: { contractId: string }) {
  const { data: versions, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['versions', contractId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}/versions`)
      if (!response.ok) throw new Error('Failed to fetch versions')
      return response.json()
    },
  })

  React.useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.contractId === contractId) {
        refetch()
      }
    }
    window.addEventListener('contract:snapshot-saved', handler as any)
    return () => window.removeEventListener('contract:snapshot-saved', handler as any)
  }, [contractId, refetch])

  return (
    <div className="rounded-lg bg-white p-4 shadow-card">
      <h3 className="mb-2 font-medium">Version Timeline</h3>
      {error && (
        <div className="mb-3 rounded-md border border-danger-500 bg-red-50 p-2 text-sm text-danger-500">{error.message}</div>
      )}
      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (versions?.length === 0 || !versions) ? (
        <div className="text-sm text-gray-600">No versions yet. Save a snapshot to create version 1.</div>
      ) : (
        <ul className="space-y-2">
          {versions?.map((v: Version) => (
            <li key={v.id} className="flex items-center justify-between rounded-md border p-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                  {v.version_number}
                </span>
                <div className="text-sm text-gray-700">
                  <div className="font-medium">Version {v.version_number}</div>
                  <div className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">by {v.created_by ?? 'unknown'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
