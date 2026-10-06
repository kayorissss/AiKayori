import { useChatStore } from '@/store/chatStore'
import { motion } from 'framer-motion'

function getFileMeta(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['html','htm'].includes(ext)) return { label: 'HTML', color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', icon: '◧' }
  if (['js','ts','tsx','jsx'].includes(ext)) return { label: 'JS', color: '#F7DF1E', bg: 'rgba(247,223,30,0.12)', icon: '◨' }
  if (['css','scss'].includes(ext)) return { label: 'CSS', color: '#1572B6', bg: 'rgba(21,114,182,0.12)', icon: '◩' }
  if (['docx','doc'].includes(ext)) return { label: 'DOCX', color: '#2B579A', bg: 'rgba(43,87,154,0.12)', icon: '◫' }
  if (['pdf'].includes(ext)) return { label: 'PDF', color: '#FF3B30', bg: 'rgba(255,59,48,0.12)', icon: '◪' }
  if (['png','jpg','jpeg','webp','gif'].includes(ext)) return { label: 'IMG', color: '#0A84FF', bg: 'rgba(10,132,255,0.12)', icon: '◫' }
  return { label: ext.toUpperCase() || 'FILE', color: '#888', bg: 'rgba(136,136,136,0.12)', icon: '◫' }
}

export default function FilePanel({ theme, onClose }: { theme?: string, onClose?: () => void }) {
  const { chats, activeChatId } = useChatStore()
  const activeChat = chats.find(c => c.id === activeChatId)

  const files = (() => {
    if (!activeChat) return []
    const list: any[] = []
    activeChat.messages.forEach(m => {
      if (m.attachments) {
        m.attachments.forEach(att => {
          list.push({ ...att, messageId: m.id, timestamp: m.timestamp })
        })
      }
      const regex = /```\w*\n([\s\S]*?)```/g
      let match
      while ((match = regex.exec(m.content)) !== null) {
        if (m.role === 'assistant') {
          const code = match[1]
          if (code.length > 80) {
            const before = m.content.slice(Math.max(0, match.index - 200), match.index)
            const fnMatch = before.match(/сохрани как `([^`]+)`/i) || before.match(/файл:\s*([^\s]+\.html)/i)
            const fname = fnMatch ? fnMatch[1] : `code-${m.id.slice(0,4)}.html`
            list.push({ type: 'code', name: fname, content: code, timestamp: m.timestamp, messageId: m.id })
          }
        }
      }
    })
    return list.reverse()
  })()

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} className={`w-[300px] border-l shrink-0 flex flex-col ${theme === 'light' ? 'bg-white border-black/10' : 'bg-[#0A0A0A] border-white/[0.06]'}`}>
      <div className={`h-[52px] border-b flex items-center justify-between px-4 shrink-0 ${theme === 'light' ? 'border-black/10' : 'border-white/[0.06]'}`}>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#888]">Файлы • {files.length}</div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[#666] hover:text-white hover:bg-white/[0.10] transition" title="Скрыть панель">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </motion.button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </div>
            <div className="text-[12px] text-[#555] font-medium">Нет файлов</div>
            <div className="text-[11px] text-[#444] mt-1">Перетащи файл в чат</div>
          </div>
        ) : files.map((f: any, i: number) => {
          const meta = getFileMeta(f.name || 'file')
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i*0.03 }} className="group bg-[#141414] border border-white/[0.06] rounded-[14px] p-3 hover:border-white/[0.10] hover:bg-[#1A1A1A] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 font-bold text-[14px]" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>
                  {f.type === 'image' ? '◫' : meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate flex items-center gap-1.5">{f.name || 'image.jpg'} <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] font-mono text-[#666]">{f.type === 'image' ? 'IMG' : meta.label}</span></div>
                  <div className="text-[10px] text-[#666] font-mono mt-0.5">{new Date(f.timestamp).toLocaleTimeString()} • {f.type === 'image' ? 'изображение' : f.type === 'code' ? `${f.content.length} симв.` : `${f.content?.length || 0} симв.`}</div>
                  {f.type === 'image' && f.url && (
                    <img src={f.url} alt="file" className="mt-2.5 rounded-[10px] max-h-[120px] w-full object-cover border border-white/10 cursor-pointer hover:border-white/20 transition" onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: f.url } }))} />
                  )}
                  {f.type === 'file' && f.content && (
                    <div className="mt-2 text-[10px] text-[#777] line-clamp-3 bg-[#0A0A0A] rounded-[8px] p-2.5 border border-white/[0.04] leading-[1.5]">{f.content.slice(0,200).replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, '')}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 mt-3">
                {f.type === 'code' && (
                  <>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigator.clipboard.writeText(f.content)} className="flex-1 h-7 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-semibold hover:bg-white/[0.10] hover:border-white/[0.10] transition">Копировать</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { const blob = new Blob([f.content], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = f.name; a.click() }} className="flex-1 h-7 rounded-full bg-white text-black text-[10px] font-bold hover:bg-white/90 transition shadow-[0_2px_8px_rgba(255,255,255,0.1)]">Скачать</motion.button>
                  </>
                )}
                {f.type === 'image' && f.url && (
                  <>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: f.url } }))} className="flex-1 h-7 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-semibold hover:bg-white/[0.10] transition">Открыть</motion.button>
                    <a href={f.url} download={f.name || 'image.jpg'} className="flex-1 h-7 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center hover:bg-white/90 transition shadow-[0_2px_8px_rgba(255,255,255,0.1)]">Скачать</a>
                  </>
                )}
                {f.type === 'file' && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { const blob = new Blob([f.content || ''], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = f.name || 'file.txt'; a.click() }} className="flex-1 h-7 rounded-full bg-white text-black text-[10px] font-bold hover:bg-white/90 transition shadow-[0_2px_8px_rgba(255,255,255,0.1)]">Скачать</motion.button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
