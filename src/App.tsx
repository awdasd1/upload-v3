import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useLogto } from '@logto/react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import FilesPage from './pages/FilesPage'
import CallbackPage from './pages/CallbackPage'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { isLoading, isAuthenticated } = useLogto()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route 
          path="/upload" 
          element={
            isAuthenticated ? <UploadPage /> : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/files" 
          element={
            isAuthenticated ? <FilesPage /> : <Navigate to="/" replace />
          } 
        />
      </Route>
    </Routes>
  )
}

export default App
