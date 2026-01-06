import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminPage from './pages/AdminPage';
import ContactPage from './pages/ContactPage';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/ConfirmModal';
import { ThemeProvider } from './hooks/useTheme';
import OfflineBanner from './components/ui/OfflineBanner';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { QueryProvider, UIProvider } from './contexts';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
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
);

