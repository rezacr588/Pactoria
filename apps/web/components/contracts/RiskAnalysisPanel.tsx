'use client'

import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { AlertTriangle, Shield, TrendingUp, FileSearch, Loader2 } from 'lucide-react'

interface RiskAnalysisPanelProps {
  contractText: string
}

export function RiskAnalysisPanel({ contractText }: RiskAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<{
    score: number
    flags: string[]
    suggestions: string[]
  } | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: () => apiClient.analyzeRisks({ text: contractText }),
    onSuccess: (data) => {
      setAnalysis(data)
    },
  })

  const getRiskLevel = (score: number) => {
    if (score < 0.3) return { label: 'Low Risk', color: 'text-green-600 bg-green-100' }
    if (score < 0.7) return { label: 'Medium Risk', color: 'text-yellow-600 bg-yellow-100' }
    return { label: 'High Risk', color: 'text-red-600 bg-red-100' }
  }

  const handleAnalyze = () => {
    if (contractText && contractText.length > 10) {
      analyzeMutation.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
        <button
          onClick={handleAnalyze}
          disabled={analyzeMutation.isPending || !contractText}
          className="flex items-center space-x-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {analyzeMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4" />
              <span>Analyze Contract</span>
            </>
          )}
        </button>
      </div>

      {!analysis && !analyzeMutation.isPending && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No analysis yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click "Analyze Contract" to perform AI-powered risk assessment
          </p>
        </div>
      )}

      {analyzeMutation.isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-2 text-sm text-gray-600">Analyzing contract risks...</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Risk Score */}
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Overall Risk Score</h4>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {(analysis.score * 100).toFixed(0)}%
                </p>
              </div>
              <div className={`rounded-lg px-4 py-2 ${getRiskLevel(analysis.score).color}`}>
                <p className="text-sm font-medium">{getRiskLevel(analysis.score).label}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-4 w-full rounded-full bg-gray-200">
                <div
                  className={`h-4 rounded-full ${
                    analysis.score < 0.3
                      ? 'bg-green-500'
                      : analysis.score < 0.7
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.score * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Risk Flags */}
          {analysis.flags.length > 0 && (
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h4 className="text-sm font-medium text-gray-900">Risk Flags</h4>
              </div>
              <ul className="space-y-2">
                {analysis.flags.map((flag, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 mt-1 block h-1.5 w-1.5 rounded-full bg-yellow-500" />
                    <span className="text-sm text-gray-700">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h4 className="text-sm font-medium text-gray-900">Improvement Suggestions</h4>
              </div>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 mt-1 block h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {analyzeMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Failed to analyze contract. Please try again.
          </p>
        </div>
      )}
    </div>
  )
}
