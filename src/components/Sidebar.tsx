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
  const yest = new Date(now); yest.setDate(now.getDate()-1)
  const yestStr = yest.toDateString()
  const groups: { label: string, chats: any[] }[] = []
  const map: Record<string, any[]> = {}
  const order: string[] = []

  const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })

  chats.forEach(chat => {
    if (chat.archived) return // archived hidden from main
    const d = new Date(chat.updatedAt)
    const ds = d.toDateString()
    let label: string
    if (ds === todayStr) label = 'Сегодня'
    else if (ds === yestStr) label = 'Вчера'
    else label = fmt(d)
    if (!map[label]) { map[label] = []; order.push(label) }
    map[label].push(chat)
  })
  // Keep today yesterday first, rest by date desc
  const sortedOrder = order.sort((a,b) => {
    if (a === 'Сегодня') return -1
    if (b === 'Сегодня') return 1
    if (a === 'Вчера') return -1
    if (b === 'Вчера') return 1
    return 0
  })
  sortedOrder.forEach(l => groups.push({ label: l, chats: map[l] }))
  return groups
}

export default function Sidebar({ onOpenSettings, collapsed, onToggle, isMobile = false, theme }: Props) {
  const { chats, activeChatId, setActiveChat, createNewChat, deleteChat } = useChatStore()
  const { searchQuery, setSearchQuery } = useChatStore()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null)
  const [showArchive, setShowArchive] = useState(false)

  const filtered = useMemo(() => {
    let list = showArchive ? chats.filter(c => c.archived) : chats.filter(c => !c.archived)
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(c => c.title.toLowerCase().includes(q))
  }, [chats, searchQuery, showArchive])
  const grouped = useMemo(() => showArchive ? [{ label: 'Архив', chats: filtered }] : groupChatsByDate(filtered), [filtered, showArchive])
  const archivedCount = chats.filter(c => c.archived).length

  const handleRename = (chat: any) => {
    setEditingId(chat.id); setEditTitle(chat.title); setMenuId(null)
  }
  const saveRename = () => {
    if (editingId && editTitle.trim()) {
      const { chats } = useChatStore.getState()
      const updated = chats.map(c => c.id === editingId ? { ...c, title: editTitle.trim() } : c)
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

  if (collapsed && !isMobile) {
    return (
      <motion.div
        initial={false}
        animate={{ width: 72, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="bg-[#0A0A0A] border-r border-white/[0.06] flex flex-col items-center py-5 gap-3 shrink-0 overflow-hidden"
        style={{ width: '72px' } as any}
      >
        <motion.button whileTap={{ scale: 0.95 }} onClick={onToggle} className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => createNewChat()} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </motion.button>
        <div className="w-8 h-[1px] bg-white/[0.06] my-2" />
        <div className="flex-1" />
        <motion.button whileTap={{ scale: 0.95 }} onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition" title="Настройки">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z"/></svg>
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={isMobile ? { x: -320 } : false}
      animate={isMobile ? { x: 0, opacity: 1 } : { opacity: 1, x: 0 }}
      exit={isMobile ? { x: -320 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="bg-[#0A0A0A] border-r border-white/[0.06] flex flex-col shrink-0 overflow-hidden h-full"
      style={{ width: isMobile ? 320 : 'var(--sidebar-width, 320px)' }}
    >
      <div className="p-4 flex items-center gap-2.5 shrink-0">
        <div className="flex-1 relative group">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск чатов..." className="w-full bg-white/[0.05] border border-white/[0.06] rounded-full py-2.5 pl-10 pr-10 text-[13px] placeholder:text-[#555] focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.07] transition font-medium" style={{ fontWeight: 600 }} />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] text-[#888] hover:text-white">×</button>}
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onToggle} className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition shrink-0" title="Скрыть">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </motion.button>
      </div>

      <div className="px-4 pb-3 shrink-0 flex gap-2">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => { createNewChat(); if (isMobile) setTimeout(() => onToggle(), 100) }} className="flex-1 bg-white text-black rounded-full py-3.5 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition" style={{ fontWeight: 700 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg> Новый чат
        </motion.button>
        {archivedCount > 0 && (
          <button onClick={() => setShowArchive(!showArchive)} className={`w-[44px] rounded-full border flex items-center justify-center transition ${showArchive ? 'bg-white text-black border-white' : 'bg-white/[0.06] border-white/[0.06] text-[#666] hover:text-white'}`} title="Архив">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg>
          </button>
        )}
      </div>

      {showArchive && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-[#666] px-2">
            <span>Архив • {archivedCount}</span>
            <button onClick={() => setShowArchive(false)} className="text-[10px] normal-case font-medium hover:text-white">← Назад</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 min-h-0">
        {grouped.length === 0 ? (
          <div className="px-3 py-24 text-center"><div className="w-10 h-10 mx-auto rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-2"><span className="text-[#333]">—</span></div><div className="text-[11px] text-[#555] font-mono">{showArchive ? 'архив пуст' : 'нет чатов'}</div></div>
        ) : grouped.map((group) => (
          <div key={group.label}>
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-[0.14em] px-3 py-2 font-bold">{group.label}</div>
            <div className="space-y-1">
              {group.chats.map((chat: any, idx: number) => {
                const globalIdx = chats.findIndex(c => c.id === chat.id) + 1
                const isActive = activeChatId === chat.id
                const isEditing = editingId === chat.id
                return (
                  <div key={chat.id} className={`group relative flex items-center gap-3 px-3 py-3 rounded-[14px] cursor-pointer border transition ${isActive ? 'bg-white/[0.06] border-white/[0.08]' : 'border-transparent hover:bg-white/[0.04] hover:border-white/[0.05]'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold border ${isActive ? 'bg-white text-black border-white' : 'bg-white/[0.05] border-white/[0.08] text-[#666]'}`} style={{ fontWeight: 700 }}>{globalIdx}</div>
                    <div className="flex-1 min-w-0" onClick={() => {
                      if (!isEditing) {
                        setActiveChat(chat.id)
                        if (isMobile) setTimeout(() => onToggle(), 100)
                      }
                    }}>
                      {isEditing ? <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={saveRename} onKeyDown={e => e.key === 'Enter' && saveRename()} autoFocus className="w-full bg-black/50 border border-white/10 rounded-full px-3 py-1 text-[13px] outline-none" /> : <>
                        <div className={`text-[13px] truncate ${isActive ? 'text-white' : 'text-[#AAA] group-hover:text-[#DDD]'}`} style={{ fontWeight: 600 }}>{chat.title}</div>
                        <div className="text-[11px] text-[#555] truncate mt-0.5">{chat.messages[chat.messages.length-1]?.content.slice(0,40) || 'пусто'}</div>
                      </>}
                    </div>
                    <button onClick={e => {
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setMenuPos({ x: rect.right, y: rect.top })
                      setMenuId(menuId === chat.id ? null : chat.id)
                    }} className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] text-[#666] hover:text-white opacity-0 group-hover:opacity-100 transition">⋯</button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {menuId && menuPos && (
        <div className="fixed w-[190px] bg-[#151515] border border-white/[0.08] rounded-[14px] shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden z-[200] p-1" style={{ left: menuPos.x - 190, top: menuPos.y + 32 }}>
          <button onClick={() => { const chat = chats.find(c => c.id === menuId); if (chat) handleRename(chat) }} className="w-full text-left px-3 py-2.5 rounded-[10px] text-[12px] hover:bg-white/[0.06] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Переименовать
          </button>
          <button onClick={() => {
            const { chats } = useChatStore.getState()
            const updated = chats.map(c => c.id === menuId ? { ...c, archived: !c.archived } : c)
            // @ts-ignore
            useChatStore.setState({ chats: updated })
            useChatStore.getState().saveChats()
            setMenuId(null)
          }} className="w-full text-left px-3 py-2.5 rounded-[10px] text-[12px] hover:bg-white/[0.06] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> {chats.find(c => c.id === menuId)?.archived ? 'Вернуть' : 'В архив'}
          </button>
          <div className="h-[1px] bg-white/[0.06] my-1" />
          <button onClick={() => { setMenuId(null); setConfirmId(menuId) }} className="w-full text-left px-3 py-2.5 rounded-[10px] text-[12px] hover:bg-[#FF4444]/10 text-[#FF6666] flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Удалить</button>
        </div>
      )}

      <AnimatePresence>
        {confirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[12px] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 12 }} className="bg-[#1A1A1A] border border-white/[0.08] rounded-[20px] p-6 w-full max-w-[300px] shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <div className="text-[15px] font-bold" style={{ fontWeight: 700 }}>Удалить чат?</div>
              <div className="text-[12px] text-[#888] mt-2">История будет удалена безвозвратно.</div>
              <div className="flex gap-2.5 mt-6"><button onClick={() => setConfirmId(null)} className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full py-2.5 text-[13px]">Отмена</button><button onClick={() => { deleteChat(confirmId); setConfirmId(null) }} className="flex-1 bg-white text-black rounded-full py-2.5 text-[13px] font-bold">Удалить</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 border-t border-white/[0.04] shrink-0 flex gap-2">
        <button onClick={onOpenSettings} className="flex-1 flex items-center gap-3 px-3 py-3 rounded-[12px] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition text-[13px] group">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.08] transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z"/></svg>
          </div>
          <span className="font-medium text-[#999] group-hover:text-[#DDD]">Настройки</span>
        </button>
        <div className="flex items-center text-[9px] font-mono text-[#333] px-2">v5.0.0</div>
      </div>
    </motion.div>
  )
}
