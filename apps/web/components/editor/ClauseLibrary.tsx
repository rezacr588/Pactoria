'use client'

import { useState } from 'react'
import { Editor } from '@tiptap/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  Copy,
  Shield,
  Scale,
  Gavel,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  StarOff,
} from 'lucide-react'

interface Clause {
  id: string
  title: string
  category: string
  content: string
  description: string
  tags: string[]
  isFavorite?: boolean
  lastUsed?: Date
  riskLevel?: 'low' | 'medium' | 'high'
  jurisdiction?: string
}

interface ClauseLibraryProps {
  isOpen: boolean
  onClose: () => void
  editor: Editor | null
  onInsertClause?: (clause: Clause) => void
}

// Sample clauses for demonstration
const sampleClauses: Clause[] = [
  {
    id: 'force-majeure-standard',
    title: 'Force Majeure (Standard)',
    category: 'General Provisions',
    content: `<p><strong>Force Majeure.</strong> Neither party shall be liable for any failure or delay in performing their obligations under this Agreement if such failure or delay results from circumstances beyond the reasonable control of that party, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials. The party affected by such force majeure event shall promptly notify the other party and shall use commercially reasonable efforts to mitigate the effects of such force majeure event.</p>`,
    description: 'Standard force majeure clause providing relief from liability for unforeseeable events',
    tags: ['force majeure', 'liability', 'standard'],
    riskLevel: 'low',
    jurisdiction: 'General',
  },
  {
    id: 'confidentiality-mutual',
    title: 'Mutual Confidentiality',
    category: 'Confidentiality',
    content: `<p><strong>Confidentiality.</strong> Each party acknowledges that it may have access to certain confidential information of the other party. Each party agrees that it shall not disclose to any third parties, or use for any purpose other than the performance of this Agreement, any confidential information of the other party. "Confidential Information" shall mean all non-public, proprietary, or confidential information disclosed by one party to the other, whether orally, in writing, or in any other form, including but not limited to technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.</p>`,
    description: 'Mutual confidentiality obligations for both parties',
    tags: ['confidentiality', 'mutual', 'NDA'],
    riskLevel: 'medium',
    jurisdiction: 'General',
  },
  {
    id: 'limitation-liability',
    title: 'Limitation of Liability',
    category: 'Liability',
    content: `<p><strong>Limitation of Liability.</strong> IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR USE OR INABILITY TO USE THE SERVICES; (B) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS AND/OR ANY PERSONAL INFORMATION STORED THEREIN; (C) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES; OR (D) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH OUR SERVICES BY ANY THIRD PARTY, REGARDLESS OF WHETHER SUCH PARTY WAS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE AGGREGATE LIABILITY OF EACH PARTY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY CLIENT TO PROVIDER IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.</p>`,
    description: 'Limits liability to direct damages with cap on total liability',
    tags: ['liability', 'limitation', 'damages'],
    riskLevel: 'high',
    jurisdiction: 'US',
  },
  {
    id: 'indemnification-mutual',
    title: 'Mutual Indemnification',
    category: 'Indemnification',
    content: `<p><strong>Indemnification.</strong> Each party shall indemnify, defend, and hold harmless the other party and its officers, directors, employees, agents, and representatives from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or resulting from: (a) any breach of this Agreement by the indemnifying party; (b) any negligent or wrongful act or omission of the indemnifying party; (c) any violation of applicable law by the indemnifying party; or (d) any third-party claim arising from the indemnifying party's performance under this Agreement.</p>`,
    description: 'Mutual indemnification obligations for both parties',
    tags: ['indemnification', 'mutual', 'defense'],
    riskLevel: 'medium',
    jurisdiction: 'General',
  },
  {
    id: 'arbitration-binding',
    title: 'Binding Arbitration',
    category: 'Dispute Resolution',
    content: `<p><strong>Arbitration.</strong> Any dispute, claim, or controversy arising out of or relating to this Agreement or the breach, termination, enforcement, interpretation, or validity thereof, including the determination of the scope or applicability of this agreement to arbitrate, shall be determined by arbitration in [CITY, STATE] before one arbitrator. The arbitration shall be administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules. Judgment on the award may be entered in any court having jurisdiction. This clause shall not preclude parties from seeking provisional remedies in aid of arbitration from a court of appropriate jurisdiction.</p>`,
    description: 'Binding arbitration clause with AAA rules',
    tags: ['arbitration', 'dispute resolution', 'AAA'],
    riskLevel: 'medium',
    jurisdiction: 'US',
  },
]

export default function ClauseLibrary({
  isOpen,
  onClose,
  editor,
  onInsertClause,
}: ClauseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [clauses, setClauses] = useState<Clause[]>(sampleClauses)
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null)


  const filteredClauses = clauses.filter(clause => {
    const matchesSearch = 
      clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || clause.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const insertClause = (clause: Clause) => {
    if (editor) {
      editor.chain().focus().insertContent(clause.content).run()
      if (onInsertClause) {
        onInsertClause(clause)
      }
      onClose()
    }
  }

  const toggleFavorite = (clauseId: string) => {
    setClauses(prevClauses =>
      prevClauses.map(c =>
        c.id === clauseId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    )
  }

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRiskLevelIcon = (level?: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-3 w-3" />
      case 'medium': return <AlertTriangle className="h-3 w-3" />
      case 'high': return <AlertTriangle className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Clause Library</DialogTitle>
          <DialogDescription>
            Browse and insert pre-approved contract clauses
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-full">
          {/* Left Panel - Clause List */}
          <div className="flex-1 flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clauses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid grid-cols-3 h-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="General Provisions">General</TabsTrigger>
                <TabsTrigger value="Confidentiality">Confidentiality</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Clause List */}
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {filteredClauses.map((clause) => (
                  <div
                    key={clause.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedClause?.id === clause.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                    onClick={() => setSelectedClause(clause)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{clause.title}</h4>
                          {clause.isFavorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {clause.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {clause.category}
                          </Badge>
                          {clause.riskLevel && (
                            <Badge 
                              variant="outline" 
                              className={cn('text-xs gap-1', getRiskLevelColor(clause.riskLevel))}
                            >
                              {getRiskLevelIcon(clause.riskLevel)}
                              {clause.riskLevel} risk
                            </Badge>
                          )}
                          {clause.jurisdiction && (
                            <Badge variant="outline" className="text-xs">
                              {clause.jurisdiction}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(clause.id)
                        }}
                      >
                        {clause.isFavorite ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Clause Preview */}
          {selectedClause && (
            <div className="flex-1 flex flex-col border-l pl-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{selectedClause.title}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(selectedClause.content)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => insertClause(selectedClause)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Insert
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Category:</span>
                      <span>{selectedClause.category}</span>
                    </div>
                    {selectedClause.jurisdiction && (
                      <div className="flex items-center gap-2 text-sm">
                        <Gavel className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Jurisdiction:</span>
                        <span>{selectedClause.jurisdiction}</span>
                      </div>
                    )}
                    {selectedClause.riskLevel && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Risk Level:</span>
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs gap-1', getRiskLevelColor(selectedClause.riskLevel))}
                        >
                          {getRiskLevelIcon(selectedClause.riskLevel)}
                          {selectedClause.riskLevel}
                        </Badge>
                      </div>
                    )}
                    {selectedClause.lastUsed && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Last Used:</span>
                        <span>{new Date(selectedClause.lastUsed).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {selectedClause.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Content Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedClause.content }}
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}