import { z } from 'zod'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// Enhanced validation schemas for legal documents
export const LegalDocumentValidationSchema = z.object({
  hasTitle: z.boolean().refine(val => val === true, "Document must have a title"),
  hasParties: z.boolean().refine(val => val === true, "Document must identify all parties"),
  hasDate: z.boolean().refine(val => val === true, "Document must have an effective date"),
  hasSignatureBlocks: z.boolean().refine(val => val === true, "Document must have signature blocks"),
  hasGoverningLaw: z.boolean().refine(val => val === true, "Document must specify governing law"),
  minimumWordCount: z.number().min(100, "Legal document must have at least 100 words"),
  hasRequiredClauses: z.array(z.string()).min(1, "Document must have required legal clauses")
})

export const ContractElementSchema = z.object({
  type: z.enum(['title', 'party', 'date', 'clause', 'signature', 'governing_law']),
  content: z.string().min(1),
  isRequired: z.boolean(),
  isValid: z.boolean(),
  validationErrors: z.array(z.string()),
  position: z.object({
    from: z.number(),
    to: z.number()
  }).optional()
})

// Legal clause validation patterns
export const LEGAL_PATTERNS = {
  parties: /\b(party|parties|client|contractor|service provider|company)\b/gi,
  dates: /\b(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
  signatures: /\b(signature|signed|executed|witness|notary)\b/gi,
  governingLaw: /\b(governing law|jurisdiction|courts of|state of|laws of)\b/gi,
  liability: /\b(liability|damages|indemnify|indemnification|limitation|cap)\b/gi,
  termination: /\b(termination|terminate|end|expiry|breach)\b/gi,
  confidentiality: /\b(confidential|non-disclosure|proprietary|trade secret)\b/gi,
  payment: /\b(payment|invoice|fee|compensation|remuneration|\$|USD|EUR|GBP)\b/gi
}

// Contract validation rules
export class ContractValidator {
  
  static validateDocument(content: string): {
    isValid: boolean
    score: number
    errors: string[]
    warnings: string[]
    suggestions: string[]
    elements: z.infer<typeof ContractElementSchema>[]
  } {
    const elements = this.extractElements(content)
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check required elements
    const hasTitle = this.hasElement(elements, 'title')
    const hasParties = this.hasElement(elements, 'party') || this.matchesPattern(content, LEGAL_PATTERNS.parties)
    const hasDate = this.hasElement(elements, 'date') || this.matchesPattern(content, LEGAL_PATTERNS.dates)
    const hasSignature = this.hasElement(elements, 'signature') || this.matchesPattern(content, LEGAL_PATTERNS.signatures)
    const hasGoverningLaw = this.hasElement(elements, 'governing_law') || this.matchesPattern(content, LEGAL_PATTERNS.governingLaw)
    
    // Validate word count
    const wordCount = content.trim().split(/\s+/).length
    if (wordCount < 100) {
      errors.push(`Document too short: ${wordCount} words (minimum 100 required)`)
    }
    
    // Check required elements
    if (!hasTitle) errors.push("Missing document title")
    if (!hasParties) errors.push("Missing party identification")
    if (!hasDate) warnings.push("No effective date specified")
    if (!hasSignature) warnings.push("No signature blocks found")
    if (!hasGoverningLaw) warnings.push("Governing law not specified")
    
    // Check for essential clauses
    const hasLiability = this.matchesPattern(content, LEGAL_PATTERNS.liability)
    const hasTermination = this.matchesPattern(content, LEGAL_PATTERNS.termination)
    const hasPayment = this.matchesPattern(content, LEGAL_PATTERNS.payment)
    
    if (!hasLiability) suggestions.push("Consider adding liability limitation clause")
    if (!hasTermination) suggestions.push("Consider adding termination clause")
    if (!hasPayment) suggestions.push("Consider specifying payment terms")
    
    // Calculate validation score
    const score = this.calculateScore({
      hasTitle, hasParties, hasDate, hasSignature, hasGoverningLaw,
      hasLiability, hasTermination, hasPayment, wordCount
    })
    
    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
      elements
    }
  }
  
  private static extractElements(content: string): z.infer<typeof ContractElementSchema>[] {
    const elements: z.infer<typeof ContractElementSchema>[] = []
    
    // Extract titles (headings)
    const titleMatches = content.match(/^#+\s*(.+)$/gm)
    titleMatches?.forEach(match => {
      elements.push({
        type: 'title',
        content: match,
        isRequired: true,
        isValid: match.length > 5,
        validationErrors: match.length <= 5 ? ['Title too short'] : []
      })
    })
    
    // Extract dates
    const dateMatches = content.match(LEGAL_PATTERNS.dates)
    dateMatches?.forEach(match => {
      elements.push({
        type: 'date',
        content: match,
        isRequired: true,
        isValid: this.isValidDate(match),
        validationErrors: !this.isValidDate(match) ? ['Invalid date format'] : []
      })
    })
    
    return elements
  }
  
  private static hasElement(elements: z.infer<typeof ContractElementSchema>[], type: string): boolean {
    return elements.some(el => el.type === type && el.isValid)
  }
  
  private static matchesPattern(content: string, pattern: RegExp): boolean {
    return pattern.test(content)
  }
  
  private static isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr)
    return !isNaN(date.getTime())
  }
  
  private static calculateScore(checks: Record<string, boolean | number>): number {
    let score = 0
    const maxScore = 100
    
    // Required elements (60 points)
    if (checks.hasTitle) score += 10
    if (checks.hasParties) score += 15
    if (checks.hasDate) score += 10
    if (checks.hasSignature) score += 15
    if (checks.hasGoverningLaw) score += 10
    
    // Optional but recommended (30 points)
    if (checks.hasLiability) score += 10
    if (checks.hasTermination) score += 10
    if (checks.hasPayment) score += 10
    
    // Word count bonus (10 points)
    if (typeof checks.wordCount === 'number' && checks.wordCount >= 100) {
      score += Math.min(10, Math.floor((checks.wordCount - 100) / 50))
    }
    
    return Math.min(score, maxScore)
  }
}

// TipTap Extension for Real-time Validation
export const ContractValidationExtension = Extension.create({
  name: 'contractValidation',
  
  addOptions() {
    return {
      enableRealTimeValidation: true,
      validationDelay: 1000, // 1 second delay
      showInlineErrors: true,
      autoCorrectSuggestions: true
    }
  },
  
  addStorage() {
    return {
      validationResults: null,
      lastValidation: 0,
      validationTimer: null
    }
  },
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('contractValidation'),
        
        state: {
          init: () => ({
            validationResults: null,
            decorations: []
          }),
          
          apply: (_tr, value) => {
            // Trigger validation on document changes would be handled elsewhere
            return value
          }
        },
        
        props: {
          decorations: () => null
        }
      })
    ]
  },
  
  addCommands() {
    return {
      validateDocument: () => ({ editor }) => {
        const content = editor.getText()
        const validation = ContractValidator.validateDocument(content)
        
        // Store validation results
        this.storage.validationResults = validation
        
        // Trigger validation event
        editor.emit('validation:complete', validation)
        
        return true
      },
      
      fixValidationIssue: (type: string) => ({ commands }) => {
        switch (type) {
          case 'add_title':
            return commands.insertContent('# Contract Title\n\n')
          case 'add_parties':
            return commands.insertContent('\n**Parties:**\n- Party 1: [Name]\n- Party 2: [Name]\n\n')
          case 'add_date':
            return commands.insertContent(`\n**Effective Date:** ${new Date().toLocaleDateString()}\n\n`)
          case 'add_signatures':
            return commands.insertContent('\n**Signatures:**\n\nParty 1: _______________________  Date: _______\n\nParty 2: _______________________  Date: _______\n')
          default:
            return false
        }
      }
    }
  },
  
  onCreate() {
    // Set up periodic validation
    if (this.options.enableRealTimeValidation) {
      this.triggerValidation()
    }
  },
  
  triggerValidation() {
    // Debounce validation
    if (this.storage.validationTimer) {
      clearTimeout(this.storage.validationTimer)
    }
    
    this.storage.validationTimer = setTimeout(() => {
      if (this.editor) {
        this.editor.commands.validateDocument()
      }
    }, this.options.validationDelay)
  }
})

import { useState, useEffect, useCallback } from 'react'

// React Hook for Contract Validation
export const useContractValidation = (editor: any) => {
  const [validationResults, setValidationResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  
  useEffect(() => {
    if (!editor) return
    
    const handleValidation = (results: any) => {
      setValidationResults(results)
      setIsValidating(false)
    }
    
    const handleValidationStart = () => {
      setIsValidating(true)
    }
    
    editor.on('validation:complete', handleValidation)
    editor.on('validation:start', handleValidationStart)
    
    return () => {
      editor.off('validation:complete', handleValidation)
      editor.off('validation:start', handleValidationStart)
    }
  }, [editor])
  
  const validateNow = useCallback(() => {
    if (editor) {
      editor.commands.validateDocument()
    }
  }, [editor])
  
  const fixIssue = useCallback((issueType: string) => {
    if (editor) {
      editor.commands.fixValidationIssue(issueType)
    }
  }, [editor])
  
  return {
    validationResults,
    isValidating,
    validateNow,
    fixIssue
  }
}

export type ContractElement = z.infer<typeof ContractElementSchema>
export type LegalDocumentValidation = z.infer<typeof LegalDocumentValidationSchema>