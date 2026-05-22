# Frontend Development Guide

## Design System
- Dark theme, modern, minimal — similar to ChatGPT/Claude UI
- Colors: dark backgrounds (#0f0f0f, #1a1a1a, #2a2a2a), white text, accent blue (#3b82f6)
- Rounded corners, subtle borders, clean typography
- Tailwind CSS only — no inline styles, no CSS files

## Component Conventions
- Functional components only, no class components
- Props typed with TypeScript interfaces
- Custom hooks for API calls — never fetch directly in components
- Loading states and error states always handled

## API Calls Convention

Always use this pattern for API calls:

```typescript
const token = useAuth()

const response = await fetch('http://localhost:3001/chats', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## SSE Streaming Convention

```typescript
const response = await fetch(`http://localhost:3001/chats/${chatId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ content })
})

const reader = response.body!.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = decoder.decode(value)
  const lines = text.split('\n').filter(line => line.startsWith('data: '))

  for (const line of lines) {
    const data = JSON.parse(line.replace('data: ', ''))
    if (data.done) break
    setCurrentMessage(prev => prev + data.text)
  }
}
```

## ChatPage Layout

```
┌─────────────────────────────────────────┐
│  Sidebar (w-64)  │  Main Chat Area      │
│                  │                      │
│  [+ New Chat]    │  Messages list       │
│                  │                      │
│  Chat 1          │  [user message]      │
│  Chat 2          │  [assistant message] │
│  Chat 3          │                      │
│                  │  [Input + Send btn]  │
│  [Documents btn] │                      │
└─────────────────────────────────────────┘
```

## DocumentsPage Layout

```
┌─────────────────────────────────────────┐
│  [← Back to Chat]                       │
│                                         │
│  Upload Document                        │
│  [Title input]                          │
│  [File input]                           │
│  [Upload button]                        │
│                                         │
│  Uploaded Documents                     │
│  [Document 1]                           │
│  [Document 2]                           │
└─────────────────────────────────────────┘
```

## File Structure
- Pages in `src/pages/`
- Reusable components in `src/components/`
- API hooks in `src/hooks/`
- No business logic in components — extract to hooks