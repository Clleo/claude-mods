import { test, expect } from 'claude-code/testing'
import { fmtTokens, minLeft, msLeft, shouldWarn, TTL_MIN } from './lib'

test('countdown math', async () => {
  expect(msLeft(null, 5)).toBe(null)
  expect(msLeft(0, 60_000)).toBe(TTL_MIN * 60_000 - 60_000)
  expect(minLeft(61_000)).toBe(2)
  expect(minLeft(-5)).toBe(0)
  expect(fmtTokens(950)).toBe('950')
  expect(fmtTokens(12_340)).toBe('12.3k')
  expect(fmtTokens(250_000)).toBe('250k')
})

test('warns once inside the last 5 minutes', async () => {
  expect(shouldWarn(4 * 60_000, null, 1)).toBe(true)
  expect(shouldWarn(4 * 60_000, 1, 1)).toBe(false)
  expect(shouldWarn(20 * 60_000, null, 1)).toBe(false)
  expect(shouldWarn(0, null, 1)).toBe(false)
})
