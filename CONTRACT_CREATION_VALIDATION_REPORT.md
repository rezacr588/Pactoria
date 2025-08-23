# Contract Creation Page Validation Report

## Executive Summary
This report documents the validation of the contract creation page (`apps/web/app/(authenticated)/contracts/new/page.tsx`) against the backend API and database schema. Several discrepancies and areas for improvement have been identified.

## 1. Template System Discrepancies

### Issue 1.1: Hardcoded Templates vs Database Templates
**Location:** `apps/web/app/(authenticated)/contracts/new/page.tsx` (lines 30-38)
**Problem:** The contract creation page uses hardcoded template categories:
```javascript
const contractTemplates = [
  { value: 'nda', label: 'Non-Disclosure Agreement' },
  { value: 'service', label: 'Service Agreement' },
  { value: 'employment', label: 'Employment Contract' },
  { value: 'partnership', label: 'Partnership Agreement' },
  { value: 'vendor', label: 'Vendor Agreement' },
  { value: 'license', label: 'License Agreement' },
  { value: 'custom', label: 'Custom Contract' }
]
```

**Database Schema:** The templates table defines different categories:
```sql
category TEXT NOT NULL CHECK (category IN ('nda', 'service', 'employment', 'sales', 'partnership', 'licensing', 'other'))
```

**Discrepancies:**
- Frontend has 'vendor' and 'license' but database has 'sales' and 'licensing'
- Frontend has 'custom' but database has 'other'
- Categories don't align properly

### Issue 1.2: Templates Not Fetched from Database
**Problem:** Templates are not being fetched from the database in the contract creation page, despite having a proper templates table and a `useTemplates` hook available.
**Impact:** Users cannot see or use actual templates stored in the marketplace.

## 2. Contract Creation Field Issues

### Issue 2.1: Missing Content Field in Backend
**Frontend:** The contract creation form sends a `content` field
**Backend:** The backend API (`apps/web/app/api/contracts/route.ts`) does not handle the `content` field when creating contracts. It only stores:
- title
- owner_id
- status
- metadata (containing description)

**Impact:** Contract content entered by users is not being saved to the database.

### Issue 2.2: Description Storage Inconsistency
**Frontend:** Sends `description` as a separate field
**Backend:** Stores description inside the `metadata` JSON field
**Database:** The contracts table doesn't have a dedicated description column

## 3. Contract Versioning Missing

### Issue 3.1: No Initial Version Creation
**Problem:** When a contract is created, no initial version is created in the `contract_versions` table
**Expected:** The content should be stored in `contract_versions` table with:
- content_md (for markdown content)
- content_json (for structured content)
- version_number (should be 1 for initial creation)

## 4. AI Generation Integration Issues

### Issue 4.1: Template Parameter Mismatch
**Frontend:** Sends `template` parameter in AI generation request
**Backend:** Expects `templateId` parameter
**Impact:** Template-based AI generation may not work properly

### Issue 4.2: Generated Content Not Properly Stored
**Problem:** AI-generated content is only set in the frontend state, but when the contract is created, there's no mechanism to create a version with this content.

## 5. File Upload Feature

### Issue 5.1: No Backend Implementation
**Frontend:** Shows file upload UI (lines 338-351)
**Backend:** No file upload endpoint exists
**Impact:** The file upload feature is purely cosmetic and non-functional

## 6. Status Value Alignment

### Issue 6.1: Status Values Are Aligned
**Good News:** Status values are properly aligned:
- Database constraint: `'draft' | 'in_review' | 'approved' | 'rejected' | 'signed'`
- Frontend and backend both correctly use 'draft' as default

## Recommendations

### Priority 1 - Critical Issues
1. **Implement content storage**: Modify the contract creation endpoint to:
   - Accept the `content` field
   - Create an initial version in `contract_versions` table
   - Store content in appropriate format (content_md or content_json)

2. **Fix template integration**: 
   - Fetch actual templates from database in contract creation page
   - Use the `useTemplates` hook
   - Allow users to select and use marketplace templates

### Priority 2 - Important Issues
3. **Standardize template categories**: Align frontend and database template categories

4. **Fix AI generation parameters**: Update frontend to send `templateId` instead of `template`

5. **Implement file upload**: Either implement the backend file upload functionality or remove the UI element

### Priority 3 - Improvements
6. **Refactor metadata handling**: Consider adding dedicated columns for commonly used fields like description instead of storing in JSON metadata

7. **Add template preview**: When a template is selected, show its content in the editor

## Code Changes Required

### Backend Changes (`apps/web/app/api/contracts/route.ts`)
```typescript
// Modified POST handler
export const POST = apiHandler(async (request: NextRequest) => {
  // ... existing auth and validation ...
  
  const supabase = createSupabaseClient(request)
  
  // Start transaction
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      title: body.title,
      owner_id: userId,
      status: body.status || 'draft',
      latest_version_number: 1,
      metadata: {
        description: body.description
      }
    })
    .select('*')
    .single()
  
  if (contractError) {
    return errorResponse(contractError.message, 400)
  }
  
  // Create initial version if content provided
  if (body.content) {
    const { error: versionError } = await supabase
      .from('contract_versions')
      .insert({
        contract_id: contract.id,
        version_number: 1,
        content_md: body.content,
        created_by: userId
      })
    
    if (versionError) {
      // Rollback by deleting contract
      await supabase.from('contracts').delete().eq('id', contract.id)
      return errorResponse('Failed to create contract version', 400)
    }
  }
  
  return successResponse({ contract }, 201)
})
```

### Frontend Changes (`apps/web/app/(authenticated)/contracts/new/page.tsx`)
```typescript
// Add template fetching
import { useTemplates } from '@/hooks/useTemplates'

// Inside component
const { templates, isLoading: templatesLoading } = useTemplates()

// Update template select to use actual templates
<SelectContent>
  {templates?.filter(t => t.is_public).map((template) => (
    <SelectItem key={template.id} value={template.id}>
      {template.title}
    </SelectItem>
  ))}
</SelectContent>
```

## Conclusion

The contract creation page has several significant issues that prevent proper functionality. The most critical issues are:
1. Contract content is not being saved
2. Templates are not integrated with the database
3. File upload is non-functional

Addressing these issues will require coordinated changes to both frontend and backend code, with particular attention to maintaining data consistency between the contracts and contract_versions tables.
