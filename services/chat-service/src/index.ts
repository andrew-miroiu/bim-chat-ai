import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import chatsRouter from './chats/chats.router.js'
import messagesRouter from './messages/messages.router.js'
import documentsRouter from './documents/documents.router.js'
import { authMiddleware } from './middleware/auth.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use(authMiddleware)

app.use('/chats', chatsRouter)
app.use('/chats', messagesRouter)
app.use('/documents', documentsRouter)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Chat Service running on port ${PORT}`)
})