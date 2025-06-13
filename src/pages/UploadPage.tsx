import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Image, File, User, LogOut, Files } from 'lucide-react'
import { useLogto } from '@logto/react'
import { useMutation } from '@tanstack/react-query'
import { uploadFile } from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const UploadPage: React.FC = () => {
  const { isAuthenticated, signIn, signOut, getAccessToken } = useLogto()
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = await getAccessToken()
      return uploadFile(file, token || '')
    },
    onSuccess: (data, file) => {
      toast.success(`تم رفع ${file.name} بنجاح`)
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
    },
    onError: (error, file) => {
      toast.error(`فشل في رفع ${file.name}`)
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
    }
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[file.name] || 0
          if (currentProgress >= 90) {
            clearInterval(interval)
            return prev
          }
          return { ...prev, [file.name]: currentProgress + 10 }
        })
      }, 200)

      uploadMutation.mutate(file)
    })
  }, [uploadMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <Image className="w-6 h-6 text-blue-500" />
    } else if (extension === 'pdf') {
      return <FileText className="w-6 h-6 text-red-500" />
    } else {
      return <File className="w-6 h-6 text-gray-500" />
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
            مرحباً بك في منصة رفع الملفات
          </h1>
          <p className="text-gray-600 mb-8" style={{ fontFamily: 'Cairo, sans-serif' }}>
            قم بتسجيل الدخول لبدء رفع وإدارة ملفاتك بسهولة وأمان
          </p>
          <button
            onClick={() => signIn(import.meta.env.VITE_LOGTO_REDIRECT_URI)}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            <User className="w-5 h-5 inline-block ml-2" />
            تسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                منصة رفع الملفات
              </h1>
              <p className="text-gray-600 mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                ارفع وأدر ملفاتك بسهولة وأمان
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/files"
                className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <Files className="w-5 h-5" />
                ملفاتي
              </Link>
              <button
                onClick={() => signOut(import.meta.env.VITE_LOGTO_POST_LOGOUT_REDIRECT_URI)}
                className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-12 h-12 text-teal-600" />
            </div>
            {isDragActive ? (
              <p className="text-xl text-teal-600 font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                اسحب الملفات هنا...
              </p>
            ) : (
              <div>
                <p className="text-xl text-gray-700 font-semibold mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  اسحب الملفات هنا أو انقر للاختيار
                </p>
                <p className="text-gray-500" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  يدعم: الصور، PDF، المستندات (حتى 50 ميجابايت)
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
                جاري الرفع...
              </h3>
              <div className="space-y-4">
                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getFileIcon(fileName)}
                      <span className="font-medium text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                        {fileName}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>
                      {progress}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              رفع سريع
            </h3>
            <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
              ارفع ملفاتك بسرعة وسهولة مع دعم السحب والإفلات
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              أنواع متعددة
            </h3>
            <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
              دعم لجميع أنواع الملفات الشائعة والمستندات
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Files className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              إدارة سهلة
            </h3>
            <p className="text-gray-600" style={{ fontFamily: 'Cairo, sans-serif' }}>
              أدر ملفاتك وشاركها مع الآخرين بسهولة
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
