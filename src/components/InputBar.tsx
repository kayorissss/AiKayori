import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { saveSetting, getSetting } from '@/lib/storage'
import { MODELS, ModelId } from '@/lib/version'
import { getModelStatusMap } from '@/lib/ai'
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
  const [modelStatus, setModelStatus] = useState<Record<string, { configured: boolean; provider: string; reason?: string }>>({})
  const [filterOnlyAvailable, setFilterOnlyAvailable] = useState(false)
  const [lockedModal, setLockedModal] = useState<{ modelName: string; reason: string } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelRef = useRef<HTMLDivElement>(null)

  const refreshModelStatus = async () => {
    try {
      const status = await getModelStatusMap()
      setModelStatus(status)

      // If currentModel is not configured, but there are configured models, auto-switch to a configured model
      const configuredKeys = (Object.keys(status) as ModelId[]).filter(k => status[k]?.configured)
      if (status[currentModel] && !status[currentModel].configured && configuredKeys.length > 0) {
        // Prefer llama31 or google if available
        const preferred = configuredKeys.find(k => k === 'llama31' || k === 'google') || configuredKeys[0]
        setModel(preferred)
      }
    } catch {}
  }

  useEffect(() => {
    setText(draft)
    refreshModelStatus()

    const onStorageChange = () => refreshModelStatus()
    window.addEventListener('storage', onStorageChange)
    return () => window.removeEventListener('storage', onStorageChange)
  }, [])

  useEffect(() => {
    if (showModelSelect) {
      refreshModelStatus()
    }
  }, [showModelSelect])

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
  const isCurrentModelConfigured = modelStatus[currentModel]?.configured ?? true

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
              <div className="relative flex items-center">
                <ModelIcon modelKey={currentModel} size={15} />
                {!isCurrentModelConfigured && (
                  <span className="absolute -top-1 -right-1 text-[8px]">🔒</span>
                )}
              </div>
              <span className="max-w-[130px] truncate">{currentModelData.name}</span>
              {!isCurrentModelConfigured && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-medium">
                  🔒 Нужен ключ
                </span>
              )}
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
                  className={`absolute bottom-full left-0 mb-2 w-[315px] md:w-[350px] border rounded-[16px] overflow-hidden z-50 p-1.5 ${menuBg}`}
                >
                  {/* Header with Title and "Только доступные" toggle */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/5 dark:border-white/5 mb-1">
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${isLight ? 'text-[#6B7280]' : 'text-[#777]'}`}>
                      Модели нейросетей
                    </span>
                    <button
                      onClick={() => setFilterOnlyAvailable(!filterOnlyAvailable)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                        filterOnlyAvailable
                          ? isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
                          : isLight ? 'bg-black/5 text-[#4B5563] border-black/5 hover:bg-black/10' : 'bg-white/5 text-[#AAA] border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span>🔒</span>
                      <span>{filterOnlyAvailable ? 'Только доступные' : 'Все модели'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {Object.entries(MODELS)
                      .filter(([key]) => !filterOnlyAvailable || modelStatus[key]?.configured)
                      .map(([key, m]) => {
                        const isSelected = currentModel === key
                        const isConfigured = modelStatus[key]?.configured ?? true
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              if (!isConfigured) {
                                setLockedModal({
                                  modelName: m.name,
                                  reason: modelStatus[key]?.reason || 'Требуется API ключ в Настройках'
                                })
                                return
                              }
                              setModel(key as ModelId)
                              setShowModelSelect(false)
                            }}
                            className={`w-full text-left p-2.5 rounded-[12px] flex items-center gap-3 transition relative ${
                              isSelected
                                ? isLight
                                  ? 'bg-black text-white'
                                  : 'bg-white text-black'
                                : isLight
                                ? 'hover:bg-black/5 text-[#111827]'
                                : 'hover:bg-white/[0.06] text-[#E5E5E5]'
                            } ${!isConfigured ? 'opacity-70 hover:opacity-100' : ''}`}
                          >
                            <div className="relative">
                              <ModelIcon modelKey={key} size={24} />
                              {!isConfigured && (
                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[8px] font-bold shadow">
                                  🔒
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold flex items-center gap-1.5">
                                <span>{m.name}</span>
                                <span className="text-[10px] font-normal opacity-70">({m.provider})</span>
                                {!isConfigured && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                  }`}>
                                    🔒 Нужен ключ
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-[10px] truncate ${
                                  isSelected ? (isLight ? 'text-white/80' : 'text-black/70') : isLight ? 'text-[#6B7280]' : 'text-[#888]'
                                }`}
                              >
                                {m.description}
                              </div>
                            </div>
                            {isSelected ? (
                              <span className="text-[12px] font-bold">✓</span>
                            ) : isConfigured ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Готово к работе" />
                            ) : null}
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

        {/* Locked Model Info Modal */}
        {lockedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className={`w-full max-w-sm rounded-[20px] p-5 border shadow-2xl ${
              isLight ? 'bg-white border-black/10 text-black' : 'bg-[#181818] border-white/10 text-white'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold text-[14px]">
                <span className="text-[20px]">🔒</span>
                <span>Модель под замочком</span>
              </div>
              <div className="text-[13px] leading-relaxed mb-4 opacity-90">
                Для работы с моделью <b>«{lockedModal.modelName}»</b> {lockedModal.reason}.
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setLockedModal(null)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border ${
                    isLight ? 'border-black/10 hover:bg-black/5' : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  Закрыть
                </button>
                <button
                  onClick={() => {
                    setLockedModal(null)
                    setShowModelSelect(false)
                    window.dispatchEvent(new CustomEvent('open-settings'))
                  }}
                  className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5"
                >
                  <span>⚙️</span>
                  <span>Настройки</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input box */}
        <div className={`rounded-[20px] border ${cardBorder} ${cardBg} p-2 transition-all focus-within:border-black/30 dark:focus-within:border-white/30`}>

          {/* Attached Image Preview */}
          {image && (
            <div className="relative inline-block mb-2 ml-1">
              <img
                src={image}
                alt="preview"
                className="w-16 h-16 rounded-[12px] object-cover border border-black/10 dark:border-white/10"
              />
              <button
                onClick={() => setImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white text-[11px] flex items-center justify-center font-bold hover:bg-red-600 transition"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          )}

          {/* Attached File Preview */}
          {fileInfo && (
            <div className="flex items-center gap-2 mb-2 ml-1 p-2 rounded-[12px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 max-w-xs">
              <span className="text-[16px]">📄</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate">{fileInfo.name}</div>
                <div className="text-[10px] opacity-60">{(fileInfo.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                onClick={() => setFileInfo(null)}
                className="text-[11px] opacity-60 hover:opacity-100 hover:text-red-500"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Attachment Button */}
            <button
              onClick={() => fileRef.current?.click()}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${
                isLight ? 'hover:bg-black/5 text-[#4B5563]' : 'hover:bg-white/10 text-[#9CA3AF]'
              }`}
              title="Прикрепить файл или фото"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              onChange={handleFile}
              className="hidden"
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={disabled}
              placeholder="Спросите что-нибудь у Kayori..."
              rows={1}
              className={`flex-1 bg-transparent border-0 outline-none resize-none text-[13.5px] leading-relaxed max-h-[180px] p-1 ${textColor} ${placeholderColor}`}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={disabled || (!text.trim() && !image && !fileInfo)}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${
                text.trim() || image || fileInfo
                  ? isLight
                    ? 'bg-black text-white hover:bg-black/80'
                    : 'bg-white text-black hover:bg-white/90'
                  : isLight
                  ? 'bg-black/5 text-black/30 cursor-not-allowed'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
              title="Отправить (Enter)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
