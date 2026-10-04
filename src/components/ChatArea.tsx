import { useChatStore } from '@/store/chatStore'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import { chatCompletion } from '@/lib/ai'
import { ChatMessage } from '@/lib/storage'
import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

function formatDateSeparator(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(now.getDate()-1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return `Сегодня • ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
  if (isYesterday) return `Вчера • ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(messages: any[]) {
  const groups: { dateLabel: string, dateKey: string, msgs: any[] }[] = []
  let currentKey = ''
  let currentGroup: any = null
  messages.forEach(m => {
    const key = new Date(m.timestamp).toDateString()
    if (key !== currentKey) {
      currentKey = key
      currentGroup = { dateKey: key, dateLabel: formatDateSeparator(m.timestamp), msgs: [] }
      groups.push(currentGroup)
    }
    currentGroup.msgs.push(m)
  })
  return groups
}

export default function ChatArea({ showFiles, setShowFiles, theme }: { showFiles?: boolean, setShowFiles?: (v: boolean) => void, theme?: string }) {
  const { chats, activeChatId, currentModel } = useChatStore()
  const addMessage = useChatStore(s => s.addMessage)
  const updateLastMessage = useChatStore(s => s.updateLastMessage)
  const finalizeLastMessage = useChatStore(s => s.finalizeLastMessage)
  const renameChat = useChatStore(s => s.renameChat)
  const activeChat = chats.find(c => c.id === activeChatId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reasoningText, setReasoningText] = useState('')
  const [reasoningOpen, setReasoningOpen] = useState(true)
  const [chatSearch, setChatSearch] = useState('')
  const [showChatSearch, setShowChatSearch] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [typingLabel, setTypingLabel] = useState('Думает')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const filteredMessages = useMemo(() => {
    if (!activeChat) return []
    if (!chatSearch) return activeChat.messages
    return activeChat.messages.filter(m => m.content.toLowerCase().includes(chatSearch.toLowerCase()))
  }, [activeChat?.messages, chatSearch])

  const grouped = useMemo(() => groupByDate(filteredMessages), [filteredMessages])

  // Auto scroll only if user near bottom, allow scroll during typing
  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 400
    if (isNearBottom) {
      // don't block user scroll - just gentle scroll
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [filteredMessages.length, isGenerating, reasoningText])

  useEffect(() => { setIsGenerating(false); setReasoningText('') }, [activeChatId])

  // Varied typing indicator
  useEffect(() => {
    if (!isGenerating) return
    const labels = ['Думает', 'Печатает', 'Размышляет', 'Анализирует']
    let i = 0
    const int = setInterval(() => { i = (i + 1) % labels.length; setTypingLabel(labels[i]) }, 1200)
    return () => clearInterval(int)
  }, [isGenerating])

  const handleSend = async (text: string, opts?: { imageBase64?: string, fileContent?: string, fileName?: string }) => {
    if (!activeChatId) return
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: text || (opts?.fileName ? `Файл: ${opts.fileName}` : ''),
      timestamp: Date.now(),
      attachments: opts?.imageBase64 ? [{ type: 'image', url: opts.imageBase64 }] : opts?.fileName ? [{ type: 'file', url: '', name: opts.fileName, content: opts.fileContent }] : undefined
    }
    await addMessage(activeChatId, userMsg)

    const placeholder: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: currentModel,
      modelName: currentModel,
      isGenerating: true
    }
    await addMessage(activeChatId, placeholder)
    setIsGenerating(true)
    setReasoningText('Думаю 1.2 сек... Анализирую запрос')
    setReasoningOpen(true)

    try {
      const history = (activeChat?.messages || []).slice(-16).map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content + (m.attachments?.[0]?.name ? `\n[Файл: ${m.attachments[0].name}]\n${(m.attachments[0].content || '').slice(0,2000)}` : '')
      }))
      history.push({ role: 'user', content: text + (opts?.fileName ? `\n[Файл: ${opts.fileName}]\n${(opts.fileContent || '').slice(0,8000)}` : '') })

      const { text: answer, reasoning } = await chatCompletion(currentModel, history, {
        imageBase64: opts?.imageBase64,
        fileContent: opts?.fileContent
      })

      // Show reasoning like DeepSeek
      if (reasoning) {
        setReasoningText(reasoning)
        await new Promise(r => setTimeout(r, 600))
      }

      let current = ''
      for (let i = 0; i < answer.length; i += 2) {
        current = answer.slice(0, i + 2)
        await updateLastMessage(activeChatId, current)
        await new Promise(r => setTimeout(r, 8 + Math.random()*14))
      }
      await finalizeLastMessage(activeChatId, answer)
      setReasoningText('')
    } catch (e: any) {
      await updateLastMessage(activeChatId, `Ошибка: ${e.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-end pb-[28%] p-4 md:p-8 bg-[#080808] relative overflow-hidden min-h-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="text-center relative z-10 w-full max-w-[420px]">
          <div className="w-[64px] h-[64px] mx-auto rounded-[18px] overflow-hidden border border-white/[0.08] bg-white/[0.04] flex items-center justify-center mb-4">
            <img src="./logo-kayori.png" alt="Kayori" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[20px] font-bold tracking-tight" style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 700 }}>Начни диалог</h1>
          <p className="text-[#666] text-[13px] mt-1.5 font-medium">Напиши сообщение или загрузи файл</p>
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Почему другу жарко, а мне холодно?', prompt: 'Почему моему другу жарко хотя в комнате холодно, ну типа я вот под одеялом лежу и нормально, а ноги достаю и холодно, я живу в Сигаево, 3° на улице, в комнате нету отопления, не дали' },
              { label: 'Создай кликер-игру', prompt: 'Создай кликер-игру html' },
              { label: 'Калькулятор', prompt: 'Создай красивый калькулятор html' },
              { label: 'Погода в Сигаево', prompt: 'Погода в Сигаево сейчас' }
            ].map(item => (
              <button key={item.label} onClick={() => { const id = useChatStore.getState().createNewChat(); setTimeout(() => handleSend(item.prompt), 80) }} className="px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/[0.06] text-[12px] text-[#999] font-medium hover:bg-white/[0.10] hover:text-white transition">
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
        <div className="absolute bottom-6 w-full flex justify-center">
          <div className="w-full max-w-[720px] px-4">
            <InputBar onSend={handleSend} disabled={isGenerating} chatId={'empty'} showFilesToggle={!!setShowFiles} showFiles={!!showFiles} onToggleFiles={() => setShowFiles && setShowFiles(!showFiles)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#080808] min-w-0 min-h-0 relative">
      <div className="h-[52px] border-b border-white/[0.06] flex items-center justify-between px-4 md:px-5 shrink-0 bg-[#0A0A0A] sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {editingTitle ? (
            <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)} onBlur={() => { if (titleDraft.trim()) renameChat(activeChat.id, titleDraft.trim()); setEditingTitle(false) }} onKeyDown={e => { if (e.key === 'Enter') { if (titleDraft.trim()) renameChat(activeChat.id, titleDraft.trim()); setEditingTitle(false) } if (e.key === 'Escape') setEditingTitle(false) }} className="bg-[#151515] border border-[#222] rounded-[8px] px-3 py-1 text-[13px] font-semibold w-[260px] focus:outline-none focus:border-[#333]" autoFocus />
          ) : (
            <div className="text-[13px] font-semibold truncate cursor-pointer hover:text-white transition select-none" style={{ fontWeight: 700 }} onDoubleClick={() => { setTitleDraft(activeChat.title); setEditingTitle(true) }} title="Двойной клик — переименовать">
              {activeChat.title}
            </div>
          )}
          <div className="text-[10px] text-[#555] font-mono hidden md:block px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">{activeChat.messages.length}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {setShowFiles && (
            <button onClick={() => setShowFiles(!showFiles)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${showFiles ? 'bg-white text-black border-white' : 'bg-[#151515] border-[#222] text-[#666] hover:text-white'}`} title={showFiles ? 'Скрыть файлы' : 'Показать файлы'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </button>
          )}
          {showChatSearch ? (
            <div className="flex items-center gap-2">
              <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Поиск..." className="bg-[#151515] border border-[#222] rounded-full px-3 py-1.5 text-[12px] w-[160px] focus:outline-none focus:border-[#333] font-medium" autoFocus />
              <button onClick={() => { setShowChatSearch(false); setChatSearch('') }} className="w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center hover:bg-[#252525]">×</button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowChatSearch(true)} className="w-8 h-8 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center hover:bg-[#1E1E1E] text-[#666] hover:text-white transition" title="Поиск в чате">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
              <div className="relative">
                <button onClick={() => setShowChatMenu(!showChatMenu)} className="w-8 h-8 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center hover:bg-[#1E1E1E] text-[#666] hover:text-white" title="Меню чата">⋯</button>
                {showChatMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[180px] bg-[#151515] border border-white/[0.08] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.6)] p-1 z-30">
                    <button onClick={() => { setShowChatMenu(false); setTitleDraft(activeChat.title); setEditingTitle(true) }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-white/[0.06]">✎ Переименовать</button>
                    <button onClick={() => { setShowChatMenu(false); renameChat(activeChat.id, 'Новый чат') }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-white/[0.06]">↺ Сбросить название</button>
                    <div className="h-[1px] bg-white/[0.06] my-1" />
                    <button onClick={() => { setShowChatMenu(false); useChatStore.getState().deleteChat(activeChat.id) }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-[#FF4444]/10 text-[#FF6666]">Удалить чат</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 md:p-6 space-y-0 scrollbar-thin">
        {grouped.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-12 h-12 mx-auto rounded-[14px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3"><img src="./logo-kayori.png" alt="k" className="w-7 h-7 rounded-full object-cover" /></div>
            <div className="text-[14px] font-semibold">Начни диалог</div>
            <div className="text-[12px] text-[#666] mt-1">Напиши сообщение</div>
          </div>
        ) : grouped.map((group) => (
          <div key={group.dateKey}>
            <div className="flex justify-center my-6">
              <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-medium text-[#666]">{group.dateLabel}</div>
            </div>
            <div className="space-y-4">
              {group.msgs.map((m: any) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="mt-4">
            {reasoningText && (
              <div className="mb-3 rounded-[12px] border border-white/[0.06] bg-[#111] overflow-hidden">
                <button onClick={() => setReasoningOpen(!reasoningOpen)} className="w-full flex items-center justify-between px-3.5 py-2.5 text-[11px] font-medium text-[#888] hover:text-white transition">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center">◐</span>
                    Thought for {reasoningText.match(/[\d.]+/)?.[0] || '2.1'} seconds
                  </span>
                  <span className={`transition-transform ${reasoningOpen ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                {reasoningOpen && (
                  <div className="px-3.5 pb-3 text-[11px] leading-[1.6] text-[#777] border-t border-white/[0.04] pt-2.5 whitespace-pre-wrap">{reasoningText}</div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-[12px] text-[#666] px-1">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">{typingLabel}…</span>
            </div>
          </div>
        )}
        <div className="h-4" />
      </div>

      <InputBar onSend={handleSend} disabled={isGenerating} chatId={activeChatId} showFilesToggle={!!setShowFiles} showFiles={!!showFiles} onToggleFiles={() => setShowFiles && setShowFiles(!showFiles)} />
    </div>
  )
}
