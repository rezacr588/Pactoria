import { Extension, Mark } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// Contract Clause Extension - for managing reusable contract clauses
export const ContractClause = Extension.create({
  name: 'contractClause',
  
  addOptions() {
    return {
      clauseLibrary: [],
      onClauseInsert: () => {},
    }
  },

  addCommands() {
    return {
      insertClause: (clauseId: string) => ({ commands }) => {
        const clause = this.options.clauseLibrary.find((c: any) => c.id === clauseId)
        if (clause) {
          this.options.onClauseInsert(clause)
          return commands.insertContent(clause.content)
        }
        return false
      },
    }
  },
})

// Redline Mark - for tracking changes (additions and deletions)
export const Redline = Mark.create({
  name: 'redline',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      type: {
        default: 'addition', // 'addition' or 'deletion'
      },
      author: {
        default: null,
      },
      timestamp: {
        default: Date.now(),
      },
      comment: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-redline]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { type, author, timestamp, comment } = HTMLAttributes
    const className = type === 'deletion' 
      ? 'line-through text-red-600 bg-red-50' 
      : 'bg-green-50 text-green-800 underline decoration-green-600'
    
    return [
      'span',
      {
        'data-redline': type,
        'data-author': author,
        'data-timestamp': timestamp,
        'data-comment': comment,
        'class': className,
        'title': `${type === 'deletion' ? 'Deleted' : 'Added'} by ${author || 'Unknown'}`,
      },
      0,
    ]
  },

  addCommands() {
    return {
      toggleRedline: (attributes: { type: 'addition' | 'deletion'; author?: string; comment?: string }) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes)
      },
      acceptRedline: () => ({ commands, editor }) => {
        const { from, to } = editor.state.selection
        const marks = editor.state.doc.slice(from, to).content.marks
        
        marks.forEach(mark => {
          if (mark.type.name === 'redline') {
            if (mark.attrs.type === 'deletion') {
              // Remove text with deletion mark
              commands.deleteRange({ from, to })
            } else {
              // Keep text and remove addition mark
              commands.unsetMark('redline', { from, to })
            }
          }
        })
        
        return true
      },
      rejectRedline: () => ({ commands, editor }) => {
        const { from, to } = editor.state.selection
        const marks = editor.state.doc.slice(from, to).content.marks
        
        marks.forEach(mark => {
          if (mark.type.name === 'redline') {
            if (mark.attrs.type === 'addition') {
              // Remove text with addition mark
              commands.deleteRange({ from, to })
            } else {
              // Keep text and remove deletion mark
              commands.unsetMark('redline', { from, to })
            }
          }
        })
        
        return true
      },
    }
  },
})

// Legal Section Extension - for structured contract sections
export const LegalSection = Extension.create({
  name: 'legalSection',

  addOptions() {
    return {
      sections: [
        'Preamble',
        'Recitals',
        'Definitions',
        'Terms and Conditions',
        'Warranties and Representations',
        'Indemnification',
        'Confidentiality',
        'Termination',
        'Dispute Resolution',
        'General Provisions',
        'Signatures',
      ],
    }
  },

  addCommands() {
    return {
      insertSection: (sectionType: string) => ({ commands }) => {
        const template = this.getSectionTemplate(sectionType)
        return commands.insertContent(template)
      },
    }
  },

  getSectionTemplate(sectionType: string) {
    const templates: Record<string, string> = {
      'Preamble': `<h2>${sectionType}</h2><p>This Agreement is entered into as of [DATE], by and between [PARTY A] and [PARTY B].</p>`,
      'Recitals': `<h2>${sectionType}</h2><p>WHEREAS, [PARTY A] desires to [PURPOSE];</p><p>WHEREAS, [PARTY B] has the capability to [CAPABILITY];</p><p>NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth, the parties agree as follows:</p>`,
      'Definitions': `<h2>${sectionType}</h2><p><strong>"Agreement"</strong> means this [CONTRACT TYPE] agreement.</p><p><strong>"Effective Date"</strong> means [DATE].</p>`,
      'Terms and Conditions': `<h2>${sectionType}</h2><ol><li>[Term 1]</li><li>[Term 2]</li><li>[Term 3]</li></ol>`,
      'Warranties and Representations': `<h2>${sectionType}</h2><p>Each party represents and warrants that:</p><ol><li>It has full power and authority to enter into this Agreement;</li><li>This Agreement constitutes a legal, valid, and binding obligation;</li></ol>`,
      'Indemnification': `<h2>${sectionType}</h2><p>Each party shall indemnify, defend, and hold harmless the other party from and against any claims, damages, losses, and expenses arising out of or resulting from [INDEMNIFICATION SCOPE].</p>`,
      'Confidentiality': `<h2>${sectionType}</h2><p>The parties acknowledge that they may have access to confidential information. Each party agrees to maintain the confidentiality of such information and not to disclose it to third parties without prior written consent.</p>`,
      'Termination': `<h2>${sectionType}</h2><p>This Agreement may be terminated:</p><ol><li>By mutual written consent of both parties;</li><li>By either party upon [NUMBER] days written notice;</li><li>Immediately upon material breach by the other party.</li></ol>`,
      'Dispute Resolution': `<h2>${sectionType}</h2><p>Any dispute arising out of or relating to this Agreement shall be resolved through [ARBITRATION/MEDIATION/LITIGATION] in [JURISDICTION].</p>`,
      'General Provisions': `<h2>${sectionType}</h2><p><strong>Governing Law:</strong> This Agreement shall be governed by the laws of [JURISDICTION].</p><p><strong>Entire Agreement:</strong> This Agreement constitutes the entire agreement between the parties.</p>`,
      'Signatures': `<h2>${sectionType}</h2><div class="signature-block"><p>[PARTY A NAME]</p><p>By: _______________________</p><p>Name: [NAME]</p><p>Title: [TITLE]</p><p>Date: [DATE]</p></div>`,
    }
    
    return templates[sectionType] || `<h2>${sectionType}</h2><p>[Content for ${sectionType}]</p>`
  },
})

// Contract Variable Extension - for smart fields that can be auto-populated
export const ContractVariable = Mark.create({
  name: 'contractVariable',

  addOptions() {
    return {
      HTMLAttributes: {},
      variables: {},
    }
  },

  addAttributes() {
    return {
      variableName: {
        default: null,
      },
      variableType: {
        default: 'text', // text, date, number, party, currency
      },
      required: {
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { variableName, variableType, required } = HTMLAttributes
    const value = this.options.variables[variableName] || `[${variableName}]`
    const className = required && !this.options.variables[variableName]
      ? 'bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-300'
      : 'bg-blue-50 text-blue-700 px-1 rounded'
    
    return [
      'span',
      {
        'data-variable': variableName,
        'data-variable-type': variableType,
        'data-required': required,
        'class': className,
        'contenteditable': 'false',
      },
      value,
    ]
  },

  addCommands() {
    return {
      insertVariable: (variableName: string, variableType = 'text', required = false) => ({ commands }) => {
        return commands.insertContent({
          type: 'text',
          marks: [
            {
              type: this.name,
              attrs: { variableName, variableType, required },
            },
          ],
          text: `[${variableName}]`,
        })
      },
      updateVariable: (variableName: string, value: any) => ({ editor }) => {
        this.options.variables[variableName] = value
        editor.view.updateState(editor.state)
        return true
      },
      updateAllVariables: (variables: Record<string, any>) => ({ editor }) => {
        this.options.variables = { ...this.options.variables, ...variables }
        editor.view.updateState(editor.state)
        return true
      },
    }
  },
})

// Comment Thread Extension - for legal negotiations
export const CommentThread = Extension.create({
  name: 'commentThread',

  addOptions() {
    return {
      onCommentAdd: () => {},
      onCommentResolve: () => {},
      comments: [],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          commentThreadId: {
            default: null,
            renderHTML: attributes => {
              if (!attributes.commentThreadId) {
                return {}
              }
              return {
                'data-comment-thread-id': attributes.commentThreadId,
                'class': 'has-comment-thread bg-yellow-50 border-l-4 border-yellow-400 pl-2',
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      addCommentThread: (comment: string) => ({ editor, commands }) => {
        const threadId = `thread-${Date.now()}`
        const { from, to } = editor.state.selection
        
        this.options.onCommentAdd({
          id: threadId,
          comment,
          from,
          to,
          timestamp: Date.now(),
          resolved: false,
        })
        
        return commands.updateAttributes('paragraph', { commentThreadId: threadId })
      },
      resolveCommentThread: (threadId: string) => ({ commands }) => {
        this.options.onCommentResolve(threadId)
        return commands.updateAttributes('paragraph', { commentThreadId: null })
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('commentHighlight'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = []
            
            this.options.comments.forEach((comment: any) => {
              if (!comment.resolved) {
                decorations.push(
                  Decoration.inline(
                    comment.from,
                    comment.to,
                    { class: 'bg-yellow-100' },
                    { id: comment.id }
                  )
                )
              }
            })
            
            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

// Version Comparison Extension
export const VersionComparison = Extension.create({
  name: 'versionComparison',

  addOptions() {
    return {
      oldVersion: null,
      newVersion: null,
      showDiff: false,
    }
  },

  addCommands() {
    return {
      enableVersionComparison: (oldVersion: any, newVersion: any) => ({ editor }) => {
        this.options.oldVersion = oldVersion
        this.options.newVersion = newVersion
        this.options.showDiff = true
        editor.view.updateState(editor.state)
        return true
      },
      disableVersionComparison: () => ({ editor }) => {
        this.options.showDiff = false
        editor.view.updateState(editor.state)
        return true
      },
    }
  },
})

// Export all extensions as a bundle
export const ContractExtensions = [
  ContractClause,
  Redline,
  LegalSection,
  ContractVariable,
  CommentThread,
  VersionComparison,
]