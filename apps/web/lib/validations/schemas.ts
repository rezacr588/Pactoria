import { z } from 'zod'

// =====================
// Common Schemas
// =====================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .max(255, 'Email is too long')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  )

// =====================
// Auth Schemas
// =====================

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// =====================
// Contract Schemas
// =====================

export const contractStatusSchema = z.enum([
  'draft',
  'in_review',
  'approved',
  'rejected',
  'signed',
])

export const createContractSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .trim(),
  description: z.string().max(1000, 'Description is too long').optional(),
  content: z.string().optional(),
  status: contractStatusSchema.default('draft'),
  metadata: z.record(z.unknown()).optional(),
  templateId: uuidSchema.optional(),
  templateVariables: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
})

export const updateContractSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title is too long')
    .trim()
    .optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  status: contractStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const contractSchema = z.object({
  id: uuidSchema,
  owner_id: uuidSchema,
  title: z.string(),
  status: contractStatusSchema,
  latest_version_number: z.number().int().min(0),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// =====================
// Version/Snapshot Schemas
// =====================

export const createSnapshotSchema = z.object({
  content_json: z.record(z.unknown()).optional(),
  content_md: z.string().max(1000000, 'Content is too large').nullable().optional(),
  ydoc_state_base64: z.string().nullable().optional(),
})

export const contractVersionSchema = z.object({
  id: uuidSchema,
  contract_id: uuidSchema,
  version_number: z.number().int().positive(),
  ydoc_state: z.instanceof(Uint8Array).nullable().optional(),
  content_md: z.string().nullable().optional(),
  content_json: z.record(z.unknown()).nullable().optional(),
  created_by: uuidSchema.nullable().optional(),
  created_at: z.string().datetime(),
})

// =====================
// Approval Schemas
// =====================

export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected'])

export const createApprovalsSchema = z.object({
  version_id: uuidSchema,
  approver_ids: z.array(uuidSchema).min(1, 'At least one approver is required'),
})

export const approvalDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().max(1000, 'Comment is too long').optional(),
})

export const contractApprovalSchema = z.object({
  id: uuidSchema,
  contract_id: uuidSchema,
  version_id: uuidSchema,
  approver_id: uuidSchema,
  status: approvalStatusSchema,
  comment: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  decided_at: z.string().datetime().nullable().optional(),
})

// =====================
// AI Schemas
// =====================

export const generateTemplateRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(2000, 'Prompt is too long')
    .optional(),
  templateId: z.string().optional(),
}).refine((data) => data.prompt || data.templateId, {
  message: 'Either prompt or templateId is required',
})

export const analyzeRisksRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Text is required')
    .max(50000, 'Text is too long'),
})

export const riskAnalysisResultSchema = z.object({
  score: z.number().min(0).max(1),
  flags: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// =====================
// Collaboration Schemas
// =====================

export const collaborationProviderSchema = z.enum(['y-webrtc', 'hocuspocus', 'liveblocks'])

export const collabSessionSchema = z.object({
  id: uuidSchema,
  contract_id: uuidSchema,
  provider: collaborationProviderSchema,
  room_id: z.string(),
  participants: z.array(z.object({
    user_id: uuidSchema,
    name: z.string(),
    role: z.string().optional(),
  })),
  started_by: uuidSchema.nullable().optional(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable().optional(),
})

// =====================
// Query/Filter Schemas
// =====================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const contractFilterSchema = z.object({
  status: contractStatusSchema.optional(),
  owner_id: uuidSchema.optional(),
  search: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
}).merge(paginationSchema)

// =====================
// Type Exports
// =====================

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

export type CreateContractInput = z.infer<typeof createContractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>
export type Contract = z.infer<typeof contractSchema>
export type ContractStatus = z.infer<typeof contractStatusSchema>

export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>
export type ContractVersion = z.infer<typeof contractVersionSchema>

export type CreateApprovalsInput = z.infer<typeof createApprovalsSchema>
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>
export type ContractApproval = z.infer<typeof contractApprovalSchema>
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>

export type GenerateTemplateRequest = z.infer<typeof generateTemplateRequestSchema>
export type AnalyzeRisksRequest = z.infer<typeof analyzeRisksRequestSchema>
export type RiskAnalysisResult = z.infer<typeof riskAnalysisResultSchema>

export type CollaborationProvider = z.infer<typeof collaborationProviderSchema>
export type CollabSession = z.infer<typeof collabSessionSchema>

export type PaginationParams = z.infer<typeof paginationSchema>
export type ContractFilter = z.infer<typeof contractFilterSchema>
