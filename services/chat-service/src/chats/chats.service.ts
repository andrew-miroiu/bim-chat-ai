import dotenv from 'dotenv'
import { supabase } from '../lib/supabaseClient.js'

dotenv.config()

export const getChatsFromDB = async (userId: string) => {
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching chats:', error)
        throw error
    }
    return data
}

export const createChatInDB = async (userId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .insert([{ user_id: userId, title: 'Chat nou' }])
    .select()
    .single()

  if (error) {
    console.error('Error creating chat:', error)
    throw error
  }
  return data
}

export const updateChatTitleInDB = async (chatId: string, title: string) => {
  const { data, error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId)
    .select()
    .single()

  if (error) {
    console.error('Error updating chat title:', error)
    throw error
  }
  return data
}

export const deleteChatFromDB = async (chatId: string, userId: string) => {
    const { data, error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error deleting chat:', error)
        throw error
    }
    return data
}
