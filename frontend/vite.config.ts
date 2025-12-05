import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  // Load env early (include empty prefix so we can validate)
  const env = loadEnv(mode, process.cwd(), '')
  const missing = []
  if (!env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
  if (!env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')

  if (missing.length) {
    const msg = `[vite] Missing required environment variables: ${missing.join(', ')}. See frontend/.env.example`
    // Fail build in production, warn in development
    if (mode === 'production') {
      throw new Error(msg)
    } else {
      console.warn(msg)
    }
  }

  return defineConfig({
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Bind to all interfaces for mobile access
      proxy: {
        '/api': {
          target: 'http://localhost:8082',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/ai': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai/, '')
        }
      }
    }
  })
}
