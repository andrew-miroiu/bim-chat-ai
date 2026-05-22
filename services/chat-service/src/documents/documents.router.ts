import express from 'express'
import { getDocuments, deleteDocument } from './documents.controller.js'

const router = express.Router()

router.get('/', getDocuments)
router.delete('/:id', deleteDocument)

export default router
