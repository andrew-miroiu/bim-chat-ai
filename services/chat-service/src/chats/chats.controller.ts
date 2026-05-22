import type { Request, Response } from 'express'
import { getChatsFromDB, createChatInDB, deleteChatFromDB, updateChatTitleInDB } from './chats.service.js'

export const getChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const chats = await getChatsFromDB(userId)
    res.json(chats)
  } catch (error) {
    res.status(500).json({ error: 'Eroare la preluarea chaturilor' })
  }
}

export const createChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const chat = await createChatInDB(userId)
    res.status(201).json(chat)
  } catch (error) {
    res.status(500).json({ error: 'Eroare la crearea chatului' })
  }
}

export const updateChatTitle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const chatId = id as string
    const { title } = req.body
    const chat = await updateChatTitleInDB(chatId, title)
    res.json(chat)
  } catch (error) {
    res.status(500).json({ error: 'Eroare la actualizarea titlului' })
  }
}

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const chatId = id as string
    await deleteChatFromDB(chatId, userId)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Eroare la stergerea chatului' })
  }
}