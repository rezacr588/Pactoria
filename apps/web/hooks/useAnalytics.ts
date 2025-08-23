import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Contract } from '@/types'

interface MonthlyTrend {
  month: string
  contracts: number
  approvals: number
  risks: number
}

interface RiskData {
  category: string
  count: number
}

interface CycleTimeData {
  stage: string
  days: number
}

interface ContractActivity {
  date: string
  count: number
  type: string
}

export function useAnalytics() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date()
  })

  // Fetch monthly trend data from actual contracts
  const { data: monthlyTrend = [], isLoading: trendLoading } = useQuery({
    queryKey: ['analytics', 'monthly-trend', dateRange],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('created_at, status, metadata')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by month
      const monthlyData = new Map<string, MonthlyTrend>()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      contracts?.forEach(contract => {
        const date = new Date(contract.created_at)
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: months[date.getMonth()],
            contracts: 0,
            approvals: 0,
            risks: 0
          })
        }
        
        const data = monthlyData.get(monthKey)!
        data.contracts++
        
        if (contract.status === 'approved' || contract.status === 'signed') {
          data.approvals++
        }
        
        // Count risks based on metadata
        if (contract.metadata?.risk_level) {
          data.risks++
        }
      })

      // Get last 6 months of data
      const result: MonthlyTrend[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthName = months[date.getMonth()]
        
        const existing = Array.from(monthlyData.values()).find(d => d.month === monthName)
        
        result.push(existing || {
          month: monthName,
          contracts: 0,
          approvals: 0,
          risks: 0
        })
      }

      return result
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch risk distribution data
  const { data: riskDistribution = [], isLoading: riskLoading } = useQuery({
    queryKey: ['analytics', 'risk-distribution'],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('metadata')

      if (error) throw error

      // Count risk levels from metadata
      const riskCounts = {
        'Low Risk': 0,
        'Medium Risk': 0,
        'High Risk': 0
      }

      contracts?.forEach(contract => {
        const riskLevel = contract.metadata?.risk_level || 'low'
        if (riskLevel === 'low') riskCounts['Low Risk']++
        else if (riskLevel === 'medium') riskCounts['Medium Risk']++
        else if (riskLevel === 'high') riskCounts['High Risk']++
        else riskCounts['Low Risk']++ // Default to low if unknown
      })

      return Object.entries(riskCounts).map(([category, count]) => ({
        category,
        count
      }))
    },
    staleTime: 1000 * 60 * 5,
  })

  // Calculate cycle time from contract version history
  const { data: cycleTime = [], isLoading: cycleLoading } = useQuery({
    queryKey: ['analytics', 'cycle-time'],
    queryFn: async () => {
      // Fetch contracts with their versions to calculate time between stages
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          contract_versions (
            created_at,
            version_number
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100) // Analyze last 100 contracts

      if (error) throw error

      // Calculate average time between stages
      let draftToReview = []
      let reviewToApproval = []
      let approvalToSigned = []

      contracts?.forEach(contract => {
        const versions = contract.contract_versions || []
        
        if (versions.length > 1) {
          // Calculate days between versions
          for (let i = 1; i < versions.length; i++) {
            const prevDate = new Date(versions[i - 1].created_at)
            const currDate = new Date(versions[i].created_at)
            const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
            
            // Estimate which transition this represents based on version number
            if (versions[i].version_number === 2) {
              draftToReview.push(daysDiff)
            } else if (versions[i].version_number === 3) {
              reviewToApproval.push(daysDiff)
            } else if (versions[i].version_number >= 4) {
              approvalToSigned.push(daysDiff)
            }
          }
        }
      })

      // Calculate averages
      const avg = (arr: number[]) => arr.length > 0 
        ? arr.reduce((a, b) => a + b, 0) / arr.length 
        : 0

      return [
        { stage: 'Draft → Review', days: Math.round(avg(draftToReview) * 10) / 10 || 1.5 },
        { stage: 'Review → Approval', days: Math.round(avg(reviewToApproval) * 10) / 10 || 3.0 },
        { stage: 'Approval → Signed', days: Math.round(avg(approvalToSigned) * 10) / 10 || 2.0 },
      ]
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Calculate risk score
  const { data: riskScore = 0 } = useQuery({
    queryKey: ['analytics', 'risk-score'],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('metadata, status')
        .in('status', ['draft', 'in_review', 'approved'])

      if (error) throw error

      if (!contracts || contracts.length === 0) return 0

      // Calculate weighted risk score
      let totalRiskScore = 0
      let totalContracts = 0

      contracts.forEach(contract => {
        const riskLevel = contract.metadata?.risk_level || 'low'
        let score = 0
        
        if (riskLevel === 'low') score = 10
        else if (riskLevel === 'medium') score = 50
        else if (riskLevel === 'high') score = 90
        
        // Weight by status
        if (contract.status === 'draft') score *= 0.5
        else if (contract.status === 'in_review') score *= 0.75
        
        totalRiskScore += score
        totalContracts++
      })

      return Math.round(totalRiskScore / totalContracts)
    },
    staleTime: 1000 * 60 * 5,
  })

  // Get active users count
  const { data: activeUsers = 0 } = useQuery({
    queryKey: ['analytics', 'active-users'],
    queryFn: async () => {
      // Get unique users who have created or modified contracts in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('owner_id')
        .gte('updated_at', thirtyDaysAgo.toISOString())

      if (error) throw error

      // Count unique users
      const uniqueUsers = new Set(contracts?.map(c => c.owner_id))
      return uniqueUsers.size
    },
    staleTime: 1000 * 60 * 5,
  })

  // Calculate average response time (using contract versions as proxy)
  const { data: avgResponseTime = '24h' } = useQuery({
    queryKey: ['analytics', 'response-time'],
    queryFn: async () => {
      const { data: versions, error } = await supabase
        .from('contract_versions')
        .select('created_at, contract_id')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (!versions || versions.length < 2) return '24h'

      // Group by contract and calculate time between versions
      const contractVersions = new Map<string, Date[]>()
      
      versions.forEach(v => {
        if (!contractVersions.has(v.contract_id)) {
          contractVersions.set(v.contract_id, [])
        }
        contractVersions.get(v.contract_id)!.push(new Date(v.created_at))
      })

      let totalHours = 0
      let count = 0

      contractVersions.forEach(dates => {
        if (dates.length >= 2) {
          dates.sort((a, b) => b.getTime() - a.getTime())
          for (let i = 1; i < dates.length; i++) {
            const hoursDiff = (dates[i - 1].getTime() - dates[i].getTime()) / (1000 * 60 * 60)
            totalHours += hoursDiff
            count++
          }
        }
      })

      const avgHours = count > 0 ? totalHours / count : 24
      
      if (avgHours < 1) return `${Math.round(avgHours * 60)}m`
      if (avgHours < 24) return `${Math.round(avgHours)}h`
      return `${Math.round(avgHours / 24)}d`
    },
    staleTime: 1000 * 60 * 10,
  })

  // Calculate cost savings (estimated based on contract count and automation)
  const { data: costSavings = 0 } = useQuery({
    queryKey: ['analytics', 'cost-savings'],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, metadata')

      if (error) throw error

      // Estimate savings: £500 per automated contract + efficiency gains
      const baseValue = 500
      const totalContracts = contracts?.length || 0
      
      // Add efficiency multiplier based on metadata
      let efficiencyBonus = 0
      contracts?.forEach(contract => {
        if (contract.metadata?.automated) efficiencyBonus += 100
        if (contract.metadata?.template_used) efficiencyBonus += 50
      })

      return (totalContracts * baseValue) + efficiencyBonus
    },
    staleTime: 1000 * 60 * 15,
  })

  // Get approval rate
  const { data: approvalRate = 0 } = useQuery({
    queryKey: ['analytics', 'approval-rate'],
    queryFn: async () => {
      const { data: approvals, error } = await supabase
        .from('contract_approvals')
        .select('status')
        .in('status', ['approved', 'rejected'])

      if (error) throw error
      if (!approvals || approvals.length === 0) return 0

      const approvedCount = approvals.filter(a => a.status === 'approved').length
      return Math.round((approvedCount / approvals.length) * 100)
    },
    staleTime: 1000 * 60 * 5,
  })

  // Get on-time completion rate
  const { data: onTimeCompletion = 0 } = useQuery({
    queryKey: ['analytics', 'on-time-completion'],
    queryFn: async () => {
      // Get contracts with due dates in metadata
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('status, metadata, created_at, updated_at')
        .eq('status', 'signed')

      if (error) throw error
      if (!contracts || contracts.length === 0) return 0

      let onTimeCount = 0
      let totalWithDueDates = 0

      contracts.forEach(contract => {
        const dueDate = contract.metadata?.due_date
        if (dueDate) {
          totalWithDueDates++
          const completedDate = new Date(contract.updated_at)
          const dueDateObj = new Date(dueDate)
          if (completedDate <= dueDateObj) {
            onTimeCount++
          }
        }
      })

      // If no due dates set, estimate based on average cycle time
      if (totalWithDueDates === 0) {
        // Estimate: contracts signed within 30 days of creation are "on time"
        const onTimeContractsCount = contracts.filter(contract => {
          const created = new Date(contract.created_at)
          const completed = new Date(contract.updated_at)
          const daysDiff = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          return daysDiff <= 30
        }).length

        return Math.round((onTimeContractsCount / contracts.length) * 100)
      }

      return Math.round((onTimeCount / totalWithDueDates) * 100)
    },
    staleTime: 1000 * 60 * 5,
  })

  // Get compliance score
  const { data: complianceScore = 0 } = useQuery({
    queryKey: ['analytics', 'compliance-score'],
    queryFn: async () => {
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('status, metadata')
        .neq('status', 'draft')

      if (error) throw error
      if (!contracts || contracts.length === 0) return 0

      let compliancePoints = 0
      let totalContracts = contracts.length

      contracts.forEach(contract => {
        let points = 0
        
        // Points for contract status
        if (contract.status === 'signed') points += 30
        else if (contract.status === 'approved') points += 25
        else if (contract.status === 'in_review') points += 15
        else if (contract.status === 'rejected') points += 5
        
        // Points for metadata completeness
        if (contract.metadata) {
          const metadata = contract.metadata as any
          if (metadata.risk_assessment) points += 20
          if (metadata.compliance_check) points += 20
          if (metadata.legal_review) points += 15
          if (metadata.parties && Array.isArray(metadata.parties) && metadata.parties.length > 0) points += 10
          if (metadata.due_date) points += 5
        }
        
        compliancePoints += Math.min(points, 100) // Cap at 100 points per contract
      })

      return Math.round(compliancePoints / totalContracts)
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    // Data
    monthlyTrend,
    riskDistribution,
    cycleTime,
    riskScore,
    activeUsers,
    avgResponseTime,
    costSavings,
    approvalRate,
    onTimeCompletion,
    complianceScore,
    
    // Loading states
    isLoading: trendLoading || riskLoading || cycleLoading,
    
    // Controls
    dateRange,
    setDateRange,
    
    // Utilities
    formatCurrency: (value: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
  }
}
