import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { Pool } from 'pg'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
})

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://upload-file.mjal.at:3000'],
  credentials: true
}))
app.use(express.json())

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  }
})

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        size BIGINT NOT NULL,
        type VARCHAR(100) NOT NULL,
        path VARCHAR(500) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)
    `)
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_files_upload_date ON files(upload_date)
    `)
    
    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Mock authentication middleware (replace with actual LogTo verification)
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }
  
  // For demo purposes, we'll use a mock user ID
  // In production, verify the LogTo token and extract user ID
  req.userId = 'demo-user-' + Math.random().toString(36).substr(2, 9)
  next()
}

// Routes
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { originalname, filename, size, mimetype, path: filePath } = req.file
    const userId = req.userId

    // Insert file record into database
    const result = await pool.query(`
      INSERT INTO files (user_id, name, original_name, size, type, path, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, filename, originalname, size, mimetype, filePath, 'completed'])

    const fileRecord = result.rows[0]

    // Send webhook to n8n (optional)
    try {
      const webhookUrl = process.env.N8N_WEBHOOK_URL
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: fileRecord.id,
            fileName: originalname,
            fileSize: size,
            fileType: mimetype,
            userId: userId,
            uploadDate: fileRecord.upload_date
          })
        })
      }
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
      // Don't fail the upload if webhook fails
    }

    res.json({
      id: fileRecord.id,
      name: fileRecord.original_name,
      size: fileRecord.size,
      type: fileRecord.type,
      uploadDate: fileRecord.upload_date,
      status: fileRecord.status
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

app.get('/api/files', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.userId
    const result = await pool.query(`
      SELECT id, original_name as name, size, type, upload_date, status
      FROM files 
      WHERE user_id = $1 
      ORDER BY upload_date DESC
    `, [userId])

    res.json(result.rows.map(row => ({
      ...row,
      uploadDate: row.upload_date
    })))
  } catch (error) {
    console.error('Get files error:', error)
    res.status(500).json({ error: 'Failed to fetch files' })
  }
})

app.get('/api/files/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await pool.query(`
      SELECT id, original_name as name, size, type, upload_date, status, path
      FROM files 
      WHERE id = $1 AND user_id = $2
    `, [id, userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    const file = result.rows[0]
    res.json({
      ...file,
      uploadDate: file.upload_date
    })
  } catch (error) {
    console.error('Get file error:', error)
    res.status(500).json({ error: 'Failed to fetch file' })
  }
})

app.get('/api/files/:id/download', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await pool.query(`
      SELECT original_name, path, type
      FROM files 
      WHERE id = $1 AND user_id = $2
    `, [id, userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    const file = result.rows[0]
    const filePath = file.path

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' })
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`)
    res.setHeader('Content-Type', file.type)
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error)
      res.status(500).json({ error: 'Error reading file' })
    })
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: 'Download failed' })
  }
})

app.delete('/api/files/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    // Get file info first
    const result = await pool.query(`
      SELECT path FROM files 
      WHERE id = $1 AND user_id = $2
    `, [id, userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    const filePath = result.rows[0].path

    // Delete from database
    await pool.query(`
      DELETE FROM files 
      WHERE id = $1 AND user_id = $2
    `, [id, userId])

    // Delete physical file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError)
      // Don't fail the request if file deletion fails
    }

    res.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Delete failed' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server error:', error)
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' })
    }
    return res.status(400).json({ error: error.message })
  }
  
  if (error.message === 'File type not allowed') {
    return res.status(400).json({ error: 'File type not allowed' })
  }
  
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
async function startServer() {
  try {
    await initDatabase()
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`API available at http://localhost:${PORT}/api`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await pool.end()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await pool.end()
  process.exit(0)
})

startServer()
