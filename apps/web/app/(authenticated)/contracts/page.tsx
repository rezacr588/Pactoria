"use client"

import React from 'react'
import { ContractsList } from '../../../components/contracts/ContractsList'

export default function ContractsHome() {
  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">Your Contracts</h2>
      <ContractsList />
    </main>
  )
}
