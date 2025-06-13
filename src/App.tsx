import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useLogto } from '@logto/react'
import UploadPage from './pages/UploadPage'
import FilesPage from './pages/FilesPage'
import CallbackPage from './pages/CallbackPage'

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

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50">
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
    </div>
  )
}

export default App
