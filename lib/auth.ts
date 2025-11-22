// Lightweight HMAC-signed session token utilities that work in Edge and Node runtimes.

const te = new TextEncoder()

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as any)
  }
  let b64: string
  if (typeof btoa === 'function') {
    b64 = btoa(bin)
  } else {
    // Node fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    b64 = require('buffer').Buffer.from(bin, 'binary').toString('base64')
  }
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlDecodeToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4)
  let bin: string
  if (typeof atob === 'function') {
    bin = atob(b64)
  } else {
    // Node fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    bin = require('buffer').Buffer.from(b64, 'base64').toString('binary')
  }
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    te.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, te.encode(message))
  return b64urlEncode(new Uint8Array(sig))
}

async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const key = await importHmacKey(secret)
  try {
    const sigBytes = b64urlDecodeToBytes(signature)
    const sigView = sigBytes.subarray(0)
    const sigBuf = (sigView.buffer as ArrayBuffer).slice(sigView.byteOffset, sigView.byteOffset + sigView.byteLength)
    const msgBytes = te.encode(message)
    const msgView = msgBytes.subarray(0)
    const msgBuf = (msgView.buffer as ArrayBuffer).slice(msgView.byteOffset, msgView.byteOffset + msgView.byteLength)
    return await crypto.subtle.verify('HMAC', key, sigBuf as ArrayBuffer, msgBuf as ArrayBuffer)
  } catch {
    return false
  }
}

export type SessionPayload = {
  sub: string
  iat: number
  exp: number
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const data = b64urlEncode(te.encode(JSON.stringify(payload)))
  const sig = await hmacSign(data, secret)
  return `${data}.${sig}`
}

export async function verifySession(token: string | undefined | null, secret: string): Promise<SessionPayload | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [data, sig] = parts
  const ok = await hmacVerify(data, sig, secret)
  if (!ok) return null
  try {
    const json = new TextDecoder().decode(b64urlDecodeToBytes(data))
    const payload = JSON.parse(json) as SessionPayload
    if (typeof payload.exp !== 'number' || Date.now() / 1000 >= payload.exp) return null
    return payload
  } catch {
    return null
  }
}
