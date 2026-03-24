import { getSDK, CbEvents, MessageType } from '@openim/wasm-client-sdk'
import type { MessageItem } from '@openim/wasm-client-sdk'

export interface ArticleContent {
  title: string
  cover_url: string
  summary: string
  content_url: string
}

export interface OIMMessage {
  msg_id: string
  seq: number
  send_time: number
  content: ArticleContent
}

export interface InitSDKParams {
  userID: string
  token: string
  apiAddr: string
  wsAddr: string
}

let _sdk: ReturnType<typeof getSDK> | null = null

function sdk() {
  if (!_sdk) _sdk = getSDK()
  return _sdk
}

export async function initSDK(params: InitSDKParams): Promise<void> {
  await sdk().login({
    userID: params.userID,
    token: params.token,
    apiAddr: params.apiAddr,
    wsAddr: params.wsAddr,
    platformID: 5, // Platform.Web
  })
}

export async function logoutSDK(): Promise<void> {
  await sdk().logout()
}

function toOIMMessage(msg: MessageItem): OIMMessage | null {
  if (msg.contentType !== MessageType.CustomMessage) return null
  try {
    const content = JSON.parse(msg.customElem?.data ?? '') as ArticleContent
    if (!content.title) return null
    return { msg_id: msg.clientMsgID, seq: msg.seq, send_time: msg.sendTime, content }
  } catch {
    return null
  }
}

export async function getArticles(
  conversationID: string,
  startClientMsgID: string,
  count: number,
): Promise<{ messages: OIMMessage[]; isEnd: boolean }> {
  const res = await sdk().getAdvancedHistoryMessageList({
    conversationID,
    startClientMsgID,
    count,
    viewType: 0, // ViewType.History
  })
  const msgs = (res.data?.messageList ?? [])
    .map(toOIMMessage)
    .filter((m): m is OIMMessage => m !== null)
  return { messages: msgs, isEnd: res.data?.isEnd ?? true }
}

export function onNewArticle(
  groupID: string,
  callback: (msg: OIMMessage) => void,
): () => void {
  const handler = (msg: MessageItem) => {
    if (msg.groupID !== groupID) return
    const article = toOIMMessage(msg)
    if (article) callback(article)
  }
  sdk().on(CbEvents.OnRecvNewMessage, handler)
  return () => sdk().off(CbEvents.OnRecvNewMessage, handler)
}
