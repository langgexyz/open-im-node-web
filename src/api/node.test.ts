import { test, expect, vi, beforeEach } from 'vitest'
import { exchangeToken } from './node'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => mockFetch.mockReset())

test('exchangeToken 向 /auth/exchange POST app_token', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      openim_token: 'oim-tok',
      openim_api_addr: 'http://api.test',
      openim_ws_addr: 'ws://ws.test',
      user_id: '42',
      group_id: '0',
    }),
  })
  const res = await exchangeToken('app-tok-123')
  expect(mockFetch).toHaveBeenCalledWith('/auth/exchange', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ app_token: 'app-tok-123' }),
  }))
  expect(res.openim_token).toBe('oim-tok')
  expect(res.openim_ws_addr).toBe('ws://ws.test')
  expect(res.user_id).toBe('42')
  expect(res.group_id).toBe('0')
})

test('非 200 响应抛出错误', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) })
  await expect(exchangeToken('bad-tok')).rejects.toThrow()
})
