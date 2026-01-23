import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Minimize2,
  Maximize2,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRenderAI } from '@/hooks/use-render-ai'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import logoUrl from '@/assets/logotipo-br-render.png'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function RenderAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Eu sou o **Render**, seu especialista em produção industrial. Agora posso verificar **estoques**, **acidez**, **correlações** e até **dados de mercado**. O que deseja saber?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { processQuery } = useRenderAI()

  // Inactivity Auto-Close Logic
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (isOpen && !isMinimized) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsOpen(false)
        setIsMinimized(false)
      }, 60000) // 60 seconds
    }
  }

  useEffect(() => {
    resetInactivityTimer()
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    }
  }, [isOpen, isMinimized, messages, isTyping])

  // Reset timer on user input
  const handleUserActivity = () => {
    resetInactivityTimer()
  }

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]',
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isOpen, isTyping])

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return

    handleUserActivity()
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    try {
      const responseText = await processQuery(userMsg.content)
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Desculpe, tive um problema ao processar sua solicitação. Tente novamente.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <p
        key={i}
        className={cn('min-h-[1.2em]', line.startsWith('•') && 'pl-4')}
      >
        {line
          .split(/(\*\*.*?\*\*)/)
          .map((part, index) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={index}>{part.replace(/\*\*/g, '')}</strong>
            ) : (
              <span key={index}>{part}</span>
            ),
          )}
      </p>
    ))
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-16 w-16 rounded-full shadow-2xl z-50 animate-in zoom-in duration-300 hover:scale-110 bg-primary border-4 border-white/20 transition-all"
        size="icon"
      >
        <Avatar className="h-12 w-12 cursor-pointer transition-transform hover:rotate-12">
          <AvatarImage
            src="https://img.usecurling.com/p/128/128?q=humanoid%20robot%20mascot&style=3d"
            alt="Render"
          />
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
        <span className="sr-only">Abrir Assistente Render</span>
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 border-2 border-white animate-pulse"
          variant="destructive"
        >
          1
        </Badge>
      </Button>
    )
  }

  return (
    <div
      className={cn(
        'fixed right-4 z-50 transition-all duration-500 ease-apple flex flex-col',
        isMinimized ? 'bottom-4 w-80' : 'bottom-4 w-[90vw] sm:w-[400px]',
      )}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      onKeyDown={handleUserActivity}
    >
      <Card
        className={cn(
          'shadow-2xl border-primary/20 overflow-hidden flex flex-col bg-white/95 dark:bg-card/95 backdrop-blur-sm transition-all duration-300',
          isMinimized ? 'h-auto' : 'h-[600px] max-h-[85vh]',
        )}
      >
        <CardHeader
          className={cn(
            'flex flex-row items-center justify-between space-y-0 p-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground cursor-pointer transition-all shrink-0',
            isMinimized ? 'rounded-lg' : 'rounded-t-lg',
          )}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-white/30 shadow-sm">
                <AvatarImage
                  src="https://img.usecurling.com/p/128/128?q=humanoid%20robot%20mascot&style=3d"
                  alt="Render"
                />
                <AvatarFallback className="bg-primary-foreground text-primary">
                  <Bot size={20} />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-primary"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold">Render</CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1 bg-white/20 text-white border-0"
                >
                  AI
                </Badge>
              </div>
              <div className="flex items-center gap-1 opacity-90">
                <img
                  src={logoUrl}
                  alt="BR Render"
                  className="h-3 w-auto brightness-0 invert"
                />
                <span className="text-[10px]">Assistant</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(!isMinimized)
              }}
            >
              {isMinimized ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Minimize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-white/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                setIsMinimized(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <ScrollArea
              className="flex-1 p-4 bg-slate-50 dark:bg-black/20 min-h-0"
              ref={scrollRef}
            >
              <div className="space-y-6 pb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex w-full animate-in slide-in-from-bottom-2 duration-300',
                      msg.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar className="h-6 w-6 mr-2 mt-1 shrink-0">
                        <AvatarImage src="https://img.usecurling.com/p/128/128?q=humanoid%20robot%20mascot&style=3d" />
                        <AvatarFallback>R</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'flex flex-col max-w-[85%] space-y-1',
                        msg.role === 'user' ? 'items-end' : 'items-start',
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-white dark:bg-card border rounded-bl-sm text-foreground',
                        )}
                      >
                        {formatMessageContent(msg.content)}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1 select-none">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex w-full justify-start animate-in fade-in duration-300">
                    <Avatar className="h-6 w-6 mr-2 mt-1">
                      <AvatarImage src="https://img.usecurling.com/p/128/128?q=humanoid%20robot%20mascot&style=3d" />
                    </Avatar>
                    <div className="flex items-center space-x-1.5 bg-white dark:bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm h-[44px]">
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 bg-background border-t shrink-0">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  placeholder="Pergunte sobre rendimentos, vendas..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 rounded-full bg-secondary/30 border-primary/10 focus-visible:ring-primary/20 pl-4"
                  onFocus={handleUserActivity}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    'rounded-full h-10 w-10 shrink-0 transition-all',
                    inputValue.trim()
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground',
                  )}
                  disabled={!inputValue.trim() || isTyping}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <div className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-yellow-500" />
                <span>IA conectada ao Supabase + Edge</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
