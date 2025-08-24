import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody 
} from '@/lib/api/utils'
import { createContractSchema } from '@/lib/validations/schemas'
import { db } from '@/lib/db'
import { sanitizeApiInput } from '@/lib/security/input-sanitization'

export const GET = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  try {
    // Get contracts using Prisma with user filtering
    const contracts = await db.contracts.findMany({
      where: {
        owner_id: userId!
      },
      orderBy: {
        updated_at: 'desc'
      },
      include: {
        contract_versions: {
          orderBy: {
            version_number: 'desc'
          },
          take: 1
        }
      }
    })
    
    return successResponse({ contracts })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return errorResponse('Failed to fetch contracts', 500)
  }
})

export const POST = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    createContractSchema
  )
  if (validationError) return validationError

  // Sanitize input
  const sanitized = {
    title: body!.title ? sanitizeApiInput({ title: body!.title }, { title: { context: 'text', maxLength: 200 } }).title : '',
    description: body!.description ? sanitizeApiInput({ description: body!.description }, { description: { context: 'text', maxLength: 1000 } }).description : undefined,
    content: body!.content ? sanitizeApiInput({ content: body!.content }, { content: { context: 'contract', maxLength: 50000 } }).content : undefined,
    status: body!.status ? sanitizeApiInput({ status: body!.status }, { status: { context: 'text', maxLength: 50 } }).status : 'draft'
  }

  try {
    let content = sanitized.content
    let templateVariables = null

    // If template is specified, fetch and process it
    if (body!.templateId) {
      const template = await db.templates.findFirst({
        where: {
          id: body!.templateId,
          is_public: true
        },
        select: {
          content_md: true,
          variables: true,
          title: true,
          usage_count: true
        }
      })

      if (!template) {
        return errorResponse('Template not found or not available', 404)
      }

      // Use template content as base content
      content = template.content_md || ''
      templateVariables = template.variables

      // If no title provided, use template title
      if (!sanitized.title || sanitized.title.trim() === '') {
        sanitized.title = `${template.title} - ${new Date().toLocaleDateString()}`
      }

      // Process template variables if provided
      if (body!.templateVariables && template.variables) {
        const variables = Array.isArray(template.variables) ? template.variables : (template.variables as any)?.variables || []
        
        variables.forEach((variable: any) => {
          const value = body!.templateVariables?.[variable.name]
          if (value !== undefined && value !== null) {
            const placeholder = `[${variable.name}]`
            content = content?.replace(new RegExp(placeholder, 'g'), String(value)) || content
          }
        })
      }

      // Increment template usage
      await db.templates.update({
        where: { id: body!.templateId },
        data: { usage_count: { increment: 1 } }
      })
    }
    
    // Create contract with metadata
    const metadata: any = {
      template_id: body!.templateId || null,
      template_variables: templateVariables,
      filled_variables: body!.templateVariables || null
    }
    
    if (sanitized.description) {
      metadata.description = sanitized.description
    }
    
    // Start with version 1 if content is provided, otherwise 0
    const hasContent = content && content.trim().length > 0
    const initialVersion = hasContent ? 1 : 0
    
    // Use Prisma transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Create contract
      const contract = await tx.contracts.create({
        data: {
          title: sanitized.title,
          owner_id: userId!,
          status: sanitized.status || 'draft',
          latest_version_number: initialVersion,
          metadata: metadata
        }
      })
      
      // Create initial version if content is provided
      if (hasContent) {
        await tx.contract_versions.create({
          data: {
            contract_id: contract.id,
            version_number: 1,
            content_md: content || '',
            created_by: userId!
          }
        })
      }
      
      return contract
    })
    
    return successResponse({ contract: result }, 201)
  } catch (error) {
    console.error('Error creating contract:', error)
    return errorResponse('Failed to create contract', 500)
  }
})
