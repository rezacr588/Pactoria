import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { exportToPDF, exportToDOCX, ExportOptions, ContractData } from '@/lib/export/document-export';
import { hasFeatureAccess } from '@/lib/stripe/config';

// Ensure this route is not statically pre-rendered
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const exportOptions: ExportOptions = {
      format: body.format || 'pdf',
      includeMetadata: body.includeMetadata ?? true,
      includeSignatures: body.includeSignatures ?? true,
      includeApprovals: body.includeApprovals ?? true,
      includeVersionHistory: body.includeVersionHistory ?? false,
      watermark: body.watermark || '',
    };

    // Get user's subscription tier for feature access
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const userTier = (profile?.subscription_tier?.toUpperCase() || 'FREE') as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

    // Check export permission
    if (!hasFeatureAccess(userTier, 'export')) {
      return NextResponse.json(
        { error: 'Export feature not available in your current plan' },
        { status: 403 }
      );
    }

    // Fetch contract data with all related information
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        contract_parties (
          party_name,
          party_role,
          party_email,
          party_company
        ),
        contract_metadata (
          key,
          value
        ),
        contract_signatures (
          party_name,
          signed_at,
          signature_data
        ),
        approvals (
          id,
          status,
          comments,
          created_at,
          profiles (
            email,
            full_name
          )
        ),
        versions (
          version_number,
          content,
          created_at
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractError) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this contract
    const { data: hasAccess } = await supabase.rpc('has_contract_access', {
      u: user.id,
      c: contractId
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Transform data to match ContractData interface
    const transformedContract: ContractData = {
      id: contractData.id,
      title: contractData.title,
      content: contractData.content,
      parties: contractData.contract_parties?.map((p: any) => ({
        name: p.party_name,
        role: p.party_role,
        email: p.party_email,
        company: p.party_company,
      })) || [],
      metadata: {
        createdAt: new Date(contractData.created_at),
        updatedAt: new Date(contractData.updated_at),
        version: contractData.latest_version_number?.toString() || '1',
        status: contractData.status,
        // Extract metadata from contract_metadata array
        ...(contractData.contract_metadata?.reduce((acc: any, meta: any) => {
          if (meta.key === 'jurisdiction') acc.jurisdiction = meta.value;
          if (meta.key === 'governing_law') acc.governingLaw = meta.value;
          if (meta.key === 'effective_date') acc.effectiveDate = new Date(meta.value);
          if (meta.key === 'expiration_date') acc.expirationDate = new Date(meta.value);
          return acc;
        }, {}) || {}),
      },
      signatures: contractData.contract_signatures?.map((s: any) => ({
        party: s.party_name,
        signedAt: s.signed_at ? new Date(s.signed_at) : undefined,
        signatureData: s.signature_data,
      })) || [],
      approvals: contractData.approvals?.map((a: any) => ({
        approver: a.profiles?.full_name || a.profiles?.email || 'Unknown',
        approvedAt: new Date(a.created_at),
        status: a.status,
        comments: a.comments,
      })) || [],
    };

    // Apply tier restrictions
    if (userTier === 'STARTER') {
      exportOptions.includeVersionHistory = false;
    }
    
    if (userTier !== 'PROFESSIONAL' && userTier !== 'ENTERPRISE') {
      exportOptions.watermark = '';
    }

    // Generate document based on format
    let documentBlob: Blob;
    let filename: string;
    let mimeType: string;

    if (exportOptions.format === 'pdf') {
      documentBlob = await exportToPDF(transformedContract, exportOptions);
      filename = `${contractData.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
      mimeType = 'application/pdf';
    } else {
      documentBlob = await exportToDOCX(transformedContract, exportOptions);
      filename = `${contractData.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.docx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Convert blob to buffer for response
    const arrayBuffer = await documentBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Log export activity
    await supabase.from('contract_activity').insert({
      contract_id: contractId,
      user_id: user.id,
      action: 'exported',
      details: { format: exportOptions.format, options: exportOptions }
    });

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export contract' },
      { status: 500 }
    );
  }
}