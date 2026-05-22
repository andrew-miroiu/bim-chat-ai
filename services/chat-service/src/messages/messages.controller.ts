import type { Request, Response } from 'express'
import { getMessagesFromDB, createMessageInDB, getLastMessagesFromDB, embedQuery, searchSimilarChunks} from './messages.service.js'
import { GoogleGenAI } from '@google/genai'
import { updateChatTitleInDB } from '../chats/chats.service.js'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params as { chatId: string }
        const messages = await getMessagesFromDB(chatId)
        res.json(messages)
    } catch (error) {
        res.status(500).json({ error: 'Eroare la preluarea mesajelor' })
    }
}

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params as { chatId: string }
    const { content } = req.body

    // 1. salvezi mesajul userului
    await createMessageInDB(chatId, content)

    // 2. iei ultimele 10 mesaje
    const history = await getLastMessagesFromDB(chatId)

    // 3. embedding + similarity search
    const embedding = await embedQuery(content)
    const chunks = await searchSimilarChunks(embedding)
    console.log('Chunks gasite:', chunks)

    // 4. construiesti contextul
    const context = chunks.map((c: { content: string }) => c.content).join('\n\n')

    const systemPrompt = `Ești un asistent specializat în documente BIM. 
Răspunde doar pe baza documentelor furnizate ca context.
Dacă informația nu e în documente, spune că nu ai această informație.

Context din documente:
${context}`

    const messages = [
      ...history.slice(0, -1).map((m: { role: string, content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    ]

    // 5. SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // 6. streaming la Gemini
    const stream = await genAI.models.generateContentStream({
      model: 'gemini-3.1-flash-lite',
      config: { systemInstruction: systemPrompt },
      contents: [
        ...messages,
        { role: 'user', parts: [{ text: content }] }
      ]
    })

    // 10. update titlu chat (daca e primul mesaj)
    const allMessages = await getLastMessagesFromDB(chatId)
    if (allMessages.length <= 2) {
      const titleResponse = await genAI.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{
          role: 'user',
          parts: [{ 
            text: `Generate a short title (max 5 words) for a chat that starts with this question: "${content}". Return only the title, no quotes, no punctuation.` 
          }]
        }]
      })
      
      const title = titleResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'Chat nou'
      await updateChatTitleInDB(chatId, title)
    }

    // 7. trimiti fiecare chunk la frontend
    let fullResponse = ''
    for await (const chunk of stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      if (text) {
        fullResponse += text
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    // 8. semnalezi ca s-a terminat
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()

    // 9. salvezi raspunsul complet in BD
    await createMessageInDB(chatId, fullResponse, 'assistant')
    
    

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Eroare la procesarea mesajului' })
  }
}