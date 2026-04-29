import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { registerSW } from 'virtual:pwa-register'

// Isso registra o Service Worker para o modo offline e atualizações automáticas
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- Abrace o App */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)