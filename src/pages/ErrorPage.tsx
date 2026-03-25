import { useEffect, useState } from 'react'

export default function ErrorPage() {
  const [hubUrl, setHubUrl] = useState('')

  useEffect(() => {
    fetch('/node/info')
      .then(r => r.json())
      .then(info => { if (info.hub_web_origin) setHubUrl(info.hub_web_origin) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth:680, margin:'120px auto', textAlign:'center', padding:'0 16px' }}>
      <h2 style={{ fontSize:18, marginBottom:8 }}>访问出错</h2>
      <p style={{ color:'#9ca3af', fontSize:14, marginBottom:24 }}>
        凭证无效或已过期，请重新通过 Hub Web 订阅。
      </p>
      {hubUrl && (
        <a href={hubUrl}
          style={{ display:'inline-block', padding:'8px 24px', background:'#111',
            color:'#fff', borderRadius:6, fontSize:14, textDecoration:'none' }}>
          去 Hub Web 订阅
        </a>
      )}
    </div>
  )
}
