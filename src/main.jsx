import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import OfflineBanner from './components/ui/OfflineBanner.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ToastProvider>
                <OfflineBanner />
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </ToastProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
