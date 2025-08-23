import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import contractsService from '@/lib/services/contracts'
import { Contract, CreateContractRequest, UpdateContractRequest } from '@/types'
import { toast } from 'sonner'

export function useContracts() {
  const queryClient = useQueryClient()

  // Fetch all contracts
  const {
    data: contracts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { contracts } = await apiClient.getContracts()
      return contracts || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch single contract
  const useContract = (id: string) => {
    return useQuery({
      queryKey: ['contracts', id],
      queryFn: () => contractsService.getContract(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    })
  }

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: (data: CreateContractRequest) => contractsService.createContract(data),
    onSuccess: (newContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('Contract created successfully')
      return newContract
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contract: ${error.message}`)
    }
  })

  // Update contract mutation
  const updateContract = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractRequest }) => 
      contractsService.updateContract(id, data),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', updatedContract.id] })
      toast.success('Contract updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contract: ${error.message}`)
    }
  })

  // Delete contract mutation
  const deleteContract = useMutation({
    mutationFn: (id: string) => contractsService.deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('Contract deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contract: ${error.message}`)
    }
  })

  // Contract statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['contract-stats'],
    queryFn: () => contractsService.getContractStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Recent contracts
  const { data: recentContracts = [] } = useQuery({
    queryKey: ['contracts', 'recent'],
    queryFn: () => contractsService.getRecentContracts(5),
    staleTime: 1000 * 60 * 2,
  })

  return {
    // Data
    contracts,
    stats,
    recentContracts,
    
    // Loading states
    isLoading,
    statsLoading,
    
    // Error
    error,
    
    // Actions
    refetch,
    createContract,
    updateContract,
    deleteContract,
    useContract,
    
    // Utilities
    getContractById: (id: string) => contracts.find(c => c.id === id),
    getContractsByStatus: (status: Contract['status']) => 
      contracts.filter(c => c.status === status),
    getTotalContracts: () => contracts.length,
  }
}
