import express from 'express'
import { getChats, createChat, updateChatTitle, deleteChat } from './chats.controller.js'

const router = express.Router()

router.get('/', getChats)
router.post('/', createChat)
router.patch('/:id', updateChatTitle)
router.delete('/:id', deleteChat)

export default router