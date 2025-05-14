import React from 'react'
import ReactDOM from 'react-dom/client'

import { Provider } from '@/provider'
import App from '@/app'
import '@/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider>
      <main className="select-none bg-background text-foreground antialiased dark">
        <App />
      </main>
    </Provider>
  </React.StrictMode>,
)
