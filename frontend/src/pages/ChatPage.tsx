import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'
import {
  Plus,
  Send,
  FileText,
  LogOut,
  Bot,
  User,
  MessageSquare,
  Pencil,
  Menu,
  X,
  Trash2,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Chat {
  id: string
  title: string
  created_at: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function ChatPage() {
  const token = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  // Close sidebar on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const fetchChats = useCallback(async () => {
    if (!token) return
    const res = await fetch(`${API_URL}/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setChats(await res.json())
  }, [token])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const fetchMessages = useCallback(
    async (chatId: string) => {
      if (!token) return
      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setMessages(await res.json())
    },
    [token]
  )

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId)
    fetchMessages(chatId)
    setSidebarOpen(false)
  }

  const deleteChat = async (chatId: string) => {
    if (!token) return
    setChats(prev => prev.filter(c => c.id !== chatId))
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setMessages([])
    }
    await fetch(`${API_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const createNewChat = async () => {
    if (!token) return
    const res = await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'New Chat' }),
    })
    if (res.ok) {
      const chat: Chat = await res.json()
      setChats(prev => [chat, ...prev])
      setActiveChatId(chat.id)
      setMessages([])
      setSidebarOpen(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId || !token || streaming) return

    const content = input.trim()
    setInput('')
    setStreaming(true)

    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() },
      { id: `a-${Date.now()}`, role: 'assistant', content: '', created_at: new Date().toISOString() },
    ])

    try {
      const res = await fetch(`${API_URL}/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!res.ok || !res.body) return

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let streamDone = false

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue

          let chunk = ''
          try {
            const parsed = JSON.parse(raw) as Record<string, unknown>
            if (parsed.done === true) {
              fetchChats()
              streamDone = true
              break
            }
            chunk = String(parsed.content ?? parsed.delta ?? parsed.text ?? '')
          } catch {
            chunk = raw
          }

          if (!chunk) continue
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (!last || last.role !== 'assistant') return prev
            return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
          })
        }
      }
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-800 bg-zinc-900',
          'transition-transform duration-300 ease-in-out',
          'md:relative md:z-auto md:w-64 md:shrink-0 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-[15px]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-600/30">
              <Bot className="size-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-zinc-100">BIM Chat</span>
          </div>
          {/* Close button – mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* New chat */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={createNewChat}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Plus className="size-4 shrink-0" />
            New chat
          </button>
        </div>

        {/* Chat list */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
          {chats.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-zinc-600">No chats yet</p>
          )}
          {chats.map(chat => (
            <div
              key={chat.id}
              className={cn(
                'flex min-h-[44px] items-center rounded-lg transition-colors',
                activeChatId === chat.id
                  ? 'bg-zinc-800'
                  : 'hover:bg-zinc-800/60'
              )}
            >
              <button
                onClick={() => selectChat(chat.id)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-sm',
                  activeChatId === chat.id
                    ? 'text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <MessageSquare className="size-3.5 shrink-0 opacity-50" />
                <span className="truncate">{chat.title}</span>
              </button>
              <button
                onClick={() => deleteChat(chat.id)}
                className="mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-950/50 hover:text-red-400"
                aria-label="Delete chat"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-3 py-3 space-y-0.5">
          <Link to="/documents" className="block">
            <button className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
              <FileText className="size-4 shrink-0" />
              Documents
            </button>
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <LogOut className="size-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-zinc-950">

        {/* Mobile top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-blue-600">
              <Bot className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">BIM Chat</span>
          </div>
          <button
            onClick={createNewChat}
            className="flex size-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="New chat"
          >
            <Pencil className="size-4" />
          </button>
        </div>

        {activeChatId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-[680px] space-y-5 px-4 py-6 md:space-y-6 md:px-6 md:py-8">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2.5 md:gap-3',
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full md:size-8',
                        msg.role === 'user'
                          ? 'bg-zinc-700 text-zinc-300'
                          : 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <User className="size-3.5 md:size-4" />
                      ) : (
                        <Bot className="size-3.5 md:size-4" />
                      )}
                    </div>

                    {/* Bubble */}
                    {msg.role === 'user' ? (
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm shadow-blue-600/20 whitespace-pre-wrap md:max-w-[78%] md:px-4 md:py-3">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-800 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap md:max-w-[78%] md:px-4 md:py-3">
                        {msg.content === '' ? (
                          <span className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-zinc-500 animate-bounce" />
                            <span className="size-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.15s]" />
                            <span className="size-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.3s]" />
                          </span>
                        ) : (
                          msg.content
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-zinc-800/60 bg-zinc-950 px-3 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">
              <div className="mx-auto max-w-[680px]">
                <div className="flex items-end gap-2.5 rounded-2xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 transition-all focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-blue-500/20 md:gap-3 md:px-4 md:py-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message BIM Chat…"
                    rows={1}
                    disabled={streaming}
                    className="flex-1 resize-none bg-transparent py-0.5 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
                    style={{ maxHeight: '160px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || streaming}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30 md:size-8"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
                <p className="mt-2 hidden text-center text-xs text-zinc-600 md:block">
                  Enter to send · Shift+Enter for newline
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/30 md:size-16">
              <Bot className="size-7 text-blue-500 md:size-8" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-zinc-100 md:text-xl">How can I help you?</h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                Select a chat or start a new conversation
              </p>
            </div>
            <button
              onClick={createNewChat}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-500"
            >
              <Pencil className="size-4" />
              New chat
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
