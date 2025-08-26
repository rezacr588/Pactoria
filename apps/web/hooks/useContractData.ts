'use client'

import { useState, useEffect } from 'react'

interface Comment {
  id: string
  content: string
  author: string
  created_at: string
  is_resolved: boolean
  selection_start?: number
  selection_end?: number
}

interface Clause {
  id: string
  title: string
  category: string
  content: string
  description: string
  risk_level: 'low' | 'medium' | 'high'
}

export function useContractData(contractId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [clauses, setClauses] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch contract data
  useEffect(() => {
    const fetchData = async () => {
      if (!contractId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const [commentsRes, clausesRes] = await Promise.all([
          fetch(`/api/contracts/${contractId}/comments`).catch(() => ({ ok: false })),
          fetch('/api/clauses?limit=20').catch(() => ({ ok: false }))
        ])
        
        if (commentsRes.ok && 'json' in commentsRes) {
          const data = await commentsRes.json()
          setComments(data.comments || [])
        }

        if (clausesRes.ok && 'json' in clausesRes) {
          const data = await clausesRes.json()
          setClauses(data.clauses || [])
        }
      } catch (err) {
        console.error('Error fetching contract data:', err)
        setError('Failed to load contract data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [contractId])

  // Add comment
  const addComment = async (content: string, selectionStart?: number, selectionEnd?: number) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          selection_start: selectionStart,
          selection_end: selectionEnd
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        return data.comment
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
    return null
  }

  // Resolve comment
  const resolveComment = async (commentId: string) => {
    try {
      await fetch(`/api/contracts/${contractId}/comments/${commentId}/resolve`, {
        method: 'PATCH'
      })
      
      setComments(prev => 
        prev.map(c => c.id === commentId ? { ...c, is_resolved: true } : c)
      )
    } catch (error) {
      console.error('Error resolving comment:', error)
    }
  }

  return {
    comments,
    clauses,
    loading,
    error,
    addComment,
    resolveComment
  }
}