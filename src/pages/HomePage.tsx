import React from 'react'
import { useLogto } from '@logto/react'
import { Link } from 'react-router-dom'
import { Upload, Shield, Zap, Cloud, ArrowRight } from 'lucide-react'

const HomePage: React.FC = () => {
  const { isAuthenticated, signIn } = useLogto()

  const features = [
    {
      icon: Shield,
      title: 'Secure Upload',
      description: 'End-to-end encryption ensures your files are always protected'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized upload speeds with real-time progress tracking'
    },
    {
      icon: Cloud,
      title: 'Cloud Storage',
      description: 'Access your files anywhere, anytime with reliable cloud storage'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Secure File Upload
            <span className="text-primary-500"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Upload, manage, and share your files with confidence. Our platform provides 
            enterprise-grade security with an intuitive user experience.
          </p>
          
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload" className="btn-primary text-lg px-8 py-3">
                Start Uploading
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/files" 
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                View My Files
              </Link>
            </div>
          ) : (
            <button
              onClick={() => signIn(import.meta.env.VITE_LOGTO_REDIRECT_URI)}
              className="btn-primary text-lg px-8 py-3 inline-flex items-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose Our Platform?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Built with modern technology and security best practices to give you 
            the best file upload experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card text-center hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Trusted by Users Worldwide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">50MB</div>
              <div className="text-primary-100">Max File Size</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-primary-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">256-bit</div>
              <div className="text-primary-100">Encryption</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
