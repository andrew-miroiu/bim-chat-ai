import type { Request, Response } from 'express'
import { getDocumentsFromDB, deleteDocumentFromDB } from './documents.service.js'

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const documents = await getDocumentsFromDB(userId)
    res.json(documents)
  } catch (error) {
    res.status(500).json({ error: 'Eroare la preluarea documentelor' })
  }
}

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    await deleteDocumentFromDB(id, userId)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Eroare la stergerea documentului' })
  }
}
