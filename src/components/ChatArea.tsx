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
  if (isToday) return `Сегодня • ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`
  if (isYesterday) return `Вчера • ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ChatArea() {
  const { chats, activeChatId, currentModel } = useChatStore()
  const addMessage = useChatStore(s => s.addMessage)
  const updateLastMessage = useChatStore(s => s.updateLastMessage)
  const finalizeLastMessage = useChatStore(s => s.finalizeLastMessage)
  const activeChat = chats.find(c => c.id === activeChatId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const [showChatSearch, setShowChatSearch] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)

  const grouped = useMemo(() => {
    if (!activeChat) return []
    const msgs = activeChat.messages.filter(m => !chatSearch || m.content.toLowerCase().includes(chatSearch.toLowerCase()))
    const result: { type: 'date' | 'msg', date?: string, msg?: any, ts?: number }[] = []
    let lastDate = ''
    msgs.forEach(m => {
      const dateStr = new Date(m.timestamp).toDateString()
      if (dateStr !== lastDate) {
        result.push({ type: 'date', date: formatDateSeparator(m.timestamp), ts: m.timestamp })
        lastDate = dateStr
      }
      result.push({ type: 'msg', msg: m })
    })
    return result
  }, [activeChat?.messages, chatSearch])

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 300
      if (isNearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [grouped, isGenerating])

  useEffect(() => { setIsGenerating(false) }, [activeChatId])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        el.scrollTop += e.deltaY * 4
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const handleSend = async (text: string, opts?: { imageBase64?: string, fileContent?: string, fileName?: string }) => {
    if (!activeChatId) return
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: text || (opts?.fileName ? `Отправил файл: ${opts.fileName}` : ''),
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

    try {
      const history = (activeChat?.messages || []).slice(-12).map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
      history.push({ role: 'user', content: text })

      const { text: answer } = await chatCompletion(currentModel, history, {
        imageBase64: opts?.imageBase64,
        fileContent: opts?.fileContent
      })

      let current = ''
      const chunkSize = 2
      for (let i = 0; i < answer.length; i += chunkSize) {
        current = answer.slice(0, i + chunkSize)
        await updateLastMessage(activeChatId, current)
        const delay = Math.random() > 0.8 ? 30 : 12
        await new Promise(r => setTimeout(r, delay))
      }
      await finalizeLastMessage(activeChatId, answer)
    } catch (e: any) {
      await updateLastMessage(activeChatId, `Ошибка: ${e.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#080808] relative overflow-hidden min-h-0">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center relative z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-[20px] overflow-hidden border border-white/[0.08] bg-white/[0.04] flex items-center justify-center mb-5">
            <img src="./logo-kayori.png" alt="Kayori" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[18px] md:text-[22px] font-bold tracking-tight" style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 700 }}>Начни диалог</h1>
          <p className="text-[#666] text-[13px] md:text-[14px] mt-2 font-medium">Напиши сообщение или загрузи файл</p>
          <button onClick={() => useChatStore.getState().createNewChat()} className="mt-6 px-6 py-3 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition">+ Новый чат</button>
          <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-[300px]">
            {['Создай кликер','Погода','Калькулятор'].map(t=>(
              <button key={t} onClick={() => { const id = useChatStore.getState().createNewChat(); setTimeout(() => handleSend(t), 100) }} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-[11px] md:text-[12px] text-[#888] font-medium hover:bg-white/[0.08] hover:text-white transition">{t}</button>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#080808] min-w-0 min-h-0 relative">
      <div className="h-[48px] md:h-[52px] border-b border-white/[0.06] flex items-center justify-between px-3 md:px-5 shrink-0 bg-[#0A0A0A] sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="text-[13px] md:text-[14px] font-medium truncate" style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 600 }}>{activeChat.title}</div>
          <div className="text-[10px] md:text-[11px] text-[#555] font-mono hidden md:block px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">{activeChat.messages.length} сообщений</div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          {showChatSearch ? (
            <div className="flex items-center gap-2">
              <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Поиск..." className="bg-[#151515] border border-[#222] rounded-full px-3 py-1.5 text-[12px] w-[140px] md:w-[200px] focus:outline-none focus:border-[#333] placeholder:text-[#555] font-medium" autoFocus />
              <button onClick={() => { setShowChatSearch(false); setChatSearch('') }} className="w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center hover:bg-[#252525]">×</button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowChatSearch(true)} className="w-8 h-8 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center hover:bg-[#1E1E1E] transition text-[#666] hover:text-[#AAA]" title="Поиск">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
              <div className="relative">
                <button onClick={() => setShowChatMenu(!showChatMenu)} className="w-8 h-8 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center hover:bg-[#1E1E1E] transition text-[#666] hover:text-white" title="Меню">⋯</button>
                {showChatMenu && (
                  <div className="absolute right-0 top-full mt-2 w-[160px] bg-[#1A1A1A] border border-white/[0.08] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-1 z-20">
                    <button onClick={() => { setShowChatMenu(false); const name = prompt('Новое название', activeChat.title); if (name) { const { chats } = useChatStore.getState(); const upd = chats.map(c => c.id === activeChat.id ? { ...c, title: name } : c); (useChatStore as any).setState({ chats: upd }) } }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-white/[0.06] flex items-center gap-2">Переименовать</button>
                    <button onClick={() => { setShowChatMenu(false); useChatStore.getState().deleteChat(activeChat.id) }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-[#FF4444]/10 text-[#FF6666] flex items-center gap-2">Удалить</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 md:p-6 space-y-4 md:space-y-6">
        {grouped.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <div className="w-12 h-12 md:w-14 md:h-14 mx-auto rounded-[16px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3"><img src="./logo-kayori.png" alt="k" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover" /></div>
            <div className="text-[14px] font-medium">Начни диалог</div>
            <div className="text-[12px] text-[#666] mt-1">Напиши сообщение</div>
          </div>
        ) : grouped.map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${idx}`} className="flex justify-center my-6">
                <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] md:text-[11px] font-medium text-[#666]">{item.date}</div>
              </div>
            )
          }
          return <MessageBubble key={item.msg.id} message={item.msg} />
        })}
        <div className="h-2" />
      </div>

      <InputBar onSend={handleSend} disabled={isGenerating} chatId={activeChatId} />
    </div>
  )
}
