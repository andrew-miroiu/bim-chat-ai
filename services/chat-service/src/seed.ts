import { GoogleGenAI } from '@google/genai'
import { supabase } from './lib/supabaseClient.js'
import dotenv from 'dotenv'

dotenv.config()

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const documentId = 'bcb44733-e49d-4bac-99bc-000fb2b59b89'

const chunks = [
  'Pisicile sunt animale de companie populare în întreaga lume. Ele sunt cunoscute pentru independența lor, dar și pentru afecțiunea pe care o pot arăta față de stăpânii lor.',
  'Există multe rase de pisici, fiecare având trăsături și personalități unice.',
  'Mancarea dev ului preferata este peștele, dar poate mânca și carne și hrană specială pentru pisici.'
]

const seed = async () => {
  for (let i = 0; i < chunks.length; i++) {
    const result = await genAI.models.embedContent({
    model: 'gemini-embedding-001',
    contents: chunks[i]
    })

    const embedding = result.embeddings![0].values!

    const { error } = await supabase
      .from('chunks')
      .insert({
        document_id: documentId,
        content: chunks[i],
        embedding,
        chunk_index: i
      })

      console.log('Embedding dimensions:', embedding.length)

    if (error) console.error('Error:', error)
    else console.log(`Chunk ${i + 1} inserat`)
  }
  console.log('Done!')
  
}

seed()