import { useChatStore } from '@/store/chatStore'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import { chatCompletion } from '@/lib/ai'
import { ChatMessage } from '@/lib/storage'
import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function ChatArea({ showFiles, setShowFiles }: { showFiles?: boolean, setShowFiles?: (v: boolean) => void, theme?: string }) {
  const { chats, activeChatId, currentModel, createNewChat, setActiveChat } = useChatStore()
  const addMessage = useChatStore(s => s.addMessage)
  const updateLastMessage = useChatStore(s => s.updateLastMessage)
  const renameChat = useChatStore(s => s.renameChat)
  const activeChat = chats.find(c => c.id === activeChatId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reasoningText, setReasoningText] = useState('')
  const [chatSearch, setChatSearch] = useState('')
  const [showChatSearch, setShowChatSearch] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [typingLabel, setTypingLabel] = useState('Думает')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [modelInfoModal, setModelInfoModal] = useState<any>(null)
  const [fileViewer, setFileViewer] = useState<{ name: string, content: string, type: string } | null>(null)
  const [imageViewer, setImageViewer] = useState<string | null>(null)

  const filteredMessages = useMemo(() => {
    if (!activeChat) return []
    if (!chatSearch) return activeChat.messages.filter(m => !m.isGenerating)
    return activeChat.messages.filter(m => !m.isGenerating && m.content.toLowerCase().includes(chatSearch.toLowerCase()))
  }, [activeChat?.messages, chatSearch])

  const grouped = useMemo(() => groupByDate(filteredMessages), [filteredMessages])

  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 600
    if (isNearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [filteredMessages.length, isGenerating, reasoningText])

  useEffect(() => { setIsGenerating(false); setReasoningText('') }, [activeChatId])

  useEffect(() => {
    if (!isGenerating) return
    const labels = ['Думает', 'Печатает', 'Анализирует']
    let i = 0
    const int = setInterval(() => { i = (i + 1) % labels.length; setTypingLabel(labels[i]) }, 900)
    return () => clearInterval(int)
  }, [isGenerating])

  useEffect(() => {
    const onOpenImage = (e: any) => setImageViewer(e.detail.url)
    const onOpenFile = (e: any) => setFileViewer(e.detail)
    window.addEventListener('open-image' as any, onOpenImage)
    window.addEventListener('open-file' as any, onOpenFile)
    return () => {
      window.removeEventListener('open-image' as any, onOpenImage)
      window.removeEventListener('open-file' as any, onOpenFile)
    }
  }, [])

  const handleSend = async (text: string, opts?: { imageBase64?: string, fileContent?: string, fileName?: string }) => {
    if (isGenerating) return
    let targetChatId = activeChatId

    // FIX 1: If no active chat, create one first
    if (!targetChatId) {
      const newId = await createNewChat()
      targetChatId = newId
      setActiveChat(newId)
      // small delay to ensure chat exists in store
      await new Promise(r => setTimeout(r, 50))
    }

    if (!targetChatId) return

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: text || (opts?.fileName ? `${opts.fileName}` : ''),
      timestamp: Date.now(),
      attachments: opts?.imageBase64 ? [{ type: 'image', url: opts.imageBase64 }] : opts?.fileName ? [{ type: 'file', url: '', name: opts.fileName, content: opts.fileContent, size: opts.fileContent?.length }] : undefined
    }
    await addMessage(targetChatId, userMsg)

    const placeholderId = Math.random().toString(36).slice(2)
    const placeholder: ChatMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: currentModel,
      modelName: currentModel,
      isGenerating: true
    }
    await addMessage(targetChatId, placeholder)
    setIsGenerating(true)
    setReasoningText('Думаю…')

    try {
      const chat = useChatStore.getState().chats.find(c => c.id === targetChatId)
      const history = (chat?.messages || []).slice(-12).map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content + (m.attachments?.[0]?.name ? `\n[Файл: ${m.attachments[0].name}]` : '')
      }))
      history.push({ role: 'user', content: text + (opts?.fileName ? `\n[Файл: ${opts.fileName}]` : '') })

      const { text: answer, reasoning, error } = await chatCompletion(currentModel, history, {
        imageBase64: opts?.imageBase64,
        fileContent: opts?.fileContent,
        fileName: opts?.fileName
      })

      if (reasoning) setReasoningText(reasoning)

      // FAST streaming - no delay per char, chunked
      let current = ''
      const chunkSize = 4
      for (let i = 0; i < answer.length; i += chunkSize) {
        current = answer.slice(0, i + chunkSize)
        await updateLastMessage(targetChatId, current)
        // tiny delay only every 20 chars
        if (i % 20 === 0) await new Promise(r => setTimeout(r, 1))
      }

      const { chats } = useChatStore.getState()
      const chat2 = chats.find(c => c.id === targetChatId)
      if (chat2) {
        const msgs = [...chat2.messages]
        const idx = msgs.findIndex(m => m.id === placeholderId)
        if (idx !== -1) {
          msgs[idx] = { ...msgs[idx], content: answer, isGenerating: false, ...(error ? { error: true } : {}) } as any
          const updated = { ...chat2, messages: msgs, updatedAt: Date.now() }
          const { saveChat } = await import('@/lib/storage')
          await saveChat(updated)
          useChatStore.setState({ chats: chats.map(c => c.id === targetChatId ? updated : c) })
        }
      }
      setReasoningText('')
    } catch (e: any) {
      // FIX 3: Error in same bubble, not new
      await updateLastMessage(targetChatId, `Ошибка: ${e.message}`)
      const { chats } = useChatStore.getState()
      const chat = chats.find(c => c.id === targetChatId)
      if (chat) {
        const msgs = [...chat.messages]
        const idx = msgs.findIndex(m => m.id === placeholderId)
        if (idx !== -1) {
          msgs[idx] = { ...msgs[idx], isGenerating: false, error: true } as any
        } else {
          msgs[msgs.length-1] = { ...msgs[msgs.length-1], isGenerating: false, error: true } as any
        }
        const updated = { ...chat, messages: msgs, updatedAt: Date.now() }
        const { saveChat } = await import('@/lib/storage')
        await saveChat(updated)
        useChatStore.setState({ chats: chats.map(c => c.id === targetChatId ? updated : c) })
      }
    } finally {
      setIsGenerating(false)
      setReasoningText('')
    }
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    const { readFileAsText } = await import('@/lib/ai')
    for (const file of files) {
      if (file.size > 20*1024*1024) continue
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => handleSend('', { imageBase64: reader.result as string })
        reader.readAsDataURL(file)
      } else {
        try {
          const { content } = await readFileAsText(file)
          handleSend('', { fileContent: content, fileName: file.name })
        } catch {
          const reader = new FileReader()
          reader.onload = () => handleSend('', { fileContent: (reader.result as string).slice(0,20000), fileName: file.name })
          reader.readAsText(file)
        }
      }
    }
  }

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col bg-[#080808] min-h-0 relative" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {dragOver && <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-[2px] border-2 border-dashed border-white/20 z-20 flex items-center justify-center text-[14px] font-bold">Отпусти файл сюда</div>}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} className="text-center flex flex-col items-center max-w-[420px]">
            <div className="w-[88px] h-[88px] mx-auto rounded-[26px] overflow-hidden border border-white/[0.08] bg-white/[0.04] flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <img src="./logo-kayori.png" alt="Kayori" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-[26px] font-bold tracking-tight" style={{ fontWeight: 800 }}>Привет, я Kayori</h1>
            <p className="text-[#666] text-[13px] mt-2 font-medium leading-[1.5]">Напиши сообщение, перетащи файл или фото — я отвечу. Поддерживаю PDF, DOCX, TXT, HTML, код.</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {['Что в файле?', 'Напиши код', 'Объясни простыми словами', 'Сделай список'].map(q => (
                <button key={q} onClick={() => handleSend(q)} className="px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-[12px] font-medium hover:bg-white/[0.10] hover:text-white transition text-[#AAA]">{q}</button>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="p-3 md:p-4 shrink-0">
          <div className="max-w-[720px] mx-auto w-full">
            <InputBar onSend={handleSend} disabled={isGenerating} chatId={null} showFilesToggle={!!setShowFiles} showFiles={!!showFiles} onToggleFiles={() => setShowFiles && setShowFiles(!showFiles)} />
          </div>
        </div>

        {/* File viewer modal */}
        <AnimatePresence>
          {fileViewer && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[16px] flex items-center justify-center p-4" onClick={() => setFileViewer(null)}>
              <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="bg-[#151515] border border-white/[0.08] rounded-[20px] w-full max-w-[700px] max-h-[80vh] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="font-bold text-[13px] truncate">{fileViewer.name} • {fileViewer.type}</div>
                  <button onClick={() => setFileViewer(null)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.10]">×</button>
                </div>
                <div className="flex-1 overflow-auto p-4 text-[12px] leading-[1.6] whitespace-pre-wrap font-mono text-[#CCC]">{fileViewer.content.slice(0, 20000)}</div>
              </motion.div>
            </motion.div>
          )}
          {imageViewer && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-[16px] flex items-center justify-center p-4" onClick={() => setImageViewer(null)}>
              <img src={imageViewer} alt="viewer" className="max-w-[90vw] max-h-[85vh] rounded-[16px] object-contain" onClick={e => e.stopPropagation()} />
              <button onClick={() => setImageViewer(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">×</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#080808] min-w-0 min-h-0 relative" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {dragOver && <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-[2px] border-2 border-dashed border-white/20 z-20 flex items-center justify-center text-[14px] font-bold pointer-events-none">Отпусти файл сюда</div>}
      <div className="h-[52px] border-b border-white/[0.06] flex items-center justify-between px-4 md:px-5 shrink-0 bg-[#0A0A0A] sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {editingTitle ? (
            <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)} onBlur={() => { if (titleDraft.trim()) renameChat(activeChat.id, titleDraft.trim()); setEditingTitle(false) }} onKeyDown={e => { if (e.key === 'Enter') { if (titleDraft.trim()) renameChat(activeChat.id, titleDraft.trim()); setEditingTitle(false) } if (e.key === 'Escape') setEditingTitle(false) }} className="bg-[#151515] border border-[#222] rounded-[8px] px-3 py-1 text-[13px] font-semibold w-[260px] focus:outline-none focus:border-[#333]" autoFocus />
          ) : (
            <div className="text-[13px] font-semibold truncate cursor-pointer hover:text-white transition select-none" style={{ fontWeight: 700 }} onDoubleClick={() => { setTitleDraft(activeChat.title); setEditingTitle(true) }} title="Двойной клик — переименовать">{activeChat.title}</div>
          )}
          <div className="text-[10px] text-[#555] font-mono hidden md:block px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">{activeChat.messages.filter(m=>!m.isGenerating).length}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {setShowFiles && (
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowFiles(!showFiles)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${showFiles ? 'bg-white text-black border-white' : 'bg-[#151515] border-[#222] text-[#666] hover:text-white'}`} title={showFiles ? 'Скрыть файлы' : 'Показать файлы'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </motion.button>
          )}
          {showChatSearch ? (
            <div className="flex items-center gap-2">
              <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Поиск..." className="bg-[#151515] border border-[#222] rounded-full px-3 py-1.5 text-[12px] w-[160px] focus:outline-none focus:border-[#333] font-medium" autoFocus />
              <button onClick={() => { setShowChatSearch(false); setChatSearch('') }} className="w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center hover:bg-[#252525]">×</button>
            </div>
          ) : (
            <>
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowChatSearch(true)} className="w-8 h-8 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center hover:bg-[#1E1E1E] text-[#666] hover:text-white transition" title="Поиск в чате">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
              </motion.button>
              <div className="relative">
                <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowChatMenu(!showChatMenu)} className="w-8 h-8 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center hover:bg-[#1E1E1E] text-[#666] hover:text-white" title="Меню чата">⋯</motion.button>
                <AnimatePresence>
                  {showChatMenu && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="absolute right-0 top-full mt-2 w-[180px] bg-[#151515] border border-white/[0.08] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.6)] p-1 z-30">
                      <button onClick={() => { setShowChatMenu(false); setTitleDraft(activeChat.title); setEditingTitle(true) }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-white/[0.06]">Переименовать</button>
                      <button onClick={() => { setShowChatMenu(false); renameChat(activeChat.id, 'Новый чат') }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-white/[0.06]">Сбросить название</button>
                      <div className="h-[1px] bg-white/[0.06] my-1" />
                      <button onClick={() => { setShowChatMenu(false); useChatStore.getState().deleteChat(activeChat.id) }} className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] hover:bg-[#FF4444]/10 text-[#FF6666]">Удалить чат</button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <MessageBubble key={m.id} message={m} onOpenModelInfo={setModelInfoModal} />
              ))}
            </div>
          </div>
        ))}

        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#222] flex items-center justify-center shrink-0"><img src="./logo-kayori.png" alt="k" className="w-full h-full object-cover rounded-full" /></div>
              <div className="flex-1">
                <div className="bg-[#151515] border border-white/[0.06] rounded-[18px] rounded-bl-[6px] px-4 py-3.5">
                  <div className="flex items-center gap-3 text-[12px] text-[#AAA]">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full block" />
                    <span className="font-medium">{reasoningText}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-[#555]">
                    <div className="flex gap-1">
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1 h-1 bg-[#666] rounded-full" />
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-[#666] rounded-full" />
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-[#666] rounded-full" />
                    </div>
                    {typingLabel}…
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div className="h-6" />
      </div>

      <InputBar onSend={handleSend} disabled={isGenerating} chatId={activeChatId} showFilesToggle={!!setShowFiles} showFiles={!!showFiles} onToggleFiles={() => setShowFiles && setShowFiles(!showFiles)} />

      <AnimatePresence>
        {modelInfoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[16px] flex items-center justify-center p-4" onClick={() => setModelInfoModal(null)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="bg-[#151515] border border-white/[0.08] rounded-[24px] p-6 w-full max-w-[400px] shadow-[0_24px_64px_rgba(0,0,0,0.6)]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center"><img src="./logo-kayori.png" alt="k" className="w-6 h-6 rounded-full" /></div>
                <div><div className="font-bold text-[14px]">{modelInfoModal.name}</div><div className="text-[11px] text-[#666]">{modelInfoModal.provider} • {modelInfoModal.version}</div></div>
              </div>
              <div className="text-[12px] text-[#AAA] leading-[1.6]">{modelInfoModal.description}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(modelInfoModal.capabilities || []).map((c: string) => {
                  const labels: Record<string,string> = { photo: 'Читает фото', vision: 'Читает фото', code: 'Пишет код', text: 'Текст', reasoning: 'Рассуждает', auto: 'Авто выбор' }
                  return <span key={c} className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-medium">{labels[c] || c}</span>
                })}
              </div>
              <div className="mt-4 text-[11px] text-[#555]">Характер: {(modelInfoModal as any).personality}</div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModelInfoModal(null)} className="mt-6 w-full py-2.5 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition">Закрыть</motion.button>
            </motion.div>
          </motion.div>
        )}
        {fileViewer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[16px] flex items-center justify-center p-4" onClick={() => setFileViewer(null)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="bg-[#151515] border border-white/[0.08] rounded-[20px] w-full max-w-[700px] max-h-[80vh] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="font-bold text-[13px] truncate">{fileViewer.name} • {fileViewer.type}</div>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(fileViewer.content); }} className="px-3 py-1.5 rounded-full bg-white/[0.06] text-[11px] hover:bg-white/[0.10]">Копировать</button>
                  <button onClick={() => setFileViewer(null)} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.10]">×</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 text-[12px] leading-[1.6] whitespace-pre-wrap font-mono text-[#CCC]">{fileViewer.content.slice(0, 30000)}</div>
            </motion.div>
          </motion.div>
        )}
        {imageViewer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-[16px] flex items-center justify-center p-4" onClick={() => setImageViewer(null)}>
            <img src={imageViewer} alt="viewer" className="max-w-[90vw] max-h-[85vh] rounded-[16px] object-contain" onClick={e => e.stopPropagation()} />
            <button onClick={() => setImageViewer(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
