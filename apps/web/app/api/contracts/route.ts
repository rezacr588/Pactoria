import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody 
} from '@/lib/api/utils'
import { createContractSchema } from '@/lib/validations/schemas'

export const GET = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  
  // Get contracts with RLS applied
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching contracts:', error)
    return errorResponse(error.message, 400)
  }
  
  return successResponse({ contracts: data || [] })
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

  const supabase = createSupabaseClient(request)
  
  let content = body!.content
  let templateVariables = null

  // If template is specified, fetch and process it
  if (body!.templateId) {
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('content_md, variables, title')
      .eq('id', body!.templateId)
      .eq('published', true)
      .single()

    if (templateError) {
      console.error('Error fetching template:', templateError)
      return errorResponse('Template not found or not available', 404)
    }

    // Use template content as base content
    content = template.content_md || ''
    templateVariables = template.variables

    // If no title provided, use template title
    if (!body!.title || body!.title.trim() === '') {
      body!.title = `${template.title} - ${new Date().toLocaleDateString()}`
    }

    // Process template variables if provided
    if (body!.templateVariables && template.variables) {
      const variables = Array.isArray(template.variables) ? template.variables : template.variables.variables || []
      
      variables.forEach((variable: any) => {
        const value = body!.templateVariables?.[variable.name]
        if (value !== undefined && value !== null) {
          const placeholder = `[${variable.name}]`
          content = content?.replace(new RegExp(placeholder, 'g'), String(value)) || content
        }
      })
    }

    // Increment template usage
    await supabase.rpc('increment_template_usage', { template_id: body!.templateId })
  }
  
  // Create contract with metadata
  const metadata: any = {
    template_id: body!.templateId || null,
    template_variables: templateVariables,
    filled_variables: body!.templateVariables || null
  }
  
  if (body!.description) {
    metadata.description = body!.description
  }
  
  // Start with version 1 if content is provided, otherwise 0
  const hasContent = content && content.trim().length > 0
  const initialVersion = hasContent ? 1 : 0
  
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      title: body!.title,
      owner_id: userId,
      status: body!.status || 'draft',
      latest_version_number: initialVersion,
      metadata: metadata
    })
    .select('*')
    .single()
  
  if (contractError) {
    console.error('Error creating contract:', contractError)
    return errorResponse(contractError.message, 400)
  }
  
  // Create initial version if content is provided
  if (hasContent) {
    const { error: versionError } = await supabase
      .from('contract_versions')
      .insert({
        contract_id: contract.id,
        version_number: 1,
        content_md: content,
        created_by: userId
      })
    
    if (versionError) {
      console.error('Error creating initial version:', versionError)
      // Rollback by deleting the contract
      await supabase.from('contracts').delete().eq('id', contract.id)
      return errorResponse('Failed to create initial contract version', 400)
    }
  }
  
  return successResponse({ contract }, 201)
})
