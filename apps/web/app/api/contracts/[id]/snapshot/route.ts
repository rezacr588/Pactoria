import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'

// Snapshot schema
const snapshotSchema = z.object({
  content_json: z.any().optional(),
  content_md: z.string().optional(),
  ydoc_state: z.string().optional() // Base64 encoded
}).refine(data => data.content_json || data.content_md || data.ydoc_state, {
  message: 'At least one content type is required'
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    snapshotSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  const contractId = params.id

  try {
    // Call the RPC function to create snapshot atomically
    const { data: version, error } = await supabase.rpc('create_version_snapshot', {
      p_contract_id: contractId,
      p_content_json: body!.content_json || null,
      p_content_md: body!.content_md || null,
      p_ydoc_state_base64: body!.ydoc_state || null
    })
    
    if (error) {
      console.error('Error creating snapshot:', error)
      return errorResponse(error.message, 400)
    }
    
    // The RPC returns a table, so get the first row
    const versionData = Array.isArray(version) ? version[0] : version
    
    return successResponse({ version: versionData })
    
  } catch (error: any) {
    console.error('Snapshot API error:', error)
    return errorResponse(error.message, 500)
  }
})
