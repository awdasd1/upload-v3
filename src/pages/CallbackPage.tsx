import React, { useEffect } from 'react'
import { useHandleSignInCallback } from '@logto/react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

const CallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoading, error } = useHandleSignInCallback(() => {
    navigate('/upload')
  })

  useEffect(() => {
    if (error) {
      console.error('Sign in callback error:', error)
      navigate('/')
    }
  }, [error, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Signing you in...
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  )
}

export default CallbackPage
