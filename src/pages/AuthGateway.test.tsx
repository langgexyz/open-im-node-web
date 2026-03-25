import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import AuthGateway from './AuthGateway'
import * as nodeApi from '../api/node'

vi.mock('../api/node')
const mockExchange = vi.mocked(nodeApi.exchangeToken)

function mockNodeInfo(hub_web_origin = '') {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    json: () => Promise.resolve({ hub_web_origin }),
  } as Response)
}

beforeEach(() => {
  sessionStorage.clear()
  mockExchange.mockReset()
  mockNodeInfo() // default: no hub_web_origin
})

test('有有效 session 时直接跳转 /articles', async () => {
  sessionStorage.setItem('openim_token', 'tok')
  sessionStorage.setItem('openim_api_addr', 'http://api')
  sessionStorage.setItem('openim_ws_addr', 'ws://ws')
  sessionStorage.setItem('user_id', '1')
  sessionStorage.setItem('group_id', '0')
  const { container } = render(
    <MemoryRouter initialEntries={['/?token=app-tok']}>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        <Route path="/articles" element={<div>articles</div>} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(container.textContent).toContain('articles'))
  expect(mockExchange).not.toHaveBeenCalled()
})

test('URL 有 app_token 时调用 exchange 并跳转 /articles', async () => {
  mockExchange.mockResolvedValue({ openim_token: 'new-tok', openim_api_addr: 'http://api', openim_ws_addr: 'ws://ws', user_id: '42', group_id: '0' })
  const { container } = render(
    <MemoryRouter initialEntries={['/?token=app-tok-123']}>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        <Route path="/articles" element={<div>articles</div>} />
        <Route path="/error" element={<div>error</div>} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(container.textContent).toContain('articles'))
  expect(mockExchange).toHaveBeenCalledWith('app-tok-123')
  expect(sessionStorage.getItem('openim_token')).toBe('new-tok')
})

test('无 token 且无 hub_web_origin 时跳转 /error', async () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        <Route path="/error" element={<div>error</div>} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(container.textContent).toContain('error'))
})

test('无 token 且有 hub_web_origin 时调用 /node/info 准备跳转 Hub Web', async () => {
  mockNodeInfo('https://hub.example.com')
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        <Route path="/error" element={<div>error</div>} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/node/info'))
})

test('exchange 失败时跳转 /error', async () => {
  mockExchange.mockRejectedValue(new Error('401'))
  const { container } = render(
    <MemoryRouter initialEntries={['/?token=bad-tok']}>
      <Routes>
        <Route path="/" element={<AuthGateway />} />
        <Route path="/error" element={<div>error</div>} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(container.textContent).toContain('error'))
})
