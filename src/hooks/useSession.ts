import { useState } from 'react'

const KEYS = {
  token: 'openim_token',
  addr: 'openim_api_addr',
  wsAddr: 'openim_ws_addr',
  uid: 'user_id',
  gid: 'group_id',
}

export function useSession() {
  const [token, setToken] = useState(() => sessionStorage.getItem(KEYS.token))
  const [addr, setAddr] = useState(() => sessionStorage.getItem(KEYS.addr))
  const [wsAddr, setWsAddr] = useState(() => sessionStorage.getItem(KEYS.wsAddr))
  const [uid, setUid] = useState(() => sessionStorage.getItem(KEYS.uid))
  const [gid, setGid] = useState(() => sessionStorage.getItem(KEYS.gid))

  function setSession(
    openim_token: string,
    openim_api_addr: string,
    openim_ws_addr: string,
    user_id: string,
    group_id: string,
  ) {
    sessionStorage.setItem(KEYS.token, openim_token)
    sessionStorage.setItem(KEYS.addr, openim_api_addr)
    sessionStorage.setItem(KEYS.wsAddr, openim_ws_addr)
    sessionStorage.setItem(KEYS.uid, user_id)
    sessionStorage.setItem(KEYS.gid, group_id)
    setToken(openim_token)
    setAddr(openim_api_addr)
    setWsAddr(openim_ws_addr)
    setUid(user_id)
    setGid(group_id)
  }

  function clearSession() {
    Object.values(KEYS).forEach(k => sessionStorage.removeItem(k))
    setToken(null); setAddr(null); setWsAddr(null); setUid(null); setGid(null)
  }

  return {
    openim_token: token,
    openim_api_addr: addr,
    openim_ws_addr: wsAddr,
    user_id: uid,
    group_id: gid,
    hasSession: !!token && !!addr && !!wsAddr && !!uid && !!gid,
    setSession,
    clearSession,
  }
}
