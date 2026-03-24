import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { initSDK, getArticles, onNewArticle, type OIMMessage } from '../api/openim'
import { useSession } from '../hooks/useSession'
import ArticleCard from '../components/ArticleCard'
import { NodeHeader } from '../components/NodeHeader'

const PAGE_SIZE = 20

export default function ArticleListPage() {
  const { openim_token, openim_api_addr, openim_ws_addr, user_id, group_id, clearSession } = useSession()
  const navigate = useNavigate()
  const conversationID = `group_${group_id}`

  const [articles, setArticles] = useState<OIMMessage[]>([])
  const [startMsgID, setStartMsgID] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)

  function appendArticles(msgs: OIMMessage[]) {
    setArticles(prev => {
      const ids = new Set(prev.map(m => m.msg_id))
      return [...prev, ...msgs.filter(m => !ids.has(m.msg_id))].sort((a, b) => b.seq - a.seq)
    })
  }

  async function loadMore(cursor: string) {
    if (loading) return
    setLoading(true)
    try {
      const { messages, isEnd } = await getArticles(conversationID, cursor, PAGE_SIZE)
      appendArticles(messages)
      if (messages.length > 0) setStartMsgID(messages[messages.length - 1].msg_id)
      if (isEnd) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!openim_token || !openim_api_addr || !openim_ws_addr || !user_id || !group_id) return
    if (initialized.current) return
    initialized.current = true

    initSDK({ userID: user_id, token: openim_token, apiAddr: openim_api_addr, wsAddr: openim_ws_addr })
      .then(() => loadMore(''))
      .catch((e: unknown) => {
        if (String(e).includes('401') || String(e).includes('token')) {
          clearSession()
          navigate('/', { replace: true })
        }
      })

    const unsubscribe = onNewArticle(group_id, msg => {
      setArticles(prev => {
        const ids = new Set(prev.map(m => m.msg_id))
        if (ids.has(msg.msg_id)) return prev
        return [msg, ...prev]
      })
    })
    return unsubscribe
  }, [])

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'0 16px', background:'#fff', minHeight:'100vh' }}>
      <NodeHeader name="" avatar="" />
      {articles.length === 0 && !loading && (
        <p style={{ textAlign:'center', color:'#9ca3af', marginTop:48 }}>暂无文章</p>
      )}
      {articles.map(msg => <ArticleCard key={msg.msg_id} msg={msg} />)}
      {hasMore && articles.length > 0 && (
        <button onClick={() => loadMore(startMsgID)}
          disabled={loading} style={{ width:'100%', padding:12, marginTop:8, border:'none',
            background:'none', color:'#6b7280', cursor:'pointer' }}>
          {loading ? '加载中…' : '加载更多'}
        </button>
      )}
    </div>
  )
}
