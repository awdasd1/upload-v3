import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('logto:access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  status: 'completed' | 'processing' | 'failed'
  downloadUrl?: string
}

export const uploadFile = async (formData: FormData): Promise<FileItem> => {
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        // You can emit progress events here if needed
        console.log(`Upload progress: ${progress}%`)
      }
    },
  })
  return response.data
}

export const getFiles = async (): Promise<FileItem[]> => {
  const response = await api.get('/files')
  return response.data
}

export const deleteFile = async (fileId: string): Promise<void> => {
  await api.delete(`/files/${fileId}`)
}

export const downloadFile = async ({ fileId, fileName }: { fileId: string; fileName: string }): Promise<Blob> => {
  const response = await api.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

export const getFileById = async (fileId: string): Promise<FileItem> => {
  const response = await api.get(`/files/${fileId}`)
  return response.data
}
