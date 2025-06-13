import React, { useState, useRef } from 'react'
import { useLogto } from '@logto/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Image, File, X, CheckCircle, AlertCircle, User, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  status: string
}

const UploadPage: React.FC = () => {
  const { isAuthenticated, signIn, signOut, getAccessToken, getIdTokenClaims } = useLogto()
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadedFile> => {
      const token = await getAccessToken('https://upload-file.mjal.at/api')
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:5173/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: (data, file) => {
      toast.success(`تم رفع ${file.name} بنجاح`)
      setFiles(prev => prev.filter(f => f.name !== file.name))
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
    onError: (error: Error, file) => {
      toast.error(`فشل في رفع ${file.name}: ${error.message}`)
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
    },
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} كبير جداً (الحد الأقصى 50 ميجابايت)`)
        return false
      }
      return true
    })

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName))
  }

  const uploadFiles = async () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً')
      return
    }

    for (const file of files) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
      uploadMutation.mutate(file)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />
    if (type === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Upload className="h-8 w-8 text-teal-600" />
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  رفع الملفات
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/files"
                    className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    ملفاتي
                  </Link>
                  <button
                    onClick={() => signOut(import.meta.env.VITE_LOGTO_POST_LOGOUT_REDIRECT_URI)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل خروج</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn(import.meta.env.VITE_LOGTO_REDIRECT_URI)}
                  className="flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>تسجيل دخول</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
            مرحباً بك في منصة رفع الملفات
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ارفع ملفاتك بأمان وسهولة. ندعم جميع أنواع الملفات حتى 50 ميجابايت
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              dragActive
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-16 w-16 text-teal-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              اسحب الملفات هنا أو انقر للاختيار
            </h3>
            <p className="text-gray-600 mb-6">
              الحد الأقصى لحجم الملف: 50 ميجابايت
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              اختر الملفات
            </button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, sans-serif' }}>
                الملفات المحددة ({files.length})
              </h3>
              <button
                onClick={uploadFiles}
                disabled={!isAuthenticated || uploadMutation.isPending}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {uploadMutation.isPending ? 'جاري الرفع...' : 'رفع الملفات'}
              </button>
            </div>

            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] !== undefined ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{uploadProgress[file.name]}%</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              آمن ومحمي
            </h3>
            <p className="text-gray-600">
              جميع ملفاتك محمية بأحدث تقنيات الأمان والتشفير
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              رفع سريع
            </h3>
            <p className="text-gray-600">
              تقنية رفع متطورة لضمان سرعة عالية في نقل الملفات
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <File className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              أنواع متعددة
            </h3>
            <p className="text-gray-600">
              ندعم جميع أنواع الملفات الشائعة بما في ذلك الصور والمستندات
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              يجب تسجيل الدخول
            </h3>
            <p className="text-amber-700 mb-4">
              لرفع الملفات وإدارتها، يجب عليك تسجيل الدخول أولاً
            </p>
            <button
              onClick={() => signIn(import.meta.env.VITE_LOGTO_REDIRECT_URI)}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              تسجيل الدخول الآن
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadPage
