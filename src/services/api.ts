import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

export interface FileUploadResponse {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  status: string
}

export interface FileListItem {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  status: string
}

export const uploadFile = async (file: File, token: string): Promise<FileUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`,
    },
  })

  return response.data
}

export const getFiles = async (token: string): Promise<FileListItem[]> => {
  const response = await api.get('/files', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  return response.data
}

export const getFile = async (fileId: string, token: string): Promise<FileListItem> => {
  const response = await api.get(`/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  return response.data
}

export const downloadFile = async (fileId: string, fileName: string, token: string): Promise<void> => {
  const response = await api.get(`/files/${fileId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    responseType: 'blob',
  })

  // Create blob link to download
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const deleteFile = async (fileId: string, token: string): Promise<void> => {
  await api.delete(`/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
}
