import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { saveSetting, getSetting } from '@/lib/storage'
import { MODELS, ModelId } from '@/lib/version'
import ModelIcon from './ModelIcon'
import { motion, AnimatePresence } from 'framer-motion'
import { extractDocxText } from '@/lib/ai'

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
  const [modelSearch, setModelSearch] = useState('')
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 20*1024*1024) { alert('Макс 20MB'); return }
    if (file.type.startsWith('image/')) {
      const r = new FileReader(); r.onload = () => setImage(r.result as string); r.readAsDataURL(file)
    } else {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      if (ext === 'docx') {
        const buf = await file.arrayBuffer()
        const content = await extractDocxText(buf)
        setFileInfo({ name: file.name, content: content.slice(0, 20000), size: file.size })
      } else if (['doc'].includes(ext)) {
        // old doc - try text, but warn
        const r = new FileReader()
        r.onload = () => {
          const raw = r.result as string
          // doc binary - try to extract readable
          const cleaned = raw.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, ' ').replace(/\s+/g, ' ').slice(0, 20000)
          setFileInfo({ name: file.name, content: cleaned.length > 20 ? cleaned : `[Старый DOC ${file.name} - открой и сохрани как DOCX]`, size: file.size })
        }
        r.readAsText(file)
      } else if (['pdf'].includes(ext)) {
        setFileInfo({ name: file.name, content: `[PDF ${file.name}, ${Math.round(file.size/1024)}KB - содержимое будет прочитано ИИ если поддерживается моделью Gemini. Для лучшего чтения - сконвертируй в TXT]`, size: file.size })
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
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const currentModelData = MODELS[currentModel]
  const filteredModels = Object.entries(MODELS).filter(([_, m]) => {
    if (!modelSearch) return true
    const q = modelSearch.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)
  })

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['html','htm'].includes(ext||'')) return { icon: '◧', color: '#FF6B35', label: 'HTML' }
    if (['js','ts','tsx','jsx'].includes(ext||'')) return { icon: '◨', color: '#F7DF1E', label: 'JS' }
    if (['css','scss'].includes(ext||'')) return { icon: '◩', color: '#1572B6', label: 'CSS' }
    if (['docx','doc'].includes(ext||'')) return { icon: '◫', color: '#2B579A', label: 'DOCX' }
    if (['pdf'].includes(ext||'')) return { icon: '◪', color: '#FF3B30', label: 'PDF' }
    if (['txt','md'].includes(ext||'')) return { icon: '◧', color: '#888', label: 'TXT' }
    return { icon: '◫', color: '#666', label: (ext||'FILE').toUpperCase() }
  }

  return (
    <div className="p-3 md:p-4 bg-[#080808] relative">
      {(image || fileInfo) && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {image && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
              <img src={image} alt="preview" className="h-20 rounded-[14px] border border-white/10 max-w-[200px] object-cover" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] shadow-lg hover:scale-110 transition">×</button>
            </motion.div>
          )}
          {fileInfo && (() => {
            const fi = getFileIcon(fileInfo.name)
            return (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-[#141414] border border-white/[0.08] rounded-[14px] px-3 py-2.5 flex items-center gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.2)] max-w-[360px]">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[14px] font-bold shrink-0" style={{ background: `${fi.color}18`, color: fi.color, border: `1px solid ${fi.color}30` }}>{fi.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold truncate flex items-center gap-1.5">{fileInfo.name} <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.06] font-mono shrink-0">{fi.label}</span></div>
                  <div className="text-[10px] text-[#666] font-mono truncate">{(fileInfo.size/1024).toFixed(1)}KB • {fileInfo.content.slice(0,60).replace(/\n/g,' ')}...</div>
                </div>
                <button onClick={() => setFileInfo(null)} className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] hover:bg-white/[0.10] ml-1 shrink-0">×</button>
              </motion.div>
            )
          })()}
        </div>
      )}

      <div className="relative">
        <div ref={modelRef} className="absolute -top-3.5 z-20" style={{ left: '48px' }}>
          <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} onClick={() => setShowModelSelect(!showModelSelect)} className="h-7 px-3 rounded-full bg-[#1E1E1E] border border-white/[0.10] flex items-center gap-2 hover:bg-[#252525] transition text-[11px] font-semibold text-[#CCC] shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            <ModelIcon modelKey={currentModel} size={14} />
            <span className="max-w-[110px] truncate">{currentModelData.name}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className={`transition-transform ${showModelSelect ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
          </motion.button>
          <AnimatePresence>
            {showModelSelect && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }} className="absolute bottom-full left-0 mb-3 w-[340px] bg-[#181818] border border-white/[0.10] rounded-[18px] shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden z-50 p-2">
                <div className="px-2 pb-2 flex gap-2">
                  <div className="flex-1 relative">
                    <input value={modelSearch} onChange={e => setModelSearch(e.target.value)} placeholder="Поиск модели..." className="w-full bg-[#0A0A0A] border border-white/[0.06] rounded-full py-2 pl-8 pr-3 text-[11px] placeholder:text-[#555] focus:outline-none focus:border-white/[0.12] font-medium" autoFocus />
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto space-y-1">
                {filteredModels.map(([key, m]) => (
                  <motion.button key={key} whileTap={{ scale: 0.98 }} onClick={() => { setModel(key as ModelId); setShowModelSelect(false); setModelSearch('') }} className={`w-full text-left p-3 rounded-[12px] flex items-center gap-3 transition ${currentModel === key ? 'bg-white text-black' : 'hover:bg-white/[0.06] text-[#CCC]'}`}>
                    <ModelIcon modelKey={key} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] flex items-center gap-2" style={{ fontWeight: 700 }}>
                        {m.name}
                        <span className="flex gap-1">
                          {(m.capabilities.includes('photo') || m.capabilities.includes('vision')) && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/20 text-[#60A5FA]">фото</span>}
                          {m.capabilities.includes('code') && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 text-[#A78BFA]">код</span>}
                          {m.capabilities.includes('reasoning') && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/20 text-[#4ADE80]">думает</span>}
                        </span>
                      </div>
                      <div className={`text-[11px] mt-0.5 ${currentModel === key ? 'text-black/60' : 'text-[#666]'}`}>{(m as any).personality || m.description}</div>
                    </div>
                    {currentModel === key && <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">✓</div>}
                  </motion.button>
                ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-[#141414] border border-white/[0.08] rounded-[24px] p-2 flex items-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.25)] focus-within:border-white/[0.14] focus-within:bg-[#1A1A1A] transition-all">
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-all shrink-0 group" title="Прикрепить файл — макс 20MB">
            <span className="text-[18px] text-[#888] group-hover:text-white transition-colors leading-none">+</span>
          </motion.button>
          <input ref={fileRef} type="file" accept="*/*" className="hidden" onChange={handleFile} />
          <textarea ref={textareaRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKeyDown} placeholder="Спроси что-нибудь..." className="flex-1 bg-transparent text-[14px] placeholder:text-[#555] resize-none outline-none max-h-[160px] min-h-[20px] py-2 leading-[1.5] text-[#E5E5E5] caret-white border-none focus:outline-none focus:ring-0 select-text" rows={1} disabled={disabled} style={{ fontWeight: 600, boxShadow: 'none' }} />
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={handleSend} disabled={disabled || (!text.trim() && !image && !fileInfo)} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-[0_2px_8px_rgba(255,255,255,0.15)] shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
