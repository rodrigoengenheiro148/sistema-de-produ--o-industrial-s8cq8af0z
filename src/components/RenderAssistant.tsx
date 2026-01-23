import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Minimize2,
  Maximize2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRenderAI } from '@/hooks/use-render-ai'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

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
        'Olá! Eu sou o Render, o assistente virtual do Grupo BR Render. Como posso ajudar você hoje?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { processQuery } = useRenderAI()

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

  // Formatting helpers
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMessageContent = (content: string) => {
    // Simple bold/bullet formatting
    return content.split('\n').map((line, i) => (
      <p
        key={i}
        className={cn('min-h-[1.2em]', line.startsWith('•') && 'pl-4')}
      >
        {line
          .split('**')
          .map((part, index) =>
            index % 2 === 1 ? (
              <strong key={index}>{part}</strong>
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
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 animate-in zoom-in duration-300 hover:scale-105 bg-primary text-primary-foreground"
        size="icon"
      >
        <Avatar className="h-10 w-10 cursor-pointer">
          <AvatarImage
            src="https://img.usecurling.com/p/128/128?q=cute%20robot%20mascot&style=3d"
            alt="Render"
          />
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
        <span className="sr-only">Abrir Assistente Render</span>
        <Badge
          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 border-2 border-white"
          variant="destructive"
        >
          <span className="sr-only">Notificação</span>
        </Badge>
      </Button>
    )
  }

  return (
    <div
      className={cn(
        'fixed right-4 z-50 transition-all duration-300 ease-in-out',
        isMinimized ? 'bottom-4 w-72' : 'bottom-4 w-[90vw] sm:w-[380px]',
      )}
    >
      <Card className="shadow-2xl border-primary/20 overflow-hidden flex flex-col max-h-[80vh]">
        <CardHeader
          className={cn(
            'flex flex-row items-center justify-between space-y-0 p-3 bg-primary text-primary-foreground cursor-pointer',
            isMinimized ? 'rounded-lg' : 'rounded-t-lg',
          )}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-white/20">
              <AvatarImage
                src="https://img.usecurling.com/p/128/128?q=cute%20robot%20mascot&style=3d"
                alt="Render"
              />
              <AvatarFallback className="bg-primary-foreground text-primary">
                <Bot size={16} />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-bold">Render</CardTitle>
              <p className="text-[10px] text-primary-foreground/80 font-normal">
                Assistente Virtual
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(!isMinimized)
              }}
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
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
              className="flex-1 h-[400px] p-4 bg-secondary/10"
              ref={scrollRef}
            >
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex w-full',
                      msg.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'flex flex-col max-w-[85%] space-y-1',
                        msg.role === 'user' ? 'items-end' : 'items-start',
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-white dark:bg-card border rounded-bl-none',
                        )}
                      >
                        {formatMessageContent(msg.content)}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex w-full justify-start">
                    <div className="flex items-center space-x-2 bg-white dark:bg-card border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 bg-background border-t">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  placeholder="Digite sua pergunta..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 rounded-full bg-secondary/20 border-primary/10 focus-visible:ring-primary/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-10 w-10 shrink-0"
                  disabled={!inputValue.trim() || isTyping}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
