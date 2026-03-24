import { test, expect, vi, beforeEach } from 'vitest'
import { getArticles, onNewArticle } from './openim'
import { CbEvents, MessageType } from '@openim/wasm-client-sdk'

const handlers: Record<string, ((data: unknown) => void)[]> = {}
const mockSDK = {
  login: vi.fn().mockResolvedValue({}),
  logout: vi.fn().mockResolvedValue({}),
  getAdvancedHistoryMessageList: vi.fn(),
  on: vi.fn((event: string, handler: (data: unknown) => void) => {
    handlers[event] = handlers[event] ?? []
    handlers[event].push(handler)
  }),
  off: vi.fn((event: string, handler: (data: unknown) => void) => {
    handlers[event] = (handlers[event] ?? []).filter(h => h !== handler)
  }),
}

vi.mock('@openim/wasm-client-sdk', () => ({
  getSDK: () => mockSDK,
  CbEvents: { OnRecvNewMessage: 'OnRecvNewMessage' },
  MessageType: { CustomMessage: 110 },
}))

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(handlers).forEach(k => delete handlers[k])
})

function makeMsg(overrides: object = {}) {
  return {
    clientMsgID: 'm1',
    seq: 5,
    sendTime: 1000,
    contentType: MessageType.CustomMessage,
    groupID: '0',
    customElem: { data: JSON.stringify({ title: 'T1', cover_url: '', summary: '', content_url: '' }) },
    ...overrides,
  }
}

test('getArticles 返回文章列表', async () => {
  mockSDK.getAdvancedHistoryMessageList.mockResolvedValue({
    data: { messageList: [makeMsg()], isEnd: true },
  })
  const result = await getArticles('group_0', '', 20)
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0].msg_id).toBe('m1')
  expect(result.isEnd).toBe(true)
})

test('getArticles 过滤非 CustomMessage', async () => {
  mockSDK.getAdvancedHistoryMessageList.mockResolvedValue({
    data: {
      messageList: [
        makeMsg(),
        makeMsg({ clientMsgID: 'm2', contentType: 101 }), // TextMessage
      ],
      isEnd: false,
    },
  })
  const result = await getArticles('group_0', '', 20)
  expect(result.messages).toHaveLength(1)
  expect(result.messages[0].msg_id).toBe('m1')
})

test('onNewArticle 监听新消息并过滤 groupID', () => {
  const callback = vi.fn()
  onNewArticle('0', callback)

  // 同 group，应触发
  handlers[CbEvents.OnRecvNewMessage]?.forEach(h => h(makeMsg()))
  expect(callback).toHaveBeenCalledTimes(1)

  // 不同 group，不应触发
  handlers[CbEvents.OnRecvNewMessage]?.forEach(h => h(makeMsg({ groupID: 'other' })))
  expect(callback).toHaveBeenCalledTimes(1)
})

test('onNewArticle 返回取消订阅函数', () => {
  const callback = vi.fn()
  const unsubscribe = onNewArticle('0', callback)
  unsubscribe()
  handlers[CbEvents.OnRecvNewMessage]?.forEach(h => h(makeMsg()))
  expect(callback).not.toHaveBeenCalled()
})
