import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando houver nova versão
      devOptions: {
        enabled: true // Permite testar o modo offline no nosso computador (localhost)
      },
      manifest: {
        name: 'CampoLog - Gestão Agrícola',
        short_name: 'CampoLog',
        description: 'Diário de campo e rastreabilidade agrícola do IFSertãoPE',
        theme_color: '#2D5A27', // Aquele nosso verde safra no topo do celular
        background_color: '#F8FAFC',
        display: 'standalone', // Faz parecer um app nativo, escondendo a barra do navegador
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})