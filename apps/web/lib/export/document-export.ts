/**
 * Document Export Utilities
 * Handles PDF and DOCX generation for contracts
 */

import jsPDF from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  format: 'pdf' | 'docx';
  includeMetadata?: boolean;
  includeSignatures?: boolean;
  includeApprovals?: boolean;
  includeVersionHistory?: boolean;
  watermark?: string;
}

export interface ContractData {
  id: string;
  title: string;
  content: string;
  parties: Array<{
    name: string;
    role: string;
    email?: string;
    company?: string;
  }>;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    status: string;
    jurisdiction?: string;
    governingLaw?: string;
    effectiveDate?: Date;
    expirationDate?: Date;
  };
  clauses?: Array<{
    id: string;
    title: string;
    content: string;
    type?: string;
  }>;
  signatures?: Array<{
    party: string;
    signedAt?: Date;
    signatureData?: string;
  }>;
  approvals?: Array<{
    approver: string;
    approvedAt: Date;
    comments?: string;
    status: 'approved' | 'rejected' | 'pending';
  }>;
}

/**
 * Export contract as PDF
 */
export async function exportToPDF(
  contract: ContractData,
  options: Partial<ExportOptions> = {}
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Add watermark if specified
  if (options.watermark) {
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(50);
    pdf.text(options.watermark, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    pdf.setTextColor(0, 0, 0);
  }

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(contract.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Contract ID and Version
  if (options.includeMetadata && contract.metadata) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Contract ID: ${contract.id}`, margin, yPosition);
    pdf.text(`Version: ${contract.metadata.version}`, pageWidth - margin - 30, yPosition);
    yPosition += 7;
    pdf.text(`Status: ${contract.metadata.status}`, margin, yPosition);
    pdf.text(`Last Updated: ${contract.metadata.updatedAt.toLocaleDateString()}`, pageWidth - margin - 40, yPosition);
    yPosition += 10;
    pdf.setTextColor(0, 0, 0);
  }

  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Parties Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PARTIES', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  contract.parties.forEach((party, index) => {
    const partyText = `${index + 1}. ${party.name} (${party.role})${party.company ? ` - ${party.company}` : ''}`;
    pdf.text(partyText, margin + 5, yPosition);
    yPosition += 6;
  });
  yPosition += 5;

  // Contract Dates
  if (contract.metadata?.effectiveDate || contract.metadata?.expirationDate) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONTRACT PERIOD', margin, yPosition);
    yPosition += 7;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    if (contract.metadata.effectiveDate) {
      pdf.text(`Effective Date: ${contract.metadata.effectiveDate.toLocaleDateString()}`, margin + 5, yPosition);
      yPosition += 6;
    }
    if (contract.metadata.expirationDate) {
      pdf.text(`Expiration Date: ${contract.metadata.expirationDate.toLocaleDateString()}`, margin + 5, yPosition);
      yPosition += 6;
    }
    yPosition += 5;
  }

  // Main Content
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TERMS AND CONDITIONS', margin, yPosition);
  yPosition += 10;

  // Process clauses or content
  if (contract.clauses && contract.clauses.length > 0) {
    contract.clauses.forEach((clause, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      // Clause title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${clause.title}`, margin, yPosition);
      yPosition += 7;

      // Clause content
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(clause.content, contentWidth - 10);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    });
  } else {
    // Fallback to main content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(contract.content, contentWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    });
  }

  // Approvals Section
  if (options.includeApprovals && contract.approvals && contract.approvals.length > 0) {
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('APPROVALS', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    contract.approvals.forEach((approval) => {
      const statusColor = approval.status === 'approved' ? [0, 128, 0] : 
                          approval.status === 'rejected' ? [255, 0, 0] : [255, 165, 0];
      pdf.setTextColor(...statusColor as [number, number, number]);
      pdf.text(`${approval.approver}: ${approval.status.toUpperCase()}`, margin + 5, yPosition);
      pdf.setTextColor(0, 0, 0);
      pdf.text(` - ${approval.approvedAt.toLocaleDateString()}`, margin + 50, yPosition);
      yPosition += 6;
      if (approval.comments) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const commentLines = pdf.splitTextToSize(`Comments: ${approval.comments}`, contentWidth - 10);
        commentLines.forEach((line: string) => {
          pdf.text(line, margin + 10, yPosition);
          yPosition += 4;
        });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      }
    });
  }

  // Signatures Section
  if (options.includeSignatures && contract.signatures && contract.signatures.length > 0) {
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    yPosition += 15;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SIGNATURES', margin, yPosition);
    yPosition += 15;

    const signatureWidth = (contentWidth - 10) / Math.min(contract.signatures.length, 2);
    let xPosition = margin;

    contract.signatures.forEach((signature, index) => {
      if (index > 0 && index % 2 === 0) {
        yPosition += 40;
        xPosition = margin;
      }

      // Signature line
      pdf.line(xPosition, yPosition, xPosition + signatureWidth - 10, yPosition);
      
      // Signature details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(signature.party, xPosition, yPosition + 5);
      
      if (signature.signedAt) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Signed: ${signature.signedAt.toLocaleDateString()}`, xPosition, yPosition + 10);
        pdf.setTextColor(0, 0, 0);
      }

      xPosition += signatureWidth;
    });
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
  }

  return pdf.output('blob');
}

/**
 * Export contract as DOCX
 */
export async function exportToDOCX(
  contract: ContractData,
  options: Partial<ExportOptions> = {}
): Promise<Blob> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: contract.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Metadata
        ...(options.includeMetadata && contract.metadata ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Contract ID: ', bold: true }),
              new TextRun(contract.id),
              new TextRun({ text: '    Version: ', bold: true }),
              new TextRun(contract.metadata.version),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Status: ', bold: true }),
              new TextRun(contract.metadata.status),
              new TextRun({ text: '    Last Updated: ', bold: true }),
              new TextRun(contract.metadata.updatedAt.toLocaleDateString()),
            ],
            spacing: { after: 300 },
          }),
        ] : []),

        // Parties Section
        new Paragraph({
          text: 'PARTIES',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),
        ...contract.parties.map((party, index) => 
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: party.name, bold: true }),
              new TextRun(` (${party.role})`),
              ...(party.company ? [new TextRun(` - ${party.company}`)] : []),
            ],
            spacing: { after: 100 },
            indent: { left: 360 },
          })
        ),

        // Contract Period
        ...(contract.metadata?.effectiveDate || contract.metadata?.expirationDate ? [
          new Paragraph({
            text: 'CONTRACT PERIOD',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          ...(contract.metadata.effectiveDate ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Effective Date: ', bold: true }),
                new TextRun(contract.metadata.effectiveDate.toLocaleDateString()),
              ],
              indent: { left: 360 },
              spacing: { after: 100 },
            }),
          ] : []),
          ...(contract.metadata.expirationDate ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Expiration Date: ', bold: true }),
                new TextRun(contract.metadata.expirationDate.toLocaleDateString()),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
          ] : []),
        ] : []),

        // Terms and Conditions
        new Paragraph({
          text: 'TERMS AND CONDITIONS',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 300 },
        }),

        // Contract Content
        ...(contract.clauses && contract.clauses.length > 0 ? 
          contract.clauses.flatMap((clause, index) => [
            new Paragraph({
              text: `${index + 1}. ${clause.title}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 150 },
            }),
            ...clause.content.split('\n').map(line => 
              new Paragraph({
                text: line,
                spacing: { after: 100 },
                indent: { left: 360 },
              })
            ),
          ]) : 
          contract.content.split('\n').map(line => 
            new Paragraph({
              text: line,
              spacing: { after: 100 },
            })
          )
        ),

        // Approvals Section
        ...(options.includeApprovals && contract.approvals && contract.approvals.length > 0 ? [
          new Paragraph({
            text: 'APPROVALS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
            pageBreakBefore: true,
          }),
          ...contract.approvals.map(approval => 
            new Paragraph({
              children: [
                new TextRun({ 
                  text: approval.approver + ': ',
                  bold: true,
                }),
                new TextRun({ 
                  text: approval.status.toUpperCase(),
                  bold: true,
                  color: approval.status === 'approved' ? '008000' : 
                         approval.status === 'rejected' ? 'FF0000' : 'FFA500',
                }),
                new TextRun(` - ${approval.approvedAt.toLocaleDateString()}`),
                ...(approval.comments ? [
                  new TextRun({ text: '\nComments: ', italics: true }),
                  new TextRun({ text: approval.comments, italics: true }),
                ] : []),
              ],
              spacing: { after: 200 },
              indent: { left: 360 },
            })
          ),
        ] : []),

        // Signatures Section
        ...(options.includeSignatures && contract.signatures && contract.signatures.length > 0 ? [
          new Paragraph({
            text: 'SIGNATURES',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 400 },
            pageBreakBefore: !options.includeApprovals,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: contract.signatures.map(signature => 
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: '_______________________',
                        spacing: { after: 100 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: signature.party,
                            bold: true,
                          })
                        ],
                        spacing: { after: 50 },
                      }),
                      ...(signature.signedAt ? [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `Signed: ${signature.signedAt.toLocaleDateString()}`,
                              size: 20,
                              color: '666666',
                            })
                          ],
                        }),
                      ] : []),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  })
                ),
              }),
            ],
          }),
        ] : []),

        // Footer information
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on ${new Date().toLocaleDateString()}`,
              color: '999999',
              size: 18,
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 800 },
        }),
      ],
    }],
  });

  // Add watermark if specified
  if (options.watermark) {
    // Note: Watermarks in DOCX are more complex and would require additional configuration
    // This is a simplified approach using type assertion
    const sections = (doc as any).sections;
    if (sections && sections[0] && sections[0].children) {
      sections[0].children.unshift(
        new Paragraph({
          children: [
            new TextRun({
              text: options.watermark,
              color: 'E0E0E0',
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }
  }

  const buffer = await Packer.toBlob(doc);
  return buffer;
}

/**
 * Export HTML element as PDF (for complex layouts)
 */
export async function exportHTMLToPDF(
  element: HTMLElement,
  filename: string,
  options: { 
    scale?: number;
    backgroundColor?: string;
  } = {}
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    backgroundColor: options.backgroundColor || '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 25.4; // Convert to mm

  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 10;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  pdf.save(filename);
}

/**
 * Helper function to download the exported document
 */
export function downloadDocument(
  blob: Blob,
  filename: string,
  format: 'pdf' | 'docx'
): void {
  const extension = format === 'pdf' ? '.pdf' : '.docx';
  const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  const file = new Blob([blob], { type: mimeType });
  saveAs(file, `${filename}${extension}`);
}

/**
 * Main export function
 */
export async function exportContract(
  contract: ContractData,
  options: ExportOptions
): Promise<void> {
  try {
    let blob: Blob;
    
    if (options.format === 'pdf') {
      blob = await exportToPDF(contract, options);
    } else {
      blob = await exportToDOCX(contract, options);
    }
    
    const filename = `${contract.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}`;
    downloadDocument(blob, filename, options.format);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error exporting contract:', error);
    throw new Error(`Failed to export contract as ${options.format.toUpperCase()}`);
  }
}
