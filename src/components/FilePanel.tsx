import { useChatStore } from '@/store/chatStore'
import { motion } from 'framer-motion'

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
            // extract filename from nearby text
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
    <div className={`w-[300px] border-l shrink-0 flex flex-col ${theme === 'light' ? 'bg-white border-black/10' : 'bg-[#0A0A0A] border-white/[0.06]'}`}>
      <div className={`h-[52px] border-b flex items-center justify-between px-4 shrink-0 ${theme === 'light' ? 'border-black/10' : 'border-white/[0.06]'}`}>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#888]">Файлы • {files.length}</div>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[#666] hover:text-white" title="Скрыть панель">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </div>
            <div className="text-[12px] text-[#555]">Нет файлов</div>
            <div className="text-[11px] text-[#444] mt-1">Загрузи через +</div>
          </div>
        ) : files.map((f: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="group bg-[#141414] border border-white/[0.06] rounded-[12px] p-3 hover:border-white/[0.10] hover:bg-[#1A1A1A] transition">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] border border-white/[0.06] flex items-center justify-center shrink-0">
                {f.type === 'image' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                ) : f.type === 'code' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold truncate">{f.name || 'image.jpg'}</div>
                <div className="text-[10px] text-[#666] font-mono mt-0.5">{new Date(f.timestamp).toLocaleTimeString()} • {f.type === 'image' ? 'изображение' : f.type === 'code' ? `${f.content.length} симв.` : 'файл'}</div>
                {f.type === 'image' && f.url && (
                  <img src={f.url} alt="file" className="mt-2 rounded-[8px] max-h-[120px] w-full object-cover border border-white/10 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: f.url } }))} />
                )}
                {f.type === 'file' && f.content && (
                  <div className="mt-2 text-[10px] text-[#777] line-clamp-3 bg-[#0A0A0A] rounded-[6px] p-2 border border-white/[0.04]">{f.content.slice(0,200)}</div>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 mt-2.5">
              {f.type === 'code' && (
                <>
                  <button onClick={() => navigator.clipboard.writeText(f.content)} className="flex-1 h-7 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-medium hover:bg-white/[0.08]">Копировать</button>
                  <button onClick={() => { const blob = new Blob([f.content], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = f.name; a.click() }} className="flex-1 h-7 rounded-full bg-white text-black text-[10px] font-bold hover:bg-white/90">Скачать</button>
                </>
              )}
              {f.type === 'image' && f.url && (
                <>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: f.url } }))} className="flex-1 h-7 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-medium">Открыть</button>
                  <a href={f.url} download={f.name || 'image.jpg'} className="flex-1 h-7 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center hover:bg-white/90">Скачать</a>
                </>
              )}
              {f.type === 'file' && (
                <button onClick={() => { const blob = new Blob([f.content || ''], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = f.name || 'file.txt'; a.click() }} className="flex-1 h-7 rounded-full bg-white text-black text-[10px] font-bold">Скачать</button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
