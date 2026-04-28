/**
 * Web Crypto helpers for local at-rest encryption.
 */

const PBKDF2_ITERATIONS = 150000

export function getRandomBytes(length) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export async function deriveAesKey(passphrase, salt) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptString(plainText, key) {
  const iv = getRandomBytes(12)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plainText)
  )

  return JSON.stringify({
    v: 1,
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  })
}

export async function decryptString(payload, key) {
  const parsed = JSON.parse(payload)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(parsed.iv) },
    key,
    base64ToBytes(parsed.data)
  )

  return new TextDecoder().decode(decrypted)
}

export function isEncryptedPayload(value) {
  try {
    const parsed = JSON.parse(value)
    return parsed?.v === 1 && typeof parsed.iv === 'string' && typeof parsed.data === 'string'
  } catch {
    return false
  }
}

export function bytesToBase64(bytes) {
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

export function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
