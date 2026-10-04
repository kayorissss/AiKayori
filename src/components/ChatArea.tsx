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
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return `Сегодня • ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
  if (isYesterday) return `Вчера • ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(messages: any[]) {
  const groups: { dateLabel: string; dateKey: string; msgs: any[] }[] = []
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

export default function ChatArea({
  showFiles,
  setShowFiles,
  theme = 'dark'
}: {
  showFiles?: boolean
  setShowFiles?: (v: boolean) => void
  theme?: string
}) {
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
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const isLight = theme === 'light'

  const filteredMessages = useMemo(() => {
    if (!activeChat) return []
    if (!chatSearch.trim()) return activeChat.messages
    const q = chatSearch.toLowerCase()
    return activeChat.messages.filter(m => m.content.toLowerCase().includes(q))
  }, [activeChat?.messages, chatSearch])

  const grouped = useMemo(() => groupByDate(filteredMessages), [filteredMessages])

  // Gentle scroll to bottom
  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 450
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [filteredMessages.length, isGenerating, reasoningText])

  useEffect(() => {
    setIsGenerating(false)
    setReasoningText('')
  }, [activeChatId])

  const handleSend = async (
    text: string,
    opts?: { imageBase64?: string; fileContent?: string; fileName?: string }
  ) => {
    let targetChatId = activeChatId
    if (!targetChatId) {
      targetChatId = useChatStore.getState().createNewChat()
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: text || (opts?.fileName ? `Файл: ${opts.fileName}` : ''),
      timestamp: Date.now(),
      attachments: opts?.imageBase64
        ? [{ type: 'image', url: opts.imageBase64 }]
        : opts?.fileName
        ? [{ type: 'file', url: '', name: opts.fileName, content: opts.fileContent }]
        : undefined
    }
    await addMessage(targetChatId, userMsg)

    const placeholder: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: currentModel,
      modelName: currentModel,
      isGenerating: true
    }
    await addMessage(targetChatId, placeholder)
    setIsGenerating(true)
    setReasoningText('')

    try {
      const chatNow = useChatStore.getState().chats.find(c => c.id === targetChatId)
      const history = (chatNow?.messages || []).slice(0, -1).slice(-16).map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))

      const { text: answer, reasoning } = await chatCompletion(currentModel, history, {
        imageBase64: opts?.imageBase64,
        fileContent: opts?.fileContent,
        fileName: opts?.fileName
      })

      if (reasoning) {
        setReasoningText(reasoning)
      }

      // Stream text smoothly
      let current = ''
      const step = Math.max(1, Math.floor(answer.length / 50))
      for (let i = 0; i < answer.length; i += step) {
        current = answer.slice(0, i + step)
        await updateLastMessage(targetChatId, current)
        await new Promise(r => setTimeout(r, 12))
      }
      await finalizeLastMessage(targetChatId, answer)
    } catch (e: any) {
      const errMsg = e.message || 'Произошла непредвиденная ошибка при запросе к ИИ.'
      const isMissingKey = errMsg.includes('MISSING_') || errMsg.includes('INVALID_')
      const formatted = isMissingKey
        ? `⚠️ **Внимание:** ${errMsg}\n\n*Нажмите кнопку ниже или откройте Настройки в левом меню, чтобы указать API-ключ.*`
        : `❌ **Ошибка запроса к ИИ:**\n\n${errMsg}`

      await finalizeLastMessage(targetChatId, formatted)
    } finally {
      setIsGenerating(false)
    }
  }

  // Theme styling
  const mainBg = isLight ? 'bg-[#F6F7F9]' : 'bg-[#080808]'
  const headerBg = isLight ? 'bg-white/90 border-black/10 text-[#111827]' : 'bg-[#0A0A0A]/90 border-white/[0.06] text-white'
  const cardBorder = isLight ? 'border-black/10' : 'border-white/[0.08]'
  const textColor = isLight ? 'text-[#111827]' : 'text-white'
  const subtextColor = isLight ? 'text-[#6B7280]' : 'text-[#888888]'
  const promptBtnBg = isLight
    ? 'bg-white border-black/10 text-[#1F2937] hover:bg-black/5 hover:border-black/20 shadow-sm'
    : 'bg-white/[0.05] border-white/[0.08] text-[#CCCCCC] hover:bg-white/[0.1] hover:text-white'

  // Empty state screen (when no active chat)
  if (!activeChat) {
    return (
      <div className={`flex-1 flex flex-col ${mainBg} min-w-0 min-h-0 relative transition-colors`}>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center w-full max-w-[580px] my-auto py-6"
          >
            <div className={`w-[64px] h-[64px] mx-auto rounded-[20px] overflow-hidden border ${cardBorder} ${
              isLight ? 'bg-white shadow-sm' : 'bg-white/[0.04]'
            } flex items-center justify-center mb-4`}>
              <img src="./logo-kayori.png" alt="Kayori" className="w-10 h-10 object-contain" />
            </div>

            <h1 className={`text-[22px] md:text-[24px] font-bold tracking-tight ${textColor}`}>
              AI-KAYORI
            </h1>
            <p className={`text-[13px] md:text-[14px] mt-1.5 font-medium ${subtextColor}`}>
              Ваш персональный ИИ ассистент с поддержкой фото, кода и документов
            </p>

            {/* Prompt suggestions */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {[
                {
                  title: '💻 Написание кода',
                  desc: 'Напиши функцию на JS для фильтрации массива объектов',
                  prompt: 'Напиши полезную функцию на TypeScript/JavaScript для фильтрации и группировки массива объектов с примерами использования.'
                },
                {
                  title: '💡 Простое объяснение',
                  desc: 'Объясни как работает машинное обучение',
                  prompt: 'Объясни простыми словами, как обучаются нейронные сети и современные большие языковые модели (LLM).'
                },
                {
                  title: '📝 Работа с текстом',
                  desc: 'Помоги составить структуру статьи или доклада',
                  prompt: 'Помоги составить детальный план и структуру статьи на тему современных технологий ИИ.'
                },
                {
                  title: '⚙️ Настройка API',
                  desc: 'Как подключить свой ключ Gemini или OpenAI?',
                  prompt: 'Расскажи, как настроить API ключи в этой программе (Google Gemini, Groq, OpenAI) и в чём их отличия.'
                }
              ].map(item => (
                <button
                  key={item.title}
                  onClick={() => {
                    const id = useChatStore.getState().createNewChat()
                    setTimeout(() => handleSend(item.prompt), 50)
                  }}
                  className={`p-3.5 rounded-[16px] border transition flex flex-col gap-1 text-left ${promptBtnBg}`}
                >
                  <div className="text-[12.5px] font-bold">{item.title}</div>
                  <div className={`text-[11px] line-clamp-2 ${subtextColor}`}>{item.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Input Bar fixed cleanly at bottom */}
        <InputBar
          onSend={handleSend}
          disabled={isGenerating}
          chatId={'empty'}
          theme={theme}
          showFilesToggle={!!setShowFiles}
          showFiles={!!showFiles}
          onToggleFiles={() => setShowFiles && setShowFiles(!showFiles)}
        />
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col ${mainBg} min-w-0 min-h-0 relative transition-colors`}>
      {/* Chat Top Header */}
      <div className={`h-[52px] border-b ${headerBg} backdrop-blur-md flex items-center justify-between px-4 md:px-5 shrink-0 sticky top-0 z-10`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {editingTitle ? (
            <input
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={() => {
                if (titleDraft.trim()) renameChat(activeChat.id, titleDraft.trim())
                setEditingTitle(false)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (titleDraft.trim()) renameChat(activeChat.id, titleDraft.trim())
                  setEditingTitle(false)
                }
                if (e.key === 'Escape') setEditingTitle(false)
              }}
              className={`border ${cardBorder} rounded-[8px] px-2.5 py-1 text-[13px] font-bold w-[240px] max-w-full ${
                isLight ? 'bg-white text-black' : 'bg-[#151515] text-white'
              }`}
              autoFocus
            />
          ) : (
            <div
              className={`text-[13.5px] font-bold truncate cursor-pointer select-none ${textColor}`}
              onDoubleClick={() => {
                setTitleDraft(activeChat.title)
                setEditingTitle(true)
              }}
              title="Двойной клик — переименовать"
            >
              {activeChat.title}
            </div>
          )}
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${cardBorder} ${subtextColor} shrink-0`}>
            {activeChat.messages.length} сообщ.
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {setShowFiles && (
            <button
              onClick={() => setShowFiles(!showFiles)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                showFiles
                  ? isLight
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-white'
                  : isLight
                  ? 'bg-black/5 border-black/10 text-[#4B5563] hover:text-black'
                  : 'bg-white/[0.06] border-white/[0.08] text-[#888] hover:text-white'
              }`}
              title={showFiles ? 'Скрыть файлы' : 'Показать файлы'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </button>
          )}

          {showChatSearch ? (
            <div className="flex items-center gap-1.5">
              <input
                value={chatSearch}
                onChange={e => setChatSearch(e.target.value)}
                placeholder="Поиск..."
                className={`border ${cardBorder} rounded-full px-3 py-1 text-[12px] w-[130px] md:w-[170px] ${
                  isLight ? 'bg-white text-black' : 'bg-[#151515] text-white'
                }`}
                autoFocus
              />
              <button
                onClick={() => {
                  setShowChatSearch(false)
                  setChatSearch('')
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] ${
                  isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowChatSearch(true)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                  isLight
                    ? 'bg-black/5 border-black/10 text-[#4B5563] hover:text-black'
                    : 'bg-white/[0.06] border-white/[0.08] text-[#888] hover:text-white'
                }`}
                title="Поиск в чате"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="6" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowChatMenu(!showChatMenu)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition font-bold ${
                    isLight
                      ? 'bg-black/5 border-black/10 text-[#4B5563] hover:text-black'
                      : 'bg-white/[0.06] border-white/[0.08] text-[#888] hover:text-white'
                  }`}
                  title="Меню чата"
                >
                  ⋯
                </button>
                {showChatMenu && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-[180px] border rounded-[14px] p-1.5 z-30 shadow-xl ${
                      isLight ? 'bg-white border-black/10 text-black' : 'bg-[#181818] border-white/[0.08] text-white'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setShowChatMenu(false)
                        setTitleDraft(activeChat.title)
                        setEditingTitle(true)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-[8px] text-[12px] font-medium transition ${
                        isLight ? 'hover:bg-black/5' : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      ✎ Переименовать
                    </button>
                    <button
                      onClick={() => {
                        setShowChatMenu(false)
                        renameChat(activeChat.id, 'Новый диалог')
                      }}
                      className={`w-full text-left px-3 py-2 rounded-[8px] text-[12px] font-medium transition ${
                        isLight ? 'hover:bg-black/5' : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      ↺ Сбросить заголовок
                    </button>
                    <div className={`h-[1px] my-1 ${isLight ? 'bg-black/5' : 'bg-white/[0.06]'}`} />
                    <button
                      onClick={() => {
                        setShowChatMenu(false)
                        useChatStore.getState().deleteChat(activeChat.id)
                      }}
                      className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] font-medium text-rose-500 hover:bg-rose-500/10 transition"
                    >
                      Удалить чат
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 md:p-6 space-y-4 scrollbar-thin">
        {grouped.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-12 h-12 mx-auto rounded-[16px] border ${cardBorder} flex items-center justify-center mb-3 ${
              isLight ? 'bg-white' : 'bg-white/[0.04]'
            }`}>
              <img src="./logo-kayori.png" alt="Kayori" className="w-7 h-7 object-contain" />
            </div>
            <div className={`text-[14px] font-bold ${textColor}`}>Диалог пуст</div>
            <div className={`text-[12px] mt-1 ${subtextColor}`}>Напишите первое сообщение ниже</div>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.dateKey}>
              {/* Date divider badge */}
              <div className="flex justify-center my-5">
                <div className={`px-3 py-0.5 rounded-full border text-[11px] font-medium ${cardBorder} ${
                  isLight ? 'bg-black/5 text-[#6B7280]' : 'bg-white/[0.04] text-[#888]'
                }`}>
                  {group.dateLabel}
                </div>
              </div>

              {/* Messages list */}
              <div className="space-y-4">
                {group.msgs.map((m: any) => (
                  <MessageBubble key={m.id} message={m} theme={theme} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Real Reasoning Box if model is thinking */}
        {isGenerating && (
          <div className="mt-4">
            {reasoningText && (
              <div className={`mb-3 rounded-[12px] border overflow-hidden ${
                isLight ? 'bg-white border-black/10' : 'bg-[#111] border-white/[0.08]'
              }`}>
                <button
                  onClick={() => setReasoningOpen(!reasoningOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-semibold transition ${
                    isLight ? 'text-[#4B5563] hover:text-black' : 'text-[#AAA] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>💭 Ход рассуждений модели</span>
                  </span>
                  <span className={`transition-transform ${reasoningOpen ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                {reasoningOpen && (
                  <div className={`px-3.5 pb-3 text-[11px] leading-[1.6] border-t whitespace-pre-wrap ${
                    isLight ? 'text-[#374151] border-black/5' : 'text-[#888] border-white/[0.05]'
                  }`}>
                    {reasoningText}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <InputBar
        onSend={handleSend}
        disabled={isGenerating}
        chatId={activeChatId}
        theme={theme}
        showFilesToggle={!!setShowFiles}
        showFiles={!!showFiles}
        onToggleFiles={() => setShowFiles && setShowFiles(!showFiles)}
      />
    </div>
  )
}
