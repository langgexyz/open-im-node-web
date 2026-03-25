import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const nodeAddr = env.VITE_NODE_ADDR || 'http://localhost:8282'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': nodeAddr,
        '/node': nodeAddr,
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  }
})
