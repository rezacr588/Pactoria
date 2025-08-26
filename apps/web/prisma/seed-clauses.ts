import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedClauses() {
  console.log('🌱 Seeding clause library...')

  // Sample clauses for the clause library
  const clauses = [
    {
      title: 'Force Majeure (Standard)',
      category: 'General Provisions',
      content: 'Neither party shall be liable for any failure or delay in performing their obligations under this Agreement if such failure or delay results from circumstances beyond the reasonable control of that party, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials. The party affected by such force majeure event shall promptly notify the other party and shall use commercially reasonable efforts to mitigate the effects of such force majeure event.',
      content_html: '<p><strong>Force Majeure.</strong> Neither party shall be liable for any failure or delay in performing their obligations under this Agreement if such failure or delay results from circumstances beyond the reasonable control of that party, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials. The party affected by such force majeure event shall promptly notify the other party and shall use commercially reasonable efforts to mitigate the effects of such force majeure event.</p>',
      description: 'Standard force majeure clause providing relief from liability for unforeseeable events',
      tags: ['force majeure', 'liability', 'standard'],
      risk_level: 'low',
      jurisdiction: 'General',
      created_by: '00000000-0000-0000-0000-000000000000', // placeholder
      is_public: true,
      is_official: true,
    },
    {
      title: 'Mutual Confidentiality',
      category: 'Confidentiality',
      content: 'Each party acknowledges that it may have access to certain confidential information of the other party. Each party agrees that it shall not disclose to any third parties, or use for any purpose other than the performance of this Agreement, any confidential information of the other party. "Confidential Information" shall mean all non-public, proprietary, or confidential information disclosed by one party to the other, whether orally, in writing, or in any other form, including but not limited to technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.',
      content_html: '<p><strong>Confidentiality.</strong> Each party acknowledges that it may have access to certain confidential information of the other party. Each party agrees that it shall not disclose to any third parties, or use for any purpose other than the performance of this Agreement, any confidential information of the other party. "Confidential Information" shall mean all non-public, proprietary, or confidential information disclosed by one party to the other, whether orally, in writing, or in any other form, including but not limited to technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.</p>',
      description: 'Mutual confidentiality obligations for both parties',
      tags: ['confidentiality', 'mutual', 'NDA'],
      risk_level: 'medium',
      jurisdiction: 'General',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_public: true,
      is_official: true,
    },
    {
      title: 'Limitation of Liability (Cap)',
      category: 'Liability',
      content: 'IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES. THE AGGREGATE LIABILITY OF EACH PARTY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY CLIENT TO PROVIDER IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.',
      content_html: '<p><strong>Limitation of Liability.</strong> IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES. THE AGGREGATE LIABILITY OF EACH PARTY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY CLIENT TO PROVIDER IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.</p>',
      description: 'Limits liability to direct damages with cap on total liability',
      tags: ['liability', 'limitation', 'damages', 'cap'],
      risk_level: 'high',
      jurisdiction: 'US',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_public: true,
      is_official: true,
    },
    {
      title: 'Mutual Indemnification',
      category: 'Indemnification',
      content: 'Each party shall indemnify, defend, and hold harmless the other party and its officers, directors, employees, agents, and representatives from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys\' fees) arising out of or resulting from: (a) any breach of this Agreement by the indemnifying party; (b) any negligent or wrongful act or omission of the indemnifying party; (c) any violation of applicable law by the indemnifying party; or (d) any third-party claim arising from the indemnifying party\'s performance under this Agreement.',
      content_html: '<p><strong>Indemnification.</strong> Each party shall indemnify, defend, and hold harmless the other party and its officers, directors, employees, agents, and representatives from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys\' fees) arising out of or resulting from: (a) any breach of this Agreement by the indemnifying party; (b) any negligent or wrongful act or omission of the indemnifying party; (c) any violation of applicable law by the indemnifying party; or (d) any third-party claim arising from the indemnifying party\'s performance under this Agreement.</p>',
      description: 'Mutual indemnification obligations for both parties',
      tags: ['indemnification', 'mutual', 'defense'],
      risk_level: 'medium',
      jurisdiction: 'General',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_public: true,
      is_official: true,
    },
    {
      title: 'Binding Arbitration (AAA)',
      category: 'Dispute Resolution',
      content: 'Any dispute, claim, or controversy arising out of or relating to this Agreement or the breach, termination, enforcement, interpretation, or validity thereof, including the determination of the scope or applicability of this agreement to arbitrate, shall be determined by arbitration before one arbitrator. The arbitration shall be administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules. Judgment on the award may be entered in any court having jurisdiction. This clause shall not preclude parties from seeking provisional remedies in aid of arbitration from a court of appropriate jurisdiction.',
      content_html: '<p><strong>Arbitration.</strong> Any dispute, claim, or controversy arising out of or relating to this Agreement or the breach, termination, enforcement, interpretation, or validity thereof, including the determination of the scope or applicability of this agreement to arbitrate, shall be determined by arbitration before one arbitrator. The arbitration shall be administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules. Judgment on the award may be entered in any court having jurisdiction. This clause shall not preclude parties from seeking provisional remedies in aid of arbitration from a court of appropriate jurisdiction.</p>',
      description: 'Binding arbitration clause with AAA rules',
      tags: ['arbitration', 'dispute resolution', 'AAA'],
      risk_level: 'medium',
      jurisdiction: 'US',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_public: true,
      is_official: true,
    },
    {
      title: 'Termination for Convenience',
      category: 'Termination',
      content: 'Either party may terminate this Agreement at any time, with or without cause, upon thirty (30) days written notice to the other party. Upon termination, each party shall promptly return or destroy all confidential information of the other party and all rights and obligations of the parties shall cease, except for those provisions that by their nature should survive termination.',
      content_html: '<p><strong>Termination for Convenience.</strong> Either party may terminate this Agreement at any time, with or without cause, upon thirty (30) days written notice to the other party. Upon termination, each party shall promptly return or destroy all confidential information of the other party and all rights and obligations of the parties shall cease, except for those provisions that by their nature should survive termination.</p>',
      description: 'Allows either party to terminate the agreement with notice',
      tags: ['termination', 'convenience', 'notice'],
      risk_level: 'medium',
      jurisdiction: 'General',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_public: true,
      is_official: true,
    },
    {
      title: 'Governing Law (Delaware)',
      category: 'General Provisions',
      content: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles. Any legal action or proceeding arising under this Agreement shall be brought exclusively in the courts of Delaware, and the parties hereby consent to personal jurisdiction and venue therein.',
      content_html: '<p><strong>Governing Law.</strong> This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles. Any legal action or proceeding arising under this Agreement shall be brought exclusively in the courts of Delaware, and the parties hereby consent to personal jurisdiction and venue therein.</p>',
      description: 'Establishes Delaware law as governing law with Delaware courts having jurisdiction',
      tags: ['governing law', 'jurisdiction', 'Delaware'],
      risk_level: 'low',
      jurisdiction: 'Delaware',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_public: true,
      is_official: true,
    },
    {
      title: 'Data Protection (GDPR)',
      category: 'Privacy',
      content: 'Each party acknowledges that it may process personal data in connection with this Agreement. Each party agrees to comply with all applicable data protection laws, including the General Data Protection Regulation (GDPR) where applicable. Each party shall implement appropriate technical and organizational measures to ensure the security of personal data and shall not transfer personal data outside the European Economic Area without adequate safeguards.',
      content_html: '<p><strong>Data Protection.</strong> Each party acknowledges that it may process personal data in connection with this Agreement. Each party agrees to comply with all applicable data protection laws, including the General Data Protection Regulation (GDPR) where applicable. Each party shall implement appropriate technical and organizational measures to ensure the security of personal data and shall not transfer personal data outside the European Economic Area without adequate safeguards.</p>',
      description: 'GDPR-compliant data protection clause for European contracts',
      tags: ['GDPR', 'data protection', 'privacy', 'EU'],
      risk_level: 'high',
      jurisdiction: 'EU',
      created_by: '00000000-0000-0000-0000-000000000000',
      is_public: true,
      is_official: true,
    },
  ]

  // Legal sections
  const legalSections = [
    {
      section_name: 'Preamble',
      section_type: 'preamble',
      content_template: '<h2>Preamble</h2><p>This Agreement is entered into as of [DATE], by and between [PARTY_A], a [ENTITY_TYPE] ([PARTY_A_SHORT]) and [PARTY_B], a [ENTITY_TYPE] ([PARTY_B_SHORT]).</p>',
      description: 'Standard preamble section identifying the parties and agreement date',
      order_index: 1,
    },
    {
      section_name: 'Recitals',
      section_type: 'recitals',
      content_template: '<h2>Recitals</h2><p>WHEREAS, [PARTY_A_SHORT] desires to [PURPOSE];</p><p>WHEREAS, [PARTY_B_SHORT] has the capability and expertise to [CAPABILITY];</p><p>NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth, the parties agree as follows:</p>',
      description: 'Standard recitals section explaining the background and purpose',
      order_index: 2,
    },
    {
      section_name: 'Definitions',
      section_type: 'definitions',
      content_template: '<h2>Definitions</h2><p>For purposes of this Agreement, the following terms shall have the meanings set forth below:</p><p><strong>"Agreement"</strong> means this [CONTRACT_TYPE] agreement, including all exhibits and amendments hereto.</p><p><strong>"Effective Date"</strong> means [DATE].</p><p><strong>"Services"</strong> means [SERVICE_DESCRIPTION].</p>',
      description: 'Standard definitions section for key terms',
      order_index: 3,
    },
    {
      section_name: 'Terms and Conditions',
      section_type: 'terms',
      content_template: '<h2>Terms and Conditions</h2><h3>1. Scope of Work</h3><p>[SCOPE_DESCRIPTION]</p><h3>2. Term</h3><p>This Agreement shall commence on the Effective Date and shall continue for a period of [TERM_LENGTH].</p><h3>3. Compensation</h3><p>[COMPENSATION_TERMS]</p>',
      description: 'Main terms and conditions section',
      order_index: 4,
    },
    {
      section_name: 'Warranties and Representations',
      section_type: 'warranties',
      content_template: '<h2>Warranties and Representations</h2><p>Each party represents and warrants to the other that:</p><ol><li>It has full power and authority to enter into this Agreement;</li><li>The execution of this Agreement has been duly authorized;</li><li>This Agreement constitutes a legal, valid, and binding obligation;</li><li>The performance of its obligations will not violate any other agreement to which it is bound.</li></ol>',
      description: 'Standard warranties and representations',
      order_index: 5,
    },
    {
      section_name: 'General Provisions',
      section_type: 'general',
      content_template: '<h2>General Provisions</h2><h3>Governing Law</h3><p>This Agreement shall be governed by the laws of [JURISDICTION].</p><h3>Entire Agreement</h3><p>This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.</p><h3>Amendment</h3><p>This Agreement may only be amended in writing signed by both parties.</p><h3>Severability</h3><p>If any provision of this Agreement is held invalid or unenforceable, the remainder shall continue in full force and effect.</p>',
      description: 'Standard general provisions including governing law and entire agreement',
      order_index: 6,
    },
    {
      section_name: 'Signatures',
      section_type: 'signatures',
      content_template: '<h2>Signatures</h2><div class="signature-block"><p><strong>[PARTY_A]</strong></p><br><p>By: _______________________</p><p>Name: [SIGNATORY_NAME]</p><p>Title: [SIGNATORY_TITLE]</p><p>Date: [DATE]</p></div><br><div class="signature-block"><p><strong>[PARTY_B]</strong></p><br><p>By: _______________________</p><p>Name: [SIGNATORY_NAME]</p><p>Title: [SIGNATORY_TITLE]</p><p>Date: [DATE]</p></div>',
      description: 'Standard signature blocks for both parties',
      order_index: 7,
    },
  ]

  try {
    // Create clauses
    console.log('Creating clause library entries...')
    for (const clause of clauses) {
      await prisma.clause_library.create({
        data: clause,
      })
    }

    // Create legal sections
    console.log('Creating legal section templates...')
    for (const section of legalSections) {
      await prisma.legal_sections.create({
        data: section,
      })
    }

    console.log('✅ Successfully seeded clause library and legal sections!')
  } catch (error) {
    console.error('❌ Error seeding clause library:', error)
    throw error
  }
}

async function main() {
  await seedClauses()
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedClauses }