import { describe, it, expect } from 'vitest'
import { isJWT } from '../lib/utils'

describe('isJWT', () => {
  it('should return true for a valid JWT', () => {
    const validJWT =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    expect(isJWT(validJWT)).toBe(true)
  })

  it('should return false for an invalid JWT (wrong number of parts)', () => {
    const invalidJWT = 'abc.def'
    expect(isJWT(invalidJWT)).toBe(false)
  })

  it('should return false for an invalid JWT (not base64url)', () => {
    const invalidJWT = 'abc.def.ghi!'
    expect(isJWT(invalidJWT)).toBe(false)
  })

  it('should return false for an invalid JWT (not JSON)', () => {
    const invalidJWT = 'abc.def.ghi'
    const header = Buffer.from('not json', 'utf8').toString('base64url')
    const payload = Buffer.from('not json', 'utf8').toString('base64url')
    const signature = 'signature'
    const brokenJwt = `${header}.${payload}.${signature}`

    expect(isJWT(invalidJWT)).toBe(false)
    expect(isJWT(brokenJwt)).toBe(false)
  })

  it('should return false for a non-string input', () => {
    expect(isJWT(123 as never)).toBe(false)
    expect(isJWT({} as never)).toBe(false)
    expect(isJWT(null as never)).toBe(false)
    expect(isJWT(undefined as never)).toBe(false)
  })
})
