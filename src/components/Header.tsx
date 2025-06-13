import React from 'react'
import { useLogto } from '@logto/react'
import { Menu, Upload, User, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface HeaderProps {
  onMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { isAuthenticated, signIn, signOut, fetchUserInfo } = useLogto()
  const { theme, toggleTheme } = useTheme()
  const [userInfo, setUserInfo] = React.useState<any>(null)

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchUserInfo().then(setUserInfo)
    }
  }, [isAuthenticated, fetchUserInfo])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Upload className="h-8 w-8 text-primary-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Upload File
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userInfo?.email || 'User'}
                  </span>
                </div>
                <button
                  onClick={() => signOut(import.meta.env.VITE_LOGTO_POST_LOGOUT_REDIRECT_URI)}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn(import.meta.env.VITE_LOGTO_REDIRECT_URI)}
                className="btn-primary"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
