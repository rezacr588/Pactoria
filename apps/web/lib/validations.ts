import { z } from 'zod'

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Contract schemas
export const createContractSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().optional(),
  content: z.string().optional(),
})

export const updateContractSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'rejected', 'signed']).optional(),
})

// Snapshot schema
export const createSnapshotSchema = z.object({
  content_json: z.any().optional(),
  content_md: z.string().optional(),
  ydoc_state_base64: z.string().optional(),
})

// Approval schemas
export const createApprovalSchema = z.object({
  version_id: z.string().uuid('Invalid version ID'),
  approver_ids: z.array(z.string().uuid('Invalid approver ID')),
})

export const approvalDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
})

// AI schemas
export const generateTemplateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt is too long'),
  templateId: z.string().uuid('Invalid template ID').optional(),
})

export const analyzeRisksSchema = z.object({
  text: z.string().min(1, 'Text is required').max(50000, 'Text is too long'),
})

// Profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Type exports
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type CreateContractInput = z.infer<typeof createContractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>
export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>
export type CreateApprovalInput = z.infer<typeof createApprovalSchema>
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>
export type GenerateTemplateInput = z.infer<typeof generateTemplateSchema>
export type AnalyzeRisksInput = z.infer<typeof analyzeRisksSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
