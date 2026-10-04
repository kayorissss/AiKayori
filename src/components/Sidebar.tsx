import { APP_VERSION } from '@/lib/version'
import { useChatStore } from '@/store/chatStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'

interface Props {
  onOpenSettings: () => void
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  theme?: string
}

function groupChatsByDate(chats: any[]) {
  const now = new Date()
  const todayStr = now.toDateString()
  const yest = new Date(now)
  yest.setDate(now.getDate() - 1)
  const yestStr = yest.toDateString()
  const groups: { label: string; chats: any[] }[] = []
  const map: Record<string, any[]> = {}
  const order: string[] = []

  const fmt = (d: Date) =>
    d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })

  chats.forEach(chat => {
    if (chat.archived) return
    const d = new Date(chat.updatedAt)
    const ds = d.toDateString()
    let label: string
    if (ds === todayStr) label = 'Сегодня'
    else if (ds === yestStr) label = 'Вчера'
    else label = fmt(d)
    if (!map[label]) {
      map[label] = []
      order.push(label)
    }
    map[label].push(chat)
  })

  const sortedOrder = order.sort((a, b) => {
    if (a === 'Сегодня') return -1
    if (b === 'Сегодня') return 1
    if (a === 'Вчера') return -1
    if (b === 'Вчера') return 1
    return 0
  })

  sortedOrder.forEach(l => groups.push({ label: l, chats: map[l] }))
  return groups
}

export default function Sidebar({
  onOpenSettings,
  collapsed,
  onToggle,
  isMobile = false,
  theme = 'dark'
}: Props) {
  const { chats, activeChatId, setActiveChat, createNewChat, deleteChat } = useChatStore()
  const { searchQuery, setSearchQuery } = useChatStore()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [showArchive, setShowArchive] = useState(false)

  const isLight = theme === 'light'

  const filtered = useMemo(() => {
    const list = showArchive ? chats.filter(c => c.archived) : chats.filter(c => !c.archived)
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(c => c.title.toLowerCase().includes(q))
  }, [chats, searchQuery, showArchive])

  const grouped = useMemo(
    () => (showArchive ? [{ label: 'Архив', chats: filtered }] : groupChatsByDate(filtered)),
    [filtered, showArchive]
  )
  const archivedCount = chats.filter(c => c.archived).length

  const handleRename = (chat: any) => {
    setEditingId(chat.id)
    setEditTitle(chat.title)
    setMenuId(null)
  }

  const saveRename = () => {
    if (editingId && editTitle.trim()) {
      const { chats } = useChatStore.getState()
      const updated = chats.map(c => (c.id === editingId ? { ...c, title: editTitle.trim() } : c))
      // @ts-ignore
      useChatStore.setState({ chats: updated })
      useChatStore.getState().saveChats()
    }
    setEditingId(null)
  }

  useEffect(() => {
    const onClick = () => setMenuId(null)
    if (menuId) {
      document.addEventListener('click', onClick)
      return () => document.removeEventListener('click', onClick)
    }
  }, [menuId])

  // Theme styling tokens
  const sidebarBg = isLight ? 'bg-white' : 'bg-[#0A0A0A]'
  const borderCol = isLight ? 'border-black/10' : 'border-white/[0.06]'
  const textColor = isLight ? 'text-[#111827]' : 'text-white'
  const subtextColor = isLight ? 'text-[#6B7280]' : 'text-[#888]'
  const inputBg = isLight ? 'bg-[#F3F4F6]' : 'bg-white/[0.05]'
  const newChatBtn = isLight
    ? 'bg-[#111827] text-white hover:bg-black shadow-sm'
    : 'bg-white text-black hover:bg-white/90 shadow-sm'
  const menuBg = isLight
    ? 'bg-white border-black/10 text-black shadow-xl'
    : 'bg-[#151515] border-white/[0.08] text-white shadow-2xl'

  // Collapsed Sidebar (desktop only)
  if (collapsed && !isMobile) {
    return (
      <motion.div
        initial={false}
        animate={{ width: 68, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className={`${sidebarBg} border-r ${borderCol} flex flex-col items-center py-4 gap-3 shrink-0 overflow-hidden transition-colors`}
        style={{ width: '68px' } as any}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={`w-9 h-9 rounded-full border ${borderCol} flex items-center justify-center transition ${
            isLight ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/[0.06] hover:bg-white/[0.1] text-white'
          }`}
          title="Развернуть меню"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => createNewChat()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition ${newChatBtn}`}
          title="Новый диалог"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </motion.button>

        <div className={`w-6 h-[1px] ${borderCol} my-2`} />
        <div className="flex-1" />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className={`w-9 h-9 rounded-full border ${borderCol} flex items-center justify-center transition ${
            isLight ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/[0.05] hover:bg-white/[0.1] text-white'
          }`}
          title="Настройки"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z" />
          </svg>
        </motion.button>
      </motion.div>
    )
  }

  // Expanded Sidebar
  return (
    <motion.div
      initial={isMobile ? { x: -320 } : false}
      animate={isMobile ? { x: 0, opacity: 1 } : { opacity: 1, x: 0 }}
      exit={isMobile ? { x: -320 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`${sidebarBg} border-r ${borderCol} flex flex-col shrink-0 overflow-hidden h-full transition-colors`}
      style={{ width: isMobile ? 300 : 'var(--sidebar-width, 300px)' }}
    >
      {/* Search Header */}
      <div className="p-3.5 pb-2 flex items-center gap-2 shrink-0">
        <div className="flex-1 relative group">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск чатов..."
            className={`w-full ${inputBg} border ${borderCol} rounded-full py-2 pl-9 pr-8 text-[12.5px] font-medium transition ${
              isLight ? 'text-black placeholder:text-[#9CA3AF]' : 'text-white placeholder:text-[#666]'
            }`}
          />
          <svg
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtextColor}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="6" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isLight ? 'bg-black/10 text-black' : 'bg-white/10 text-white'
              }`}
            >
              ✕
            </button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={`w-9 h-9 rounded-full border ${borderCol} flex items-center justify-center transition shrink-0 ${
            isLight ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/[0.05] hover:bg-white/[0.1] text-white'
          }`}
          title="Свернуть меню"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>
      </div>

      {/* New Chat Button */}
      <div className="px-3.5 pb-2.5 shrink-0 flex gap-1.5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            createNewChat()
            if (isMobile) setTimeout(() => onToggle(), 100)
          }}
          className={`flex-1 rounded-full py-2.5 text-[13px] font-bold flex items-center justify-center gap-2 transition ${newChatBtn}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новый диалог
        </motion.button>

        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchive(!showArchive)}
            className={`w-10 rounded-full border flex items-center justify-center transition ${
              showArchive
                ? isLight
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-white'
                : isLight
                ? 'bg-black/5 border-black/10 text-[#4B5563]'
                : 'bg-white/[0.06] border-white/[0.08] text-[#888]'
            }`}
            title="Архив"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
            </svg>
          </button>
        )}
      </div>

      {showArchive && (
        <div className="px-4 py-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#666]">
            <span>Архив ({archivedCount})</span>
            <button onClick={() => setShowArchive(false)} className="text-[11px] normal-case text-[#4285F4] hover:underline">
              ← Назад
            </button>
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-4 min-h-0 scrollbar-thin">
        {grouped.length === 0 ? (
          <div className="px-3 py-16 text-center">
            <div className={`text-[12px] font-mono ${subtextColor}`}>
              {showArchive ? 'Архив пуст' : 'Нет диалогов'}
            </div>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label}>
              <div className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 font-bold ${subtextColor}`}>
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.chats.map((chat: any) => {
                  const isActive = activeChatId === chat.id
                  const isEditing = editingId === chat.id

                  return (
                    <div
                      key={chat.id}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-[12px] cursor-pointer border transition ${
                        isActive
                          ? isLight
                            ? 'bg-black/5 border-black/15 shadow-sm'
                            : 'bg-white/[0.08] border-white/[0.12]'
                          : isLight
                          ? 'border-transparent hover:bg-black/[0.03] hover:border-black/5'
                          : 'border-transparent hover:bg-white/[0.04] hover:border-white/[0.05]'
                      }`}
                    >
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => {
                          if (!isEditing) {
                            setActiveChat(chat.id)
                            if (isMobile) setTimeout(() => onToggle(), 100)
                          }
                        }}
                      >
                        {isEditing ? (
                          <input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onBlur={saveRename}
                            onKeyDown={e => e.key === 'Enter' && saveRename()}
                            autoFocus
                            className={`w-full rounded-full px-2.5 py-0.5 text-[12px] border outline-none ${
                              isLight ? 'bg-white text-black border-black/20' : 'bg-black text-white border-white/20'
                            }`}
                          />
                        ) : (
                          <>
                            <div
                              className={`text-[12.5px] truncate font-semibold ${
                                isActive ? (isLight ? 'text-black font-bold' : 'text-white') : textColor
                              }`}
                            >
                              {chat.title}
                            </div>
                            <div className={`text-[10.5px] truncate mt-0.5 ${subtextColor}`}>
                              {chat.messages[chat.messages.length - 1]?.content.slice(0, 36) || 'Пустой чат'}
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          // Bound check to keep menu within viewport
                          const x = Math.min(rect.right, window.innerWidth - 195)
                          const y = Math.min(rect.top + 25, window.innerHeight - 150)
                          setMenuPos({ x, y })
                          setMenuId(menuId === chat.id ? null : chat.id)
                        }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-[12px] opacity-0 group-hover:opacity-100 transition ${
                          isLight ? 'bg-black/5 border-black/5 text-[#555]' : 'bg-white/[0.06] border-white/[0.06] text-[#888]'
                        }`}
                        title="Опции"
                      >
                        ⋯
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Context Menu */}
      {menuId && menuPos && (
        <div
          className={`fixed w-[185px] border rounded-[14px] p-1.5 z-[220] ${menuBg}`}
          style={{ left: Math.max(10, menuPos.x - 170), top: menuPos.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const chat = chats.find(c => c.id === menuId)
              if (chat) handleRename(chat)
            }}
            className={`w-full text-left px-3 py-2 rounded-[8px] text-[12px] flex items-center gap-2 transition ${
              isLight ? 'hover:bg-black/5' : 'hover:bg-white/[0.06]'
            }`}
          >
            ✎ Переименовать
          </button>
          <button
            onClick={() => {
              const { chats } = useChatStore.getState()
              const updated = chats.map(c => (c.id === menuId ? { ...c, archived: !c.archived } : c))
              // @ts-ignore
              useChatStore.setState({ chats: updated })
              useChatStore.getState().saveChats()
              setMenuId(null)
            }}
            className={`w-full text-left px-3 py-2 rounded-[8px] text-[12px] flex items-center gap-2 transition ${
              isLight ? 'hover:bg-black/5' : 'hover:bg-white/[0.06]'
            }`}
          >
            📁 {chats.find(c => c.id === menuId)?.archived ? 'Вернуть из архива' : 'В архив'}
          </button>
          <div className={`h-[1px] my-1 ${isLight ? 'bg-black/5' : 'bg-white/[0.06]'}`} />
          <button
            onClick={() => {
              setMenuId(null)
              setConfirmId(menuId)
            }}
            className="w-full text-left px-3 py-2 rounded-[8px] text-[12px] text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition"
          >
            🗑️ Удалить
          </button>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-[8px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 10 }}
              className={`border ${borderCol} rounded-[20px] p-5 w-full max-w-[320px] shadow-2xl ${
                isLight ? 'bg-white text-black' : 'bg-[#181818] text-white'
              }`}
            >
              <div className="text-[15px] font-bold">Удалить этот диалог?</div>
              <div className={`text-[12px] mt-1.5 ${subtextColor}`}>История сообщений будет безвозвратно удалена.</div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setConfirmId(null)}
                  className={`flex-1 border ${borderCol} rounded-full py-2 text-[12px] font-medium ${
                    isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                  }`}
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    deleteChat(confirmId)
                    setConfirmId(null)
                  }}
                  className="flex-1 bg-rose-500 text-white rounded-full py-2 text-[12px] font-bold hover:bg-rose-600 transition"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Footer */}
      <div className={`p-2.5 border-t ${borderCol} shrink-0 flex items-center justify-between`}>
        <button
          onClick={onOpenSettings}
          className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-[12px] transition text-[12.5px] font-semibold ${
            isLight
              ? 'hover:bg-black/5 text-[#374151]'
              : 'hover:bg-white/[0.06] text-[#A3A3A3] hover:text-white'
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z" />
          </svg>
          <span>Настройки</span>
        </button>
        <span className={`text-[10px] font-mono pr-2 ${subtextColor}`}>v{APP_VERSION}</span>
      </div>
    </motion.div>
  )
}
