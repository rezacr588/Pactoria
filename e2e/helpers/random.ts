export function randomEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `test.${timestamp}.${random}@example.com`
}

export function randomPassword(): string {
  // Generate a password that meets typical requirements
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // Ensure it has at least one uppercase, lowercase, number, and special char
  return `Test${password}1!`
}

export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function randomTitle(): string {
  const adjectives = ['Important', 'Confidential', 'Standard', 'Custom', 'Draft']
  const nouns = ['Contract', 'Agreement', 'Document', 'Terms', 'NDA']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun} ${Date.now()}`
}
