import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyDesign } from '@/lib/design'

if (!window.location.pathname.startsWith('/admin')) applyDesign()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
