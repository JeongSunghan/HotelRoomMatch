import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { ConfirmProvider } from './components/ui/ConfirmModal.jsx'
import { ThemeProvider } from './hooks/useTheme.jsx'
import OfflineBanner from './components/ui/OfflineBanner.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import { QueryProvider, UIProvider } from './contexts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <QueryProvider>
                    <UIProvider>
                        <BrowserRouter>
                            <ToastProvider>
                                <ConfirmProvider>
                                    <OfflineBanner />
                                    <Routes>
                                        <Route path="/" element={<App />} />
                                        <Route path="/admin" element={<AdminPage />} />
                                        <Route path="/contact" element={<ContactPage />} />
                                    </Routes>
                                </ConfirmProvider>
                            </ToastProvider>
                        </BrowserRouter>
                    </UIProvider>
                </QueryProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)

