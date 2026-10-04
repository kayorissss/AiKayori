import { useChatStore } from '@/store/chatStore'
import { motion } from 'framer-motion'

export default function FilePanel({ theme = 'dark', onClose }: { theme?: string; onClose?: () => void }) {
  const { chats, activeChatId } = useChatStore()
  const activeChat = chats.find(c => c.id === activeChatId)

  const isLight = theme === 'light'
  const panelBg = isLight ? 'bg-white border-black/10' : 'bg-[#0A0A0A] border-white/[0.06]'
  const borderCol = isLight ? 'border-black/10' : 'border-white/[0.06]'
  const textColor = isLight ? 'text-[#111827]' : 'text-white'
  const subtextColor = isLight ? 'text-[#6B7280]' : 'text-[#888]'
  const cardBg = isLight ? 'bg-[#F9FAFB] hover:bg-[#F3F4F6] border-black/10' : 'bg-[#141414] hover:bg-[#181818] border-white/[0.06]'

  const files = (() => {
    if (!activeChat) return []
    const list: any[] = []
    activeChat.messages.forEach(m => {
      if (m.attachments) {
        m.attachments.forEach(att => {
          list.push({ ...att, messageId: m.id, timestamp: m.timestamp })
        })
      }
      const regex = /```(\w*)\n([\s\S]*?)```/g
      let match
      while ((match = regex.exec(m.content)) !== null) {
        if (m.role === 'assistant') {
          const lang = match[1] || 'code'
          const code = match[2]
          if (code.length > 50) {
            const before = m.content.slice(Math.max(0, match.index - 200), match.index)
            const fnMatch = before.match(/сохрани как `([^`]+)`/i) || before.match(/файл:\s*([^\s]+\.[a-z]+)/i)
            const fname = fnMatch ? fnMatch[1] : `snippet.${lang === 'html' ? 'html' : lang === 'py' ? 'py' : 'txt'}`
            list.push({ type: 'code', name: fname, content: code, timestamp: m.timestamp, messageId: m.id })
          }
        }
      }
    })
    return list.reverse()
  })()

  return (
    <div className={`w-[280px] md:w-[310px] border-l shrink-0 flex flex-col ${panelBg} transition-colors`}>
      {/* Header */}
      <div className={`h-[52px] border-b ${borderCol} flex items-center justify-between px-4 shrink-0`}>
        <div className={`text-[11px] font-bold uppercase tracking-wider ${subtextColor}`}>
          Файлы диалога ({files.length})
        </div>
        <button
          onClick={onClose}
          className={`w-7 h-7 rounded-full border ${borderCol} flex items-center justify-center transition ${
            isLight ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/[0.06] hover:bg-white/[0.1] text-white'
          }`}
          title="Скрыть панель"
        >
          ✕
        </button>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <div
              className={`w-10 h-10 rounded-full border ${borderCol} flex items-center justify-center mb-2.5 ${
                isLight ? 'bg-black/5 text-[#555]' : 'bg-white/[0.04] text-[#888]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </div>
            <div className={`text-[12px] font-medium ${textColor}`}>Нет прикреплённых файлов</div>
            <div className={`text-[10.5px] mt-0.5 ${subtextColor}`}>Загружайте фото и файлы через кнопку +</div>
          </div>
        ) : (
          files.map((f: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-[14px] p-3 transition shadow-sm ${cardBg}`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-[10px] border ${borderCol} flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-white shadow-sm' : 'bg-white/[0.06]'
                  }`}
                >
                  {f.type === 'image' ? (
                    <span className="text-[14px]">🖼️</span>
                  ) : f.type === 'code' ? (
                    <span className="text-[14px]">💻</span>
                  ) : (
                    <span className="text-[14px]">📄</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-bold truncate ${textColor}`}>
                    {f.name || 'Вложение'}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${subtextColor}`}>
                    {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {f.type === 'image' ? 'Изображение' : f.type === 'code' ? 'Сниппет кода' : 'Документ'}
                  </div>

                  {f.type === 'image' && f.url && (
                    <img
                      src={f.url}
                      alt="file"
                      className="mt-2 rounded-[8px] max-h-[120px] w-full object-cover border border-black/10 cursor-pointer"
                      onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: f.url } }))}
                    />
                  )}

                  {f.type === 'file' && f.content && (
                    <div
                      className={`mt-2 text-[10px] line-clamp-3 rounded-[8px] p-2 border font-mono ${
                        isLight ? 'bg-white border-black/10 text-[#4B5563]' : 'bg-[#0A0A0A] border-white/[0.04] text-[#888]'
                      }`}
                    >
                      {f.content.slice(0, 180)}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5 mt-2.5">
                {f.type === 'code' && (
                  <>
                    <button
                      onClick={() => navigator.clipboard.writeText(f.content)}
                      className={`flex-1 h-6 rounded-full border text-[10px] font-medium transition ${
                        isLight ? 'bg-black/5 hover:bg-black/10 border-black/5 text-black' : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.06] text-white'
                      }`}
                    >
                      Копировать
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([f.content], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = f.name
                        a.click()
                      }}
                      className={`flex-1 h-6 rounded-full text-[10px] font-bold transition ${
                        isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      Скачать
                    </button>
                  </>
                )}

                {f.type === 'image' && f.url && (
                  <>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: f.url } }))}
                      className={`flex-1 h-6 rounded-full border text-[10px] font-medium transition ${
                        isLight ? 'bg-black/5 hover:bg-black/10 border-black/5 text-black' : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.06] text-white'
                      }`}
                    >
                      Открыть
                    </button>
                    <a
                      href={f.url}
                      download={f.name || 'image.jpg'}
                      className={`flex-1 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition ${
                        isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      Скачать
                    </a>
                  </>
                )}

                {f.type === 'file' && (
                  <button
                    onClick={() => {
                      const blob = new Blob([f.content || ''], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = f.name || 'file.txt'
                      a.click()
                    }}
                    className={`flex-1 h-6 rounded-full text-[10px] font-bold transition ${
                      isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    Скачать
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
