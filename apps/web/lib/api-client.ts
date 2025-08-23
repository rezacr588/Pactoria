import type {
  Contract,
  ContractVersion,
  ContractApproval,
  CreateContractRequest,
  UpdateContractRequest,
  CreateSnapshotRequest,
  CreateApprovalsRequest,
  ApprovalDecisionRequest,
  GenerateTemplateRequest,
  AnalyzeRisksRequest,
  RiskAnalysisResult,
  User,
  Session,
  ApiError
} from './types'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Network error',
      }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async signIn(email: string, password: string): Promise<Session> {
    return this.request<Session>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signIn', email, password }),
    })
  }

  async signUp(email: string, password: string): Promise<Session> {
    return this.request<Session>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signUp', email, password }),
    })
  }

  async signOut(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signOut' }),
    })
  }

  async getSession(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'getSession' }),
    })
  }

  // Contract endpoints
  async getContracts(): Promise<{ contracts: Contract[] }> {
    return this.request<{ contracts: Contract[] }>('/api/contracts')
  }

  async createContract(data: CreateContractRequest): Promise<{ contract: Contract }> {
    return this.request<{ contract: Contract }>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getContract(id: string): Promise<{
    contract: Contract
    versions: ContractVersion[]
    approvals: ContractApproval[]
  }> {
    return this.request(`/api/contracts/${id}`)
  }

  async updateContract(
    id: string,
    data: UpdateContractRequest
  ): Promise<{ contract: Contract }> {
    return this.request<{ contract: Contract }>(`/api/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteContract(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/contracts/${id}`, {
      method: 'DELETE',
    })
  }

  // Version/Snapshot endpoints
  async createSnapshot(
    contractId: string,
    data: CreateSnapshotRequest
  ): Promise<{ version: ContractVersion }> {
    return this.request<{ version: ContractVersion }>(
      `/api/contracts/${contractId}/snapshot`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  // Approval endpoints
  async getApprovals(contractId: string): Promise<{ approvals: ContractApproval[] }> {
    return this.request<{ approvals: ContractApproval[] }>(
      `/api/contracts/${contractId}/approvals`
    )
  }

  async createApprovals(
    contractId: string,
    data: CreateApprovalsRequest
  ): Promise<{ approvals: ContractApproval[] }> {
    return this.request<{ approvals: ContractApproval[] }>(
      `/api/contracts/${contractId}/approvals`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  async updateApprovalDecision(
    approvalId: string,
    data: ApprovalDecisionRequest
  ): Promise<{ approval: ContractApproval }> {
    return this.request<{ approval: ContractApproval }>(
      `/api/approvals/${approvalId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  // AI endpoints
  async generateTemplate(
    data: GenerateTemplateRequest
  ): Promise<{ result: string }> {
    return this.request<{ result: string }>('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ action: 'generateTemplate', ...data }),
    })
  }

  async analyzeRisks(data: AnalyzeRisksRequest): Promise<RiskAnalysisResult> {
    return this.request<RiskAnalysisResult>('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyzeRisks', ...data }),
    })
  }

  // Streaming AI generation
  async streamGenerateTemplate(prompt: string): Promise<ReadableStream> {
    const response = await fetch(
      `${this.baseUrl}/api/ai?prompt=${encodeURIComponent(prompt)}`,
      {
        headers: {
          Authorization: this.token ? `Bearer ${this.token}` : '',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    return response.body
  }

  // Template endpoints
  async getTemplates(params?: {
    category?: string
    featured?: boolean
    limit?: number
  }): Promise<{ templates: any[]; categories: string[] }> {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set('category', params.category)
    if (params?.featured) searchParams.set('featured', 'true')
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const path = `/api/templates${searchParams.toString() ? `?${searchParams}` : ''}`
    return this.request(path)
  }

  async getTemplate(id: string): Promise<{ template: any }> {
    return this.request(`/api/templates/${id}`)
  }
}

// Create singleton instance
const apiClient = new ApiClient()

export default apiClient
