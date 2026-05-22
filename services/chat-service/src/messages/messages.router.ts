import express from 'express'
import { getMessages, createMessage } from './messages.controller.js'

const router = express.Router()

router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', createMessage)

export default router