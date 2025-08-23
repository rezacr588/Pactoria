import { Database } from './supabase'

// Convenience type exports from generated types
export type Contract = Database['public']['Tables']['contracts']['Row']
export type ContractInsert = Database['public']['Tables']['contracts']['Insert']
export type ContractUpdate = Database['public']['Tables']['contracts']['Update']

export type ContractVersion = Database['public']['Tables']['contract_versions']['Row']
export type ContractVersionInsert = Database['public']['Tables']['contract_versions']['Insert']
export type ContractVersionUpdate = Database['public']['Tables']['contract_versions']['Update']

export type ContractApproval = Database['public']['Tables']['contract_approvals']['Row']
export type ContractApprovalInsert = Database['public']['Tables']['contract_approvals']['Insert']
export type ContractApprovalUpdate = Database['public']['Tables']['contract_approvals']['Update']

export type ContractParty = Database['public']['Tables']['contract_parties']['Row']
export type ContractPartyInsert = Database['public']['Tables']['contract_parties']['Insert']
export type ContractPartyUpdate = Database['public']['Tables']['contract_parties']['Update']

export type ContractMetadataRow = Database['public']['Tables']['contract_metadata']['Row']
export type ContractMetadataInsert = Database['public']['Tables']['contract_metadata']['Insert']
export type ContractMetadataUpdate = Database['public']['Tables']['contract_metadata']['Update']

export type ContractActivity = Database['public']['Tables']['contract_activity']['Row']
export type ContractActivityInsert = Database['public']['Tables']['contract_activity']['Insert']
export type ContractActivityUpdate = Database['public']['Tables']['contract_activity']['Update']

export type CollabSession = Database['public']['Tables']['collab_sessions']['Row']
export type CollabSessionInsert = Database['public']['Tables']['collab_sessions']['Insert']
export type CollabSessionUpdate = Database['public']['Tables']['collab_sessions']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Template = Database['public']['Tables']['templates']['Row']
export type TemplateInsert = Database['public']['Tables']['templates']['Insert']
export type TemplateUpdate = Database['public']['Tables']['templates']['Update']

// Extended types with computed fields
export interface ContractWithDetails extends Contract {
  progress: number
  parties: string[]
  value?: string
  priority: 'high' | 'medium' | 'low'
}

export interface RecentActivity {
  id: string
  user: string
  userEmail: string
  action: string
  contractTitle: string
  contractId: string
  timestamp: string
  avatar?: string
}

export interface ContractStats {
  totalContracts: number
  activeNegotiations: number
  pendingReview: number
  completionRate: number
  contractsChange: number
  negotiationsChange: number
  reviewChange: number
  completionChange: number
}

// API Request/Response types
export interface CreateContractRequest {
  title: string
  description?: string
  content?: string
  status?: Contract['status']
  templateId?: string
  templateVariables?: Record<string, string | number | boolean>
}

export interface UpdateContractRequest {
  title?: string
  description?: string
  status?: Contract['status']
}

export interface CreateSnapshotRequest {
  content_json?: any
  content_md?: string
  ydoc_state_base64?: string
}

export interface CreateApprovalsRequest {
  version_id: string
  approver_ids: string[]
}

export interface ApprovalDecisionRequest {
  status: 'approved' | 'rejected'
  comment?: string
}

export interface GenerateTemplateRequest {
  prompt?: string
  templateId?: string
}

export interface AnalyzeRisksRequest {
  text: string
}

export interface RiskAnalysisResult {
  score: number // 0-1
  flags: string[]
  suggestions: string[]
}

// Auth types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at?: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}

// Error types
export interface ApiError {
  error: string
  code?: string
  details?: any
}

// Helper function to handle base64 encoding/decoding for ydoc_state
export function encodeYdocState(state: Uint8Array): string {
  return btoa(String.fromCharCode(...state))
}

export function decodeYdocState(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}