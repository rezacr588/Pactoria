import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse
} from '@/lib/api/utils'
import { db } from '@/lib/db'

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  const contractId = params.id

  try {
    // First verify the user owns this contract
    const contract = await db.contracts.findFirst({
      where: {
        id: contractId,
        owner_id: userId!
      },
      select: { id: true }
    })

    if (!contract) {
      return errorResponse('Contract not found', 404)
    }

    // Get versions for the contract using Prisma
    const versions = await db.contract_versions.findMany({
      where: {
        contract_id: contractId
      },
      orderBy: {
        version_number: 'desc'
      },
      select: {
        id: true,
        contract_id: true,
        version_number: true,
        content_md: true,
        content_json: true,
        ydoc_state: true,
        created_by: true,
        created_at: true
      }
    })

    // For now, return versions without creator details (can be enhanced later)
    const transformedVersions = versions.map(version => ({
      ...version,
      creator: {
        id: version.created_by,
        email: 'user@example.com', // Placeholder
        name: 'User'
      }
    }))

    return successResponse({
      versions: transformedVersions
    })
  } catch (error: any) {
    console.error('Error fetching versions:', error)
    return errorResponse('Failed to fetch versions', 500)
  }
})