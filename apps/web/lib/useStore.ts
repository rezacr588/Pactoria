import { create } from 'zustand'

type ContractStore = {
  contracts: Contract[]
  setContracts: (contracts: Contract[]) => void
  addContract: (contract: Contract) => void
  updateContract: (id: string, contract: Partial<Contract>) => void
  removeContract: (id: string) => void
}

type Contract = {
  id: string
  title: string
  status: string
  latest_version_number: number
  created_at: string
}

export const useContractStore = create<ContractStore>((set, _get) => ({
  contracts: [],
  setContracts: (contracts) => set({ contracts }),
  addContract: (contract) => set((state) => ({ contracts: [...state.contracts, contract] })),
  updateContract: (id, updatedContract) => set((state) => ({
    contracts: state.contracts.map((c) => c.id === id ? { ...c, ...updatedContract } : c)
  })),
  removeContract: (id) => set((state) => ({ contracts: state.contracts.filter((c) => c.id !== id) }))
}))
