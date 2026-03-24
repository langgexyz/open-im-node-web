import { renderHook, act } from '@testing-library/react'
import { useSession } from './useSession'

beforeEach(() => sessionStorage.clear())

const SESSION = ['tok', 'http://api.test', 'ws://ws.test', '42', '0'] as const

test('初始状态为空', () => {
  const { result } = renderHook(() => useSession())
  expect(result.current.openim_token).toBeNull()
  expect(result.current.openim_api_addr).toBeNull()
  expect(result.current.openim_ws_addr).toBeNull()
  expect(result.current.user_id).toBeNull()
  expect(result.current.group_id).toBeNull()
  expect(result.current.hasSession).toBe(false)
})

test('setSession 存储所有字段', () => {
  const { result } = renderHook(() => useSession())
  act(() => result.current.setSession(...SESSION))
  expect(result.current.openim_token).toBe('tok')
  expect(result.current.openim_api_addr).toBe('http://api.test')
  expect(result.current.openim_ws_addr).toBe('ws://ws.test')
  expect(result.current.user_id).toBe('42')
  expect(result.current.group_id).toBe('0')
  expect(result.current.hasSession).toBe(true)
})

test('clearSession 清除所有字段', () => {
  const { result } = renderHook(() => useSession())
  act(() => result.current.setSession(...SESSION))
  act(() => result.current.clearSession())
  expect(result.current.hasSession).toBe(false)
})

test('刷新后从 sessionStorage 恢复', () => {
  sessionStorage.setItem('openim_token', 'stored-tok')
  sessionStorage.setItem('openim_api_addr', 'http://stored.test')
  sessionStorage.setItem('openim_ws_addr', 'ws://stored.test')
  sessionStorage.setItem('user_id', '99')
  sessionStorage.setItem('group_id', '42')
  const { result } = renderHook(() => useSession())
  expect(result.current.hasSession).toBe(true)
  expect(result.current.group_id).toBe('42')
  expect(result.current.user_id).toBe('99')
})
