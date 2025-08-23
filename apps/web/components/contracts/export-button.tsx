'use client';

import { useState } from 'react';
import { Download, FileText, FileType, Loader2, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { exportContract, ExportOptions, ContractData } from '@/lib/export/document-export';
import { hasFeatureAccess } from '@/lib/stripe/config';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ExportButtonProps {
  contract: ContractData;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  userTier?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}

export function ExportButton({
  contract,
  className,
  variant = 'outline',
  size = 'default',
  userTier = 'FREE',
}: ExportButtonProps) {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeSignatures: true,
    includeApprovals: true,
    includeVersionHistory: false,
    watermark: '',
  });

  const canExport = hasFeatureAccess(userTier, 'export');

  const handleExport = async () => {
    if (!canExport) {
      toast.error('Export feature is not available in your current plan. Please upgrade to access this feature.');
      return;
    }

    setIsExporting(true);
    try {
      await exportContract(contract, exportConfig);
      toast.success(`Contract exported successfully as ${exportConfig.format.toUpperCase()}`);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = async (format: 'pdf' | 'docx') => {
    if (!canExport) {
      toast.error('Export feature is not available in your current plan. Please upgrade to access this feature.');
      return;
    }

    setIsExporting(true);
    try {
      await exportContract(contract, {
        format,
        includeMetadata: true,
        includeSignatures: true,
        includeApprovals: true,
      });
      toast.success(`Contract exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!canExport) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
        onClick={() => toast.info('Upgrade to Starter or higher to export documents')}
      >
        <Lock className="mr-2 h-4 w-4" />
        Export
        <Badge variant="secondary" className="ml-2">Pro</Badge>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            className={className}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Quick Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('docx')}>
            <FileType className="mr-2 h-4 w-4" />
            Quick Export as DOCX
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Custom Export...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Contract</DialogTitle>
            <DialogDescription>
              Configure your export settings and choose what to include in the document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup
                value={exportConfig.format}
                onValueChange={(value) => 
                  setExportConfig(prev => ({ ...prev, format: value as 'pdf' | 'docx' }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    PDF Document
                    <span className="text-sm text-muted-foreground ml-2">
                      (Best for sharing and printing)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="docx" id="docx" />
                  <Label htmlFor="docx" className="flex items-center cursor-pointer">
                    <FileType className="mr-2 h-4 w-4" />
                    Word Document (DOCX)
                    <span className="text-sm text-muted-foreground ml-2">
                      (Best for editing)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <Label>Include in Export</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={exportConfig.includeMetadata}
                    onCheckedChange={(checked) =>
                      setExportConfig(prev => ({ ...prev, includeMetadata: !!checked }))
                    }
                  />
                  <Label htmlFor="metadata" className="cursor-pointer">
                    Document Metadata
                    <span className="text-sm text-muted-foreground ml-2">
                      (ID, version, dates)
                    </span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signatures"
                    checked={exportConfig.includeSignatures}
                    onCheckedChange={(checked) =>
                      setExportConfig(prev => ({ ...prev, includeSignatures: !!checked }))
                    }
                  />
                  <Label htmlFor="signatures" className="cursor-pointer">
                    Signature Blocks
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="approvals"
                    checked={exportConfig.includeApprovals}
                    onCheckedChange={(checked) =>
                      setExportConfig(prev => ({ ...prev, includeApprovals: !!checked }))
                    }
                  />
                  <Label htmlFor="approvals" className="cursor-pointer">
                    Approval History
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="version-history"
                    checked={exportConfig.includeVersionHistory}
                    onCheckedChange={(checked) =>
                      setExportConfig(prev => ({ ...prev, includeVersionHistory: !!checked }))
                    }
                    disabled={userTier === 'STARTER'}
                  />
                  <Label htmlFor="version-history" className="cursor-pointer">
                    Version History
                    {userTier === 'STARTER' && (
                      <Badge variant="secondary" className="ml-2">Pro</Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            {/* Watermark */}
            <div className="space-y-2">
              <Label htmlFor="watermark">
                Watermark (Optional)
                {userTier !== 'PROFESSIONAL' && userTier !== 'ENTERPRISE' && (
                  <Badge variant="secondary" className="ml-2">Pro</Badge>
                )}
              </Label>
              <Input
                id="watermark"
                placeholder="e.g., CONFIDENTIAL, DRAFT"
                value={exportConfig.watermark}
                onChange={(e) =>
                  setExportConfig(prev => ({ ...prev, watermark: e.target.value }))
                }
                disabled={userTier !== 'PROFESSIONAL' && userTier !== 'ENTERPRISE'}
              />
            </div>

            {/* Export Preview */}
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">Export Preview:</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  Format: {exportConfig.format.toUpperCase()}
                </div>
                {exportConfig.includeMetadata && (
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    Includes metadata
                  </div>
                )}
                {exportConfig.includeSignatures && (
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    Includes signatures
                  </div>
                )}
                {exportConfig.includeApprovals && (
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    Includes approvals
                  </div>
                )}
                {exportConfig.watermark && (
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    Watermark: {exportConfig.watermark}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
