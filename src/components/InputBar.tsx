import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { saveSetting, getSetting } from '@/lib/storage'
import { MODELS, ModelId } from '@/lib/version'
import ModelIcon from './ModelIcon'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onSend: (text: string, opts?: { imageBase64?: string, fileContent?: string, fileName?: string }) => void
  disabled?: boolean
  chatId: string | null
  showFilesToggle?: boolean
  showFiles?: boolean
  onToggleFiles?: () => void
}

export default function InputBar({ onSend, disabled, chatId, showFilesToggle, showFiles, onToggleFiles }: Props) {
  const { draft, setDraft, currentModel, setModel } = useChatStore()
  const [text, setText] = useState(draft)
  const [image, setImage] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string, content: string, size: number } | null>(null)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setText(draft) }, [])
  useEffect(() => {
    const t = setTimeout(async () => {
      setDraft(text)
      await saveSetting('global-draft', text)
      if (chatId) await saveSetting(`draft-${chatId}`, text)
    }, 300)
    return () => clearTimeout(t)
  }, [text, chatId])
  useEffect(() => {
    if (chatId) getSetting<string>(`draft-${chatId}`).then(d => { if (d) setText(d) })
  }, [chatId])
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [text])
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setShowModelSelect(false)
    }
    if (showModelSelect) {
      document.addEventListener('mousedown', onClickOutside)
      return () => document.removeEventListener('mousedown', onClickOutside)
    }
  }, [showModelSelect])

  const handleSend = () => {
    if (!text.trim() && !image && !fileInfo) return
    onSend(text.trim(), { imageBase64: image || undefined, fileContent: fileInfo?.content, fileName: fileInfo?.name })
    setText(''); setImage(null); setFileInfo(null); setDraft('')
    saveSetting('global-draft',''); if (chatId) saveSetting(`draft-${chatId}`,'')
  }
  const onKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 20*1024*1024) { alert('Макс 20MB'); return }
    if (file.type.startsWith('image/')) {
      const r = new FileReader(); r.onload = () => setImage(r.result as string); r.readAsDataURL(file)
    } else {
      const r = new FileReader()
      r.onload = () => {
        const content = r.result as string
        setFileInfo({ name: file.name, content: content.slice(0, 20000), size: file.size })
      }
      r.readAsText(file)
      r.onerror = () => {
        setFileInfo({ name: file.name, content: `[Бинарный ${file.name}, ${Math.round(file.size/1024)}KB]`, size: file.size })
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const currentModelData = MODELS[currentModel]

  return (
    <div className="p-3 md:p-4 bg-[#080808] relative">
      {(image || fileInfo) && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {image && (
            <div className="relative group">
              <img src={image} alt="preview" className="h-20 rounded-[16px] border border-white/10 max-w-[200px] object-cover" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] shadow-lg">×</button>
            </div>
          )}
          {fileInfo && (
            <div className="bg-white/[0.06] border border-white/[0.08] rounded-[14px] px-3 py-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">◫</div>
              <div>
                <div className="text-[12px] font-semibold max-w-[150px] truncate">{fileInfo.name}</div>
                <div className="text-[10px] text-[#666] font-mono">{(fileInfo.size/1024).toFixed(1)}KB • макс 20MB</div>
              </div>
              <button onClick={() => setFileInfo(null)} className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] hover:bg-white/20">×</button>
            </div>
          )}
        </div>
      )}

      <div className="relative">
        {/* Model selector - on border */}
        <div ref={modelRef} className="absolute -top-3.5 z-20 flex items-center gap-2" style={{ left: '64px' }}>
          <button onClick={() => setShowModelSelect(!showModelSelect)} className="h-7 px-3 rounded-full bg-[#1E1E1E] border border-white/[0.08] flex items-center gap-2 hover:bg-[#252525] transition text-[11px] font-semibold text-[#CCC] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            <ModelIcon modelKey={currentModel} size={14} />
            <span className="max-w-[100px] truncate">{currentModelData.name}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className={`transition-transform ${showModelSelect ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <span className="text-[9px] font-mono text-[#333] hidden md:inline">выбери модель</span>
          <AnimatePresence>
            {showModelSelect && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.18 }} className="absolute bottom-full left-0 mb-3 w-[320px] bg-[#181818] border border-white/[0.08] rounded-[18px] shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden z-50 p-2">
                <div className="px-3 py-2 text-[10px] font-mono text-[#555] uppercase tracking-widest">Выбери модель</div>
                {Object.entries(MODELS).map(([key, m]) => (
                  <button key={key} onClick={() => { setModel(key as ModelId); setShowModelSelect(false) }} className={`w-full text-left p-3 rounded-[12px] flex items-center gap-3 transition ${currentModel === key ? 'bg-white text-black' : 'hover:bg-white/[0.06] text-[#CCC]'}`}>
                    <ModelIcon modelKey={key} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] flex items-center gap-2" style={{ fontWeight: 700 }}>
                        {m.name}
                        <span className="flex gap-1">
                          {(m as any).supportsVision && <span className="w-4 h-4 rounded-full bg-[#3B82F6]/20 flex items-center justify-center" title="Фото"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></span>}
                          <span className="w-4 h-4 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center" title="Код"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></span>
                        </span>
                      </div>
                      <div className={`text-[11px] ${currentModel === key ? 'text-black/60' : 'text-[#666]'}`}>{m.description}</div>
                    </div>
                    {currentModel === key && <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">✓</div>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-[#141414] border border-white/[0.06] rounded-[24px] p-2 flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)] focus-within:border-white/[0.10] focus-within:bg-[#1A1A1A] transition-colors">
          <button onClick={() => fileRef.current?.click()} className="group h-9 min-w-[36px] rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.10] transition-all shrink-0 px-3 gap-1.5" title="Прикрепить файл (макс 20MB)">
            <span className="text-[14px] text-[#888] group-hover:text-white">+</span>
            <span className="text-[10px] text-[#666] font-mono hidden md:inline group-hover:text-white">файл • 20MB</span>
          </button>
          <input ref={fileRef} type="file" accept="*/*" className="hidden" onChange={handleFile} />
          <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKeyDown} placeholder="Спроси что-нибудь..." className="flex-1 bg-transparent text-[14px] placeholder:text-[#555] resize-none outline-none max-h-[160px] min-h-[20px] py-2 leading-[1.5] text-[#E5E5E5] caret-white border-none focus:outline-none focus:ring-0 select-text" rows={1} disabled={disabled} style={{ fontWeight: 600, boxShadow: 'none' }} />
          <button onClick={handleSend} disabled={disabled || (!text.trim() && !image && !fileInfo)} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
