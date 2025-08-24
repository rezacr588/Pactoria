export const defaultContractTemplate = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        {
          type: 'text',
          text: 'SERVICE AGREEMENT',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This Service Agreement ("Agreement") is entered into as of [DATE] ("Effective Date") by and between:'
        }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: 'PARTIES',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'CLIENT: [Client Name]',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Address: [Client Address]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Email: [Client Email]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '("Client")' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'SERVICE PROVIDER: [Provider Name]',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Address: [Provider Address]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Email: [Provider Email]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '("Service Provider")' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Collectively referred to as the "Parties" and individually as a "Party".' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: 'RECITALS',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'WHEREAS, the Client desires to retain the Service Provider to perform certain services; and' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'WHEREAS, the Service Provider has the qualifications, experience, and abilities to provide services to the Client; and' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'WHEREAS, the Service Provider is willing to provide such services to the Client on the terms set forth below.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '1. SERVICES',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '1.1 ' },
        {
          type: 'text',
          text: 'Scope of Services.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' The Service Provider shall provide the following services to the Client ("Services"):' }
      ]
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '[Service Description 1]' }
              ]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '[Service Description 2]' }
              ]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '[Service Description 3]' }
              ]
            }
          ]
        }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '1.2 ' },
        {
          type: 'text',
          text: 'Performance Standards.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' The Service Provider shall perform the Services in accordance with the highest professional standards and in compliance with all applicable laws and regulations.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '2. TERM',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '2.1 This Agreement shall commence on the Effective Date and shall continue for a period of [DURATION] unless earlier terminated in accordance with Section 7 of this Agreement ("Term").' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '3. COMPENSATION',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '3.1 ' },
        {
          type: 'text',
          text: 'Fees.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' In consideration for the Services, the Client shall pay the Service Provider [AMOUNT] per [TIME PERIOD].' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '3.2 ' },
        {
          type: 'text',
          text: 'Payment Terms.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' Payment shall be due within [NUMBER] days of receipt of invoice. Late payments shall accrue interest at the rate of [RATE]% per month.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '3.3 ' },
        {
          type: 'text',
          text: 'Expenses.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' The Client shall reimburse the Service Provider for all reasonable and pre-approved out-of-pocket expenses incurred in connection with the performance of the Services.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '4. CONFIDENTIALITY',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '4.1 ' },
        {
          type: 'text',
          text: 'Confidential Information.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' Each Party acknowledges that it may have access to confidential and proprietary information of the other Party ("Confidential Information"). Each Party agrees to maintain the confidentiality of all Confidential Information and not to disclose it to any third party without the prior written consent of the disclosing Party.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '4.2 ' },
        {
          type: 'text',
          text: 'Exceptions.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' The obligations set forth in Section 4.1 shall not apply to information that: (a) is or becomes publicly available through no breach of this Agreement; (b) is rightfully received from a third party without breach of any confidentiality obligation; or (c) is required to be disclosed by law or court order.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '5. INTELLECTUAL PROPERTY',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '5.1 ' },
        {
          type: 'text',
          text: 'Work Product.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' All work product, deliverables, and intellectual property created by the Service Provider in the performance of the Services shall be the exclusive property of the Client.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '6. WARRANTIES AND REPRESENTATIONS',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '6.1 ' },
        {
          type: 'text',
          text: 'Mutual Warranties.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' Each Party represents and warrants that: (a) it has full corporate right, power, and authority to enter into this Agreement; (b) the execution of this Agreement has been duly authorized; and (c) this Agreement constitutes a valid and binding agreement enforceable in accordance with its terms.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '6.2 ' },
        {
          type: 'text',
          text: 'Service Provider Warranties.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' The Service Provider represents and warrants that: (a) the Services will be performed in a professional and workmanlike manner; and (b) the Service Provider has the necessary skills, experience, and qualifications to perform the Services.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '7. TERMINATION',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '7.1 ' },
        {
          type: 'text',
          text: 'Termination for Convenience.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' Either Party may terminate this Agreement at any time upon [NUMBER] days\' written notice to the other Party.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '7.2 ' },
        {
          type: 'text',
          text: 'Termination for Cause.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' Either Party may terminate this Agreement immediately upon written notice if the other Party: (a) materially breaches this Agreement and fails to cure such breach within [NUMBER] days after written notice; or (b) becomes insolvent or makes an assignment for the benefit of creditors.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '8. INDEMNIFICATION',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '8.1 Each Party shall indemnify, defend, and hold harmless the other Party and its officers, directors, employees, and agents from and against any and all claims, losses, damages, liabilities, and expenses (including reasonable attorneys\' fees) arising out of or resulting from any breach of this Agreement or any negligent or wrongful act or omission of the indemnifying Party.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '9. LIMITATION OF LIABILITY',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '9.1 IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE FORM OF ACTION OR THE BASIS OF THE CLAIM, EVEN IF THE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: '10. GENERAL PROVISIONS',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '10.1 ' },
        {
          type: 'text',
          text: 'Governing Law.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' This Agreement shall be governed by and construed in accordance with the laws of [JURISDICTION], without regard to its conflict of laws provisions.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '10.2 ' },
        {
          type: 'text',
          text: 'Dispute Resolution.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' Any dispute arising out of or relating to this Agreement shall be resolved through binding arbitration in accordance with the rules of [ARBITRATION BODY].' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '10.3 ' },
        {
          type: 'text',
          text: 'Entire Agreement.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements and understandings.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '10.4 ' },
        {
          type: 'text',
          text: 'Amendment.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' This Agreement may only be amended or modified by a written instrument signed by both Parties.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '10.5 ' },
        {
          type: 'text',
          text: 'Severability.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '10.6 ' },
        {
          type: 'text',
          text: 'Notices.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' All notices under this Agreement shall be in writing and shall be deemed given when delivered personally, sent by email (with confirmation of receipt), or sent by certified mail, return receipt requested, to the addresses set forth above.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '10.7 ' },
        {
          type: 'text',
          text: 'Counterparts.',
          marks: [{ type: 'bold' }]
        },
        { type: 'text', text: ' This Agreement may be executed in counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        {
          type: 'text',
          text: 'SIGNATURES',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'CLIENT:',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '_______________________________' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Name: [Client Signatory Name]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Title: [Client Signatory Title]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Date: _____________' }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'SERVICE PROVIDER:',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: []
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '_______________________________' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Name: [Provider Signatory Name]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Title: [Provider Signatory Title]' }
      ]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Date: _____________' }
      ]
    }
  ]
}

export const ndaTemplate = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        {
          type: 'text',
          text: 'NON-DISCLOSURE AGREEMENT',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] by and between [PARTY A] and [PARTY B].'
        }
      ]
    }
    // Additional NDA content...
  ]
}

export const employmentTemplate = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        {
          type: 'text',
          text: 'EMPLOYMENT AGREEMENT',
          marks: [{ type: 'bold' }]
        }
      ]
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This Employment Agreement ("Agreement") is made as of [DATE] between [EMPLOYER NAME] ("Employer") and [EMPLOYEE NAME] ("Employee").'
        }
      ]
    }
    // Additional employment content...
  ]
}

export function getTemplateByType(type: string) {
  switch (type) {
    case 'nda':
      return ndaTemplate
    case 'employment':
      return employmentTemplate
    case 'service':
    default:
      return defaultContractTemplate
  }
}