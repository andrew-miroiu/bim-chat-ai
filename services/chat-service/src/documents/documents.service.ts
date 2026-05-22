import { supabase } from '../lib/supabaseClient.js'

export const getDocumentsFromDB = async (userId: string) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    throw error
  }
  return data
}

export const deleteDocumentFromDB = async (documentId: string, userId: string) => {
  // Delete related chunks first
  const { error: chunksError } = await supabase
    .from('chunks')
    .delete()
    .eq('document_id', documentId)

  if (chunksError) {
    console.error('Error deleting chunks:', chunksError)
    throw chunksError
  }

  const { data, error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('uploaded_by', userId)

  if (error) {
    console.error('Error deleting document:', error)
    throw error
  }
  return data
}
