import { useEffect, useMemo, useRef, useState } from 'react'
import { AppIcon } from '../../components/ui/icons'
import { askAiChat, getAiThread } from '../../services/aiApi'
import type { AppRoute } from '../../types/routes'
import { getDoctorProfile } from '../../utils/doctorProfile'
import './ai-assistant.css'

type AiAssistantProps = {
  onNavigate: (route: AppRoute) => void
}

type Message = {
  id: string
  from: 'ai' | 'user'
  text: string
  time: string
}

const defaultSuggestions = [
  'Give differential diagnosis',
  'What should I ask next?',
  'Red flags to rule out?',
]
const THREAD_STORAGE_KEY = 'doctor_ai_thread_id'
const TYPING_BASE_DELAY_MS = 60
const TYPING_VARIANCE_MS = 30
const TYPING_PUNCTUATION_PAUSE_MS = 320
const TYPING_START_DELAY_MS = 360

function nowTime() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const hh = h % 12 || 12
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${hh}:${m} ${ap}`
}

function contextualSuggestions(source: string) {
  const value = source.toLowerCase()
  if (/(fever|viral|dengue|body pain)/.test(value)) {
    return ['Probable differentials?', 'What tests first?', 'Any admission red flags?']
  }
  if (/(chest pain|breath|sob|palpitation)/.test(value)) {
    return ['ECG or cardiac enzymes?', 'Emergency signs to watch?', 'Immediate first-line steps?']
  }
  if (/(migraine|headache|neuro)/.test(value)) {
    return ['Neurological red flags?', 'First-line treatment?', 'When to refer?']
  }
  return defaultSuggestions
}

function renderRichText(text: string) {
  return text.split('\n').map((line, index) => (
    <span key={`${line}-${index}`} className="message-line">
      {line}
      {index < text.split('\n').length - 1 ? <br /> : null}
    </span>
  ))
}

function AiAssistant({ onNavigate }: AiAssistantProps) {
  const profile = getDoctorProfile()
  const doctorName = profile.fullName ?? 'Dr. Sarah Kumar'
  const [threadId] = useState(() => {
    const existing = localStorage.getItem(THREAD_STORAGE_KEY)
    if (existing) return existing
    const generated = `doc-ai-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(THREAD_STORAGE_KEY, generated)
    return generated
  })
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'ai',
      text: `Hello ${doctorName}. Share patient symptoms, history, vitals, or a working diagnosis. I will help with structured clinical guidance.`,
      time: nowTime(),
    },
  ])
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState(defaultSuggestions)
  const messagesRef = useRef<Message[]>(messages)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const typingSessionRef = useRef(0)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    return () => {
      typingSessionRef.current += 1
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!profile.userId) return

    void getAiThread(threadId)
      .then((rows) => {
        if (!active || rows.length === 0) return
        setMessages(
          rows.map((row, index) => ({
            id: `${index}-${row.createdAt ?? Date.now()}`,
            from: row.role === 'assistant' ? 'ai' : 'user',
            text: row.content,
            time: nowTime(),
          })),
        )
      })
      .catch(() => {
        // Keep local first-run assistant message.
      })

    return () => {
      active = false
    }
  }, [profile.userId, threadId])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const suggestions = useMemo(() => {
    if (!draft.trim()) return quickReplies
    return contextualSuggestions(draft)
  }, [draft, quickReplies])

  const typeAiMessage = async (message: Message) => {
    const session = typingSessionRef.current + 1
    typingSessionRef.current = session

    setMessages((prev) => [...prev, { ...message, text: '' }])

    const fullText = message.text
    if (!fullText) return

    await new Promise<void>((resolve) => {
      let index = 0
      const step = () => {
        if (typingSessionRef.current !== session) {
          resolve()
          return
        }

        index += 1
        const nextText = fullText.slice(0, index)
        setMessages((prev) => prev.map((item) => (item.id === message.id ? { ...item, text: nextText } : item)))

        if (index >= fullText.length) {
          resolve()
          return
        }

        const currentChar = fullText[index - 1] ?? ''
        const punctuationPause = /[,.!?]/.test(currentChar) ? TYPING_PUNCTUATION_PAUSE_MS : 0
        const jitter = Math.floor(Math.random() * TYPING_VARIANCE_MS)
        const delay = TYPING_BASE_DELAY_MS + jitter + punctuationPause
        window.setTimeout(step, delay)
      }

      window.setTimeout(step, TYPING_START_DELAY_MS)
    })
  }

  async function sendMessage(text?: string) {
    const content = (text ?? draft).trim()
    if (!content) return

    const userMessage: Message = {
      id: `${Date.now()}-u`,
      from: 'user',
      text: content,
      time: nowTime(),
    }

    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setIsTyping(true)

    try {
      const history = messagesRef.current.slice(-8).map((item) => ({
        role: item.from === 'user' ? ('user' as const) : ('assistant' as const),
        content: item.text,
      }))

      const result = await askAiChat({
        message:
          'You are assisting a doctor, not a patient. Write like a friendly Meta-style assistant: simple language, warm tone, short sentences, and occasional tiny typos so it feels human. Keep clinical guidance concise and practical, include red flags, possible investigations, and next-step guidance.\n\n' +
          content,
        history,
        threadId,
        userId: profile.userId,
        appContext: 'doctor',
      })

      setQuickReplies(contextualSuggestions(content))
      await typeAiMessage({
        id: `${Date.now()}-a`,
        from: 'ai',
        text: result.reply,
        time: nowTime(),
      })
    } catch {
      setQuickReplies(defaultSuggestions)
      await typeAiMessage({
        id: `${Date.now()}-fallback`,
        from: 'ai',
        text: 'AI is retrying. For now, share age, duration, vitals, comorbidities, and your provisional diagnosis so I can structure the case better.',
        time: nowTime(),
      })
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <section className="doctor-ai-page">
      <header className="doctor-ai-header">
        <button type="button" className="doctor-ai-back" onClick={() => onNavigate('dashboard')} aria-label="Back">
          <AppIcon name="arrow-left" />
        </button>
        <div>
          <h1 className="doctor-ai-title">AI Assistant</h1>
          <p className="doctor-ai-status"><span className="doctor-ai-dot" /> Clinical support active</p>
        </div>
      </header>

      <main ref={bodyRef} className="doctor-ai-body">
        {messages.map((message) => (
          <div key={message.id} className={`message-row ${message.from}`}>
            <div className="message-bubble bubble-enter">
              {message.from === 'ai' ? <span className="bubble-badge">Astikan AI</span> : null}
              <div>{renderRichText(message.text)}</div>
              <div className="message-time">{message.time}</div>
            </div>
          </div>
        ))}

        {isTyping ? (
          <div className="message-row ai">
            <div className="message-bubble">
              <span className="bubble-badge">Astikan AI</span>
              <div className="typing-bubble"><span /><span /><span /></div>
            </div>
          </div>
        ) : null}
      </main>

      <div className="composer-wrap">
        <div className="quick-actions">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => void sendMessage(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="doctor-ai-input">
          <button type="button" className="icon-btn" aria-label="voice">
            <AppIcon name="sparkles" />
          </button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Enter symptoms, vitals, provisional diagnosis..."
            onKeyDown={(event) => {
              if (event.key === 'Enter') void sendMessage()
            }}
          />
          <button type="button" className="send-btn" aria-label="send" onClick={() => void sendMessage()}>
            <AppIcon name="play" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default AiAssistant
