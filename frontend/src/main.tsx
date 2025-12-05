import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App'
import './ui/index.css'
import './utils/authDiagnostics'
import { BrowserRouter} from 'react-router-dom'
import { ThemeProvider } from './lib/ThemeContext'
import { AuthProvider } from './lib/AuthContext'

const rootEl = document.getElementById('root')
if (!rootEl) {
  // eslint-disable-next-line no-console
  console.error('Root element #root not found')
} else {
  const root = createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <App/>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  )
}
