import dotenv from 'dotenv'
import { supabase } from '../lib/supabaseClient.js'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export const getMessagesFromDB = async (chatId: string) => {
    const {data, error} = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

        if(error){
            console.error("error fetching messages:", error)
            throw error
        }

        return data
}

export const createMessageInDB = async (chatId: string, content: string, role: string = 'user') => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ chat_id: chatId, content, role }])
    .select()
    .single()

  if (error) {
    console.error('error creating message:', error)
    throw error
  }

  return data
}

export const getLastMessagesFromDB = async (chatId: string, limit: number = 10) => {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching last messages:', error)
    throw error
  }

  return data.reverse()
}

export const embedQuery = async (query: string) => {
  const result = await genAI.models.embedContent({
    model: 'gemini-embedding-001',
    contents: query
  })
  const embedding = result.embeddings![0].values!
  console.log('Embedding dimensions:', embedding.length)
  return embedding
}

export const searchSimilarChunks = async (embedding: number[]) => {
  const vectorStr = `[${embedding.join(',')}]`
  console.log('Vector string length:', vectorStr.length)
  console.log('Vector string start:', vectorStr.substring(0, 30))
  console.log('First 30 chars of vector:', vectorStr.substring(0, 30))
  
  const { data, error, status } = await supabase.rpc('match_chunks_raw', {
    query_embedding: vectorStr,
    match_count: 10
  })

  console.log('Status:', status)
  console.log('Error:', error)
  console.log('Data:', data)

  if (error) throw error
  return data
}