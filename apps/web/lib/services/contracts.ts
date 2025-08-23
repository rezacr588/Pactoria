import apiClient from '@/lib/api-client'
import type { 
  Contract, 
  ContractVersion, 
  ContractApproval,
  ContractWithDetails,
  ContractStats,
  RecentActivity,
  CreateContractRequest,
  UpdateContractRequest
} from '@/types'

// These interfaces are now exported from /types

class ContractsService {
  /**
   * Fetch all contracts for the current user
   */
  async getContracts(): Promise<Contract[]> {
    try {
      const { contracts } = await apiClient.getContracts()
      return contracts || []
    } catch (error) {
      console.error('Error fetching contracts:', error)
      throw error
    }
  }

  /**
   * Fetch a single contract with all details
   */
  async getContract(id: string): Promise<{
    contract: Contract
    versions: ContractVersion[]
    approvals: ContractApproval[]
  }> {
    try {
      return await apiClient.getContract(id)
    } catch (error) {
      console.error(`Error fetching contract ${id}:`, error)
      throw error
    }
  }

  /**
   * Create a new contract
   */
  async createContract(data: CreateContractRequest): Promise<Contract> {
    try {
      const { contract } = await apiClient.createContract(data)
      return contract
    } catch (error) {
      console.error('Error creating contract:', error)
      throw error
    }
  }

  /**
   * Update an existing contract
   */
  async updateContract(id: string, data: UpdateContractRequest): Promise<Contract> {
    try {
      const { contract } = await apiClient.updateContract(id, data)
      return contract
    } catch (error) {
      console.error(`Error updating contract ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete a contract
   */
  async deleteContract(id: string): Promise<boolean> {
    try {
      const { success } = await apiClient.deleteContract(id)
      return success
    } catch (error) {
      console.error(`Error deleting contract ${id}:`, error)
      throw error
    }
  }

  /**
   * Get contract statistics for dashboard
   */
  async getContractStats(): Promise<ContractStats> {
    try {
      const response = await apiClient.request<{
        totalContracts: number
        activeNegotiations: number
        pendingReview: number
        completionRate: number
        contractsChange: number
        negotiationsChange: number
        reviewChange: number
        completionChange: number
      }>('/api/contracts/stats')
      
      return response
    } catch (error) {
      console.error('Error fetching contract stats:', error)
      // Return zero data as fallback (not mock)
      return {
        totalContracts: 0,
        activeNegotiations: 0,
        pendingReview: 0,
        completionRate: 0,
        contractsChange: 0,
        negotiationsChange: 0,
        reviewChange: 0,
        completionChange: 0,
      }
    }
  }

  /**
   * Get recent contracts with additional details
   */
  async getRecentContracts(limit: number = 5): Promise<ContractWithDetails[]> {
    try {
      const response = await apiClient.request<{ contracts: ContractWithDetails[] }>(
        `/api/contracts/recent?limit=${limit}`
      )
      return response.contracts || []
    } catch (error) {
      console.error('Error fetching recent contracts:', error)
      // Return empty array as fallback
      return []
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.request<{ activities: RecentActivity[] }>(
        `/api/contracts/activity?limit=${limit}`
      )
      return response.activities || []
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      // Return empty array as fallback
      return []
    }
  }

  /**
   * Subscribe to real-time contract updates
   * Note: Real-time subscriptions should be handled at the component level
   * using the Supabase client directly for better performance
   */
  subscribeToContractUpdates(_callback: (payload: any) => void) {
    // This will be implemented at component level
    console.log('Real-time subscriptions should be handled at component level')
    return { unsubscribe: () => {} }
  }

  /**
   * Subscribe to real-time activity updates
   */
  subscribeToActivityUpdates(_callback: (payload: any) => void) {
    // This will be implemented at component level
    console.log('Real-time subscriptions should be handled at component level')
    return { unsubscribe: () => {} }
  }


}

// Create singleton instance
const contractsService = new ContractsService()

export default contractsService
