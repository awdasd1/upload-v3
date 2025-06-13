import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LogtoProvider, LogtoConfig } from '@logto/react'
import { Toaster } from 'react-hot-toast'
import UploadPage from './pages/UploadPage'
import FilesPage from './pages/FilesPage'
import CallbackPage from './pages/CallbackPage'
import { useLogto } from '@logto/react'

const queryClient = new QueryClient()

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
  appId: import.meta.env.VITE_LOGTO_APP_ID,
  resources: [],
  scopes: ['openid', 'profile', 'email'],
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useLogto()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route 
        path="/files" 
        element={
          <ProtectedRoute>
            <FilesPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <LogtoProvider config={logtoConfig}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50">
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0f766e',
                  color: '#fff',
                  fontFamily: 'Cairo, sans-serif',
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </LogtoProvider>
  )
}

export default App
