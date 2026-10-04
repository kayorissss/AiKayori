import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { saveSetting, getSetting } from '@/lib/storage'
import { MODELS, ModelId } from '@/lib/version'
import ModelIcon from './ModelIcon'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onSend: (text: string, opts?: { imageBase64?: string; fileContent?: string; fileName?: string }) => void
  disabled?: boolean
  chatId: string | null
  showFilesToggle?: boolean
  showFiles?: boolean
  onToggleFiles?: () => void
  theme?: string
  onOpenSettings?: () => void
}

export default function InputBar({
  onSend,
  disabled,
  chatId,
  theme = 'dark'
}: Props) {
  const { draft, setDraft, currentModel, setModel } = useChatStore()
  const [text, setText] = useState(draft)
  const [image, setImage] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; content: string; size: number } | null>(null)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setText(draft)
  }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      setDraft(text)
      await saveSetting('global-draft', text)
      if (chatId) await saveSetting(`draft-${chatId}`, text)
    }, 250)
    return () => clearTimeout(t)
  }, [text, chatId])

  useEffect(() => {
    if (chatId) {
      getSetting<string>(`draft-${chatId}`).then(d => {
        if (d !== undefined) setText(d)
      })
    }
  }, [chatId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [text])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelSelect(false)
      }
    }
    if (showModelSelect) {
      document.addEventListener('mousedown', onClickOutside)
      return () => document.removeEventListener('mousedown', onClickOutside)
    }
  }, [showModelSelect])

  const handleSend = () => {
    if (!text.trim() && !image && !fileInfo) return
    onSend(text.trim(), {
      imageBase64: image || undefined,
      fileContent: fileInfo?.content,
      fileName: fileInfo?.name
    })
    setText('')
    setImage(null)
    setFileInfo(null)
    setDraft('')
    saveSetting('global-draft', '')
    if (chatId) saveSetting(`draft-${chatId}`, '')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      alert('Максимальный размер файла — 25MB')
      return
    }
    if (file.type.startsWith('image/')) {
      const r = new FileReader()
      r.onload = () => setImage(r.result as string)
      r.readAsDataURL(file)
    } else {
      const r = new FileReader()
      r.onload = () => {
        const content = r.result as string
        setFileInfo({ name: file.name, content: content.slice(0, 30000), size: file.size })
      }
      r.readAsText(file)
      r.onerror = () => {
        setFileInfo({
          name: file.name,
          content: `[Бинарный файл: ${file.name}, ${(file.size / 1024).toFixed(1)} KB]`,
          size: file.size
        })
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const isLight = theme === 'light'
  const currentModelData = (MODELS as any)[currentModel] || MODELS.google

  // Theme tokens
  const containerBg = isLight ? 'bg-[#F6F7F9]' : 'bg-[#080808]'
  const cardBg = isLight ? 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]' : 'bg-[#141414] shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
  const cardBorder = isLight ? 'border-black/10' : 'border-white/[0.08]'
  const textColor = isLight ? 'text-[#111827]' : 'text-[#E5E5E5]'
  const placeholderColor = isLight ? 'placeholder:text-[#9CA3AF]' : 'placeholder:text-[#666666]'
  const pillBg = isLight ? 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] border-black/5' : 'bg-[#1E1E1E] hover:bg-[#262626] text-[#D4D4D4] border-white/[0.08]'
  const menuBg = isLight ? 'bg-white shadow-[0_12px_36px_rgba(0,0,0,0.12)] border-black/10 text-black' : 'bg-[#181818] shadow-[0_16px_48px_rgba(0,0,0,0.7)] border-white/[0.08] text-white'

  return (
    <div className={`p-3 md:p-4 ${containerBg} border-t ${cardBorder} relative shrink-0 transition-colors`}>
      <div className="max-w-[800px] mx-auto space-y-2">

        {/* Top bar with Model Selector & Attachments */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div ref={modelRef} className="relative">
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className={`h-7 px-2.5 rounded-full border flex items-center gap-1.5 transition text-[11px] font-semibold ${pillBg}`}
              title="Выбрать модель ИИ"
            >
              <ModelIcon modelKey={currentModel} size={15} />
              <span className="max-w-[130px] truncate">{currentModelData.name}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform duration-200 ${showModelSelect ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Model Selection Dropdown */}
            <AnimatePresence>
              {showModelSelect && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute bottom-full left-0 mb-2 w-[310px] md:w-[340px] border rounded-[16px] overflow-hidden z-50 p-1.5 ${menuBg}`}
                >
                  <div className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest ${isLight ? 'text-[#6B7280]' : 'text-[#777]'}`}>
                    Модель нейросети
                  </div>

                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {Object.entries(MODELS).map(([key, m]) => {
                      const isSelected = currentModel === key
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setModel(key as ModelId)
                            setShowModelSelect(false)
                          }}
                          className={`w-full text-left p-2.5 rounded-[12px] flex items-center gap-3 transition ${
                            isSelected
                              ? isLight
                                ? 'bg-black text-white'
                                : 'bg-white text-black'
                              : isLight
                              ? 'hover:bg-black/5 text-[#111827]'
                              : 'hover:bg-white/[0.06] text-[#E5E5E5]'
                          }`}
                        >
                          <ModelIcon modelKey={key} size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-bold flex items-center gap-1.5">
                              <span>{m.name}</span>
                              <span className="text-[10px] font-normal opacity-70">({m.provider})</span>
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                isSelected ? (isLight ? 'text-white/80' : 'text-black/70') : isLight ? 'text-[#6B7280]' : 'text-[#888]'
                              }`}
                            >
                              {m.description}
                            </div>
                          </div>
                          {isSelected && <span className="text-[12px] font-bold">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {text.length > 0 && (
              <span className={`font-mono text-[10px] ${isLight ? 'text-[#9CA3AF]' : 'text-[#666]'}`}>
                {text.length} симв.
              </span>
            )}
          </div>
        </div>

        {/* Attached previews (if any) */}
        {(image || fileInfo) && (
          <div className="flex gap-2 flex-wrap pt-1">
            {image && (
              <div className="relative group">
                <img
                  src={image}
                  alt="preview"
                  className="h-16 rounded-[12px] border border-black/10 object-cover shadow-sm"
                />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px] shadow font-bold"
                  title="Удалить фото"
                >
                  ✕
                </button>
              </div>
            )}
            {fileInfo && (
              <div
                className={`border ${cardBorder} ${
                  isLight ? 'bg-white' : 'bg-white/[0.06]'
                } rounded-[12px] px-3 py-1.5 flex items-center gap-2 shadow-sm`}
              >
                <span className="text-[14px]">📄</span>
                <div className="min-w-0">
                  <div className={`text-[11px] font-bold truncate max-w-[160px] ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                    {fileInfo.name}
                  </div>
                  <div className={`text-[9px] font-mono ${isLight ? 'text-[#6B7280]' : 'text-[#888]'}`}>
                    {(fileInfo.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  onClick={() => setFileInfo(null)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-60 hover:opacity-100"
                  title="Удалить файл"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Input Box */}
        <div
          className={`border ${cardBorder} rounded-[20px] md:rounded-[24px] p-2 flex items-end gap-2 transition-all ${cardBg} focus-within:ring-2 ${
            isLight ? 'focus-within:ring-black/10 focus-within:border-black/30' : 'focus-within:ring-white/10 focus-within:border-white/25'
          }`}
        >
          {/* File attach button */}
          <button
            onClick={() => fileRef.current?.click()}
            className={`h-9 w-9 rounded-full border flex items-center justify-center transition shrink-0 ${
              isLight
                ? 'bg-black/5 hover:bg-black/10 border-black/5 text-[#374151]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.06] text-[#A3A3A3]'
            }`}
            title="Прикрепить файл или фото (макс 25MB)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="*/*" className="hidden" onChange={handleFile} />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Спросите что-нибудь у Kayori..."
            className={`flex-1 bg-transparent text-[13.5px] md:text-[14px] leading-[1.5] ${textColor} ${placeholderColor} resize-none outline-none max-h-[180px] min-h-[22px] py-2 border-none focus:outline-none focus:ring-0 select-text`}
            rows={1}
            disabled={disabled}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !image && !fileInfo)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 shrink-0 ${
              isLight
                ? 'bg-[#111827] text-white hover:bg-black disabled:opacity-25'
                : 'bg-white text-black hover:bg-white/90 disabled:opacity-25'
            } disabled:cursor-not-allowed shadow-sm`}
            title="Отправить (Enter)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
