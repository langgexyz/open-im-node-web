import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeToken } from '../api/node'
import { useSession } from '../hooks/useSession'

async function getHubWebOrigin(): Promise<string> {
  try {
    const info = await fetch('/node/info').then(r => r.json())
    return info.hub_web_origin || ''
  } catch {
    return ''
  }
}

export default function AuthGateway() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { hasSession, setSession } = useSession()

  useEffect(() => {
    if (hasSession) {
      navigate('/articles', { replace: true })
      return
    }
    const appToken = searchParams.get('token')
    if (!appToken) {
      getHubWebOrigin().then(origin => {
        if (origin) {
          window.location.href = origin
        } else {
          navigate('/error', { replace: true })
        }
      }).catch(() => navigate('/error', { replace: true }))
      return
    }
    exchangeToken(appToken)
      .then(({ openim_token, openim_api_addr, openim_ws_addr, user_id, group_id }) => {
        setSession(openim_token, openim_api_addr, openim_ws_addr, user_id, group_id)
        window.history.replaceState({}, '', '/')
        navigate('/articles', { replace: true })
      })
      .catch(() => navigate('/error', { replace: true }))
  }, [])

  return null
}
