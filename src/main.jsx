import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import OfflineBanner from './components/ui/OfflineBanner.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ToastProvider>
            <OfflineBanner />
            <App />
        </ToastProvider>
    </React.StrictMode>,
)
