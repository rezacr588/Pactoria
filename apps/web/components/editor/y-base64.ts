export function uint8ToBase64(uint8: Uint8Array): string {
  let binary = ''
  const len = uint8.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]!)
  }
  return btoa(binary)
}
