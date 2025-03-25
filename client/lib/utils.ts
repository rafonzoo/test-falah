import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isJWT(token: string): boolean {
  if (typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  try {
    // Basic Base64 URL decoding check. Avoid using atob directly as it can throw errors.
    const [header, payload, signature] = parts
    const base64UrlRegex = /^[\w\-+/]*$/

    if (
      !base64UrlRegex.test(header) ||
      !base64UrlRegex.test(payload) ||
      !base64UrlRegex.test(signature)
    ) {
      return false
    }

    // Optional: Basic JSON parsing check of header and payload.
    // It is not strictly required by the JWT spec.
    try {
      JSON.parse(Buffer.from(header, 'base64url').toString('utf-8'))
      JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Header or payload is not valid JSON after base64url decoding.
      return false
    }

    // OK
    return true

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false
  }
}
