import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import ArticleListPage from './ArticleListPage'
import * as oimApi from '../api/openim'

vi.mock('@openim/wasm-client-sdk', () => ({
  getSDK: () => ({ login: vi.fn(), logout: vi.fn(), on: vi.fn(), off: vi.fn(), getAdvancedHistoryMessageList: vi.fn() }),
  CbEvents: { OnRecvNewMessage: 'OnRecvNewMessage' },
  MessageType: { CustomMessage: 110 },
}))

vi.mock('../api/openim')

function setFullSession() {
  sessionStorage.setItem('openim_token', 'tok')
  sessionStorage.setItem('openim_api_addr', 'http://api.test')
  sessionStorage.setItem('openim_ws_addr', 'ws://ws.test')
  sessionStorage.setItem('user_id', '42')
  sessionStorage.setItem('group_id', '0')
}

beforeEach(() => {
  sessionStorage.clear()
  setFullSession()
  vi.mocked(oimApi.initSDK).mockResolvedValue(undefined)
  vi.mocked(oimApi.onNewArticle).mockReturnValue(() => {})
})

test('拉取并渲染文章列表', async () => {
  vi.mocked(oimApi.getArticles).mockResolvedValue({
    messages: [{ msg_id: 'm1', seq: 5, send_time: 1000000,
      content: { title: '文章一', cover_url: '', summary: '', content_url: '' } }],
    isEnd: true,
  })
  render(<MemoryRouter><ArticleListPage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText('文章一')).toBeInTheDocument())
})

test('无消息时显示空状态', async () => {
  vi.mocked(oimApi.getArticles).mockResolvedValue({ messages: [], isEnd: true })
  render(<MemoryRouter><ArticleListPage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText(/暂无文章/)).toBeInTheDocument())
})

test('initSDK 失败含 401 时清除 session', async () => {
  vi.mocked(oimApi.initSDK).mockRejectedValue(new Error('401 token expired'))
  render(<MemoryRouter><ArticleListPage /></MemoryRouter>)
  await waitFor(() => expect(sessionStorage.getItem('openim_token')).toBeNull())
})
