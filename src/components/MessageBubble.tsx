import { ChatMessage } from '@/lib/storage'
import { MODELS } from '@/lib/version'
import { translateTextToRussian } from '@/lib/ai'
import ModelIcon from './ModelIcon'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'

function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3" />
    </svg>
  )
}
function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12l5 5l10-10" />
    </svg>
  )
}
function LikeIcon({ size = 13, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}
function DislikeIcon({ size = 13, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  )
}
function DownloadIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function TranslateIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 8l6 6" />
      <path d="M4 14l6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="M22 22l-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  )
}

function extractFileName(text: string, lang: string): string {
  const patterns = [
    /сохрани как\s+`?([a-zA-Z0-9_\-]+\.[a-z]+)`?/i,
    /`([a-zA-Z0-9_\-]+\.(html|js|ts|tsx|jsx|css|py|json|txt|cpp|rs|go))`/,
    /файл:\s*([a-zA-Z0-9_\-]+\.[a-z]+)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  const extMap: Record<string, string> = {
    html: 'html',
    js: 'js',
    javascript: 'js',
    ts: 'ts',
    typescript: 'ts',
    py: 'py',
    python: 'py',
    css: 'css',
    json: 'json',
    cpp: 'cpp',
    rs: 'rs'
  }
  const ext = extMap[lang.toLowerCase()] || 'txt'
  return `code-${Date.now().toString(36).slice(-4)}.${ext}`
}

export default function MessageBubble({ message, theme = 'dark' }: { message: ChatMessage; theme?: string }) {
  const isUser = message.role === 'user'
  const isLight = theme === 'light'
  const modelInfo = message.modelId ? (MODELS as any)[message.modelId] : null
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [liked, setLiked] = useState<'like' | 'dislike' | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  // Translation states
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

  // Selection translation states
  const [selectedText, setSelectedText] = useState('')
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null)
  const [isTranslatingSelection, setIsTranslatingSelection] = useState(false)

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleTranslation = async () => {
    if (showTranslation) {
      setShowTranslation(false)
      return
    }
    if (translatedText) {
      setShowTranslation(true)
      return
    }
    setIsTranslating(true)
    setTranslateError(null)
    try {
      const res = await translateTextToRussian(message.content)
      setTranslatedText(res)
      setShowTranslation(true)
    } catch (e: any) {
      setTranslateError(e.message || 'Ошибка перевода')
      setTimeout(() => setTranslateError(null), 3500)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleMouseUp = () => {
    const sel = window.getSelection()
    const text = sel ? sel.toString().trim() : ''
    if (text.length > 2 && text.length < 2500) {
      setSelectedText(text)
      setSelectedTranslation(null)
    }
  }

  const handleTranslateSelection = async () => {
    if (!selectedText) return
    setIsTranslatingSelection(true)
    try {
      const res = await translateTextToRussian(selectedText)
      setSelectedTranslation(res)
    } catch (e: any) {
      setSelectedTranslation('Ошибка перевода: ' + (e.message || 'сеть'))
    } finally {
      setIsTranslatingSelection(false)
    }
  }

  const downloadCode = (code: string, fileName: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeContent = showTranslation && translatedText ? translatedText : message.content

  const { html, codeBlocks } = useMemo(() => {
    try {
      const regex = /```(\w+)?\n([\s\S]*?)```/g
      const blocks: { lang: string; code: string; fileName: string }[] = []
      let match
      let contentWithoutCode = activeContent
      while ((match = regex.exec(activeContent)) !== null) {
        const lang = match[1] || 'text'
        const code = match[2]
        const fileName = extractFileName(activeContent, lang)
        blocks.push({ lang, code, fileName })
        contentWithoutCode = contentWithoutCode.replace(match[0], `\n[CODE_BLOCK_${blocks.length - 1}]\n`)
      }
      let raw = marked.parse(contentWithoutCode) as string
      blocks.forEach((_, i) => {
        raw = raw.replace(`[CODE_BLOCK_${i}]`, `<div class="code-placeholder" data-idx="${i}"></div>`)
      })
      const sanitized = DOMPurify.sanitize(raw)
      return { html: sanitized, codeBlocks: blocks }
    } catch {
      return { html: activeContent, codeBlocks: [] as any[] }
    }
  }, [activeContent])

  const timeStr = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Theme styling tokens
  const userBubbleBg = isLight
    ? 'bg-[#18181B] text-white shadow-[0_2px_10px_rgba(0,0,0,0.12)]'
    : 'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.08)]'
  const assistantBubbleBg = isLight
    ? 'bg-white border border-black/10 text-[#111827] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
    : 'bg-[#151515] border border-white/[0.08] text-[#E5E5E5]'
  const actionBtnBg = isLight
    ? 'bg-black/5 hover:bg-black/10 border border-black/5 text-[#4B5563]'
    : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[#9CA3AF]'

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex justify-end group">
        <div className="max-w-[85%] md:max-w-[75%]">
          <div className={`${userBubbleBg} rounded-[20px] rounded-br-[6px] px-4 py-3 text-[14px] leading-[1.6]`}>
            {message.attachments?.map((att, i) => (
              <div key={i} className="mb-2">
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt="attachment"
                    className="rounded-[12px] max-w-full max-h-[280px] border border-black/10 cursor-pointer object-cover"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: att.url } }))}
                  />
                ) : (
                  <div className={`flex items-center gap-2 rounded-[12px] px-3 py-2 ${isLight ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                    <span className="text-[16px]">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold truncate">{att.name || 'file'}</div>
                      <div className="text-[10px] opacity-70">
                        {att.size ? `${(att.size / 1024).toFixed(1)} KB` : `${att.content?.length || 0} симв.`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="whitespace-pre-wrap select-text font-medium">{message.content}</div>

            <div className="flex justify-end items-center gap-2 mt-1">
              <span className="text-[10px] font-mono opacity-60">{timeStr}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => copyText(message.content)}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${actionBtnBg}`}
              title="Копировать"
            >
              {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="flex gap-2.5 md:gap-3 group">
      {/* Bot Avatar */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 overflow-hidden transition ${
          isLight ? 'bg-white border-black/10 hover:border-black/25' : 'bg-[#181818] border-white/10 hover:border-white/20'
        }`}
        title="Информация о модели"
      >
        <img src="./logo-kayori.png" alt="Kayori" className="w-5 h-5 object-contain" />
      </button>

      <div className="flex-1 max-w-[90%] md:max-w-[85%] min-w-0">
        {/* Model Badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-[12px] font-bold ${isLight ? 'text-[#111827]' : 'text-white'}`}>
            Kayori
          </span>
          {modelInfo && (
            <span
              className={`text-[10.5px] px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1.5 ${
                isLight ? 'bg-black/5 border-black/5 text-[#4B5563]' : 'bg-[#181818] border-white/[0.08] text-[#AAA]'
              }`}
            >
              <ModelIcon modelKey={message.modelId as any} size={12} />
              {modelInfo.name}
            </span>
          )}
        </div>

        {/* Model Info Popover */}
        {showInfo && modelInfo && (
          <div
            className={`mb-2.5 rounded-[12px] border p-3 text-[11px] leading-[1.5] ${
              isLight ? 'bg-white border-black/10 text-[#374151]' : 'bg-[#181818] border-white/[0.08] text-[#888]'
            }`}
          >
            <div className={`font-bold text-[12px] mb-1 ${isLight ? 'text-black' : 'text-white'}`}>
              {modelInfo.name} — {modelInfo.provider}
            </div>
            <div>{modelInfo.description}</div>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {(modelInfo.capabilities || []).map((c: string) => (
                <span
                  key={c}
                  className={`px-2 py-0.5 rounded-full border text-[10px] ${
                    isLight ? 'bg-black/5 border-black/5 text-[#4B5563]' : 'bg-white/[0.06] border-white/[0.06] text-[#AAA]'
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assistant Message Bubble */}
        <div
          onMouseUp={handleMouseUp}
          className={`rounded-[18px] rounded-bl-[6px] px-4 py-3.5 ${assistantBubbleBg}`}
        >
          {message.isGenerating ? (
            <div className="flex items-center gap-2 py-1.5">
              <div className="flex gap-1.5">
                <span className={`w-2 h-2 rounded-full animate-bounce ${isLight ? 'bg-black/60' : 'bg-white/60'}`} />
                <span
                  className={`w-2 h-2 rounded-full animate-bounce ${isLight ? 'bg-black/60' : 'bg-white/60'}`}
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className={`w-2 h-2 rounded-full animate-bounce ${isLight ? 'bg-black/60' : 'bg-white/60'}`}
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className={`text-[12px] font-medium ml-1.5 ${isLight ? 'text-[#6B7280]' : 'text-[#888]'}`}>
                Печатает...
              </span>
            </div>
          ) : (
            <>
              {/* Translation active badge */}
              {showTranslation && (
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/10 dark:border-white/10 text-[11px] font-semibold text-emerald-500">
                  <div className="flex items-center gap-1.5">
                    <span>🇷🇺</span>
                    <span>Перевод на русский язык</span>
                  </div>
                  <button
                    onClick={() => setShowTranslation(false)}
                    className="text-[10px] underline hover:opacity-80 transition cursor-pointer"
                  >
                    Показать оригинал
                  </button>
                </div>
              )}

              {/* Markdown Content */}
              <div
                className="markdown select-text text-[13.5px] md:text-[14px]"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* Code Blocks */}
              {codeBlocks.length > 0 && (
                <div className="mt-3.5 space-y-3">
                  {codeBlocks.map((block, i) => (
                    <div
                      key={i}
                      className="group/code rounded-[12px] border border-black/20 overflow-hidden bg-[#0F1117] text-[#E5E7EB]"
                    >
                      {/* Code Block Header */}
                      <div className="flex items-center justify-between px-3 py-2 bg-[#181B26] border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#28CA42] block" />
                          </div>
                          <span className="ml-2 text-[11px] font-mono text-[#9CA3AF]">
                            {block.lang} • {block.fileName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => downloadCode(block.code, block.fileName)}
                            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                            title={`Скачать ${block.fileName}`}
                          >
                            <DownloadIcon size={12} />
                          </button>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(block.code)
                              setCopiedCode(`${i}`)
                              setTimeout(() => setCopiedCode(null), 2000)
                            }}
                            className="h-7 px-2.5 rounded-full bg-white text-black text-[11px] font-bold hover:bg-white/90 transition flex items-center gap-1"
                          >
                            {copiedCode === `${i}` ? (
                              <>
                                <CheckIcon size={10} /> скопировано
                              </>
                            ) : (
                              <>
                                <CopyIcon size={10} /> копировать
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Code pre */}
                      <pre className="p-3.5 overflow-x-auto text-[12px] font-mono m-0 bg-transparent max-h-[460px]">
                        <code className="text-[#D1D5DB] select-text whitespace-pre leading-relaxed">
                          {block.code}
                        </code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Dedicated Timestamp Footer (no border/line) */}
              <div className="flex justify-end items-center mt-1.5">
                <span className={`text-[10px] font-mono select-none ${isLight ? 'text-[#9CA3AF]' : 'text-white/30'}`}>
                  {timeStr}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Selected text quick-translation popover */}
        {selectedText && (
          <div className="mt-2 p-2.5 rounded-[14px] border bg-blue-500/10 border-blue-500/20 text-[12px] animate-fadeIn select-none">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-blue-500 font-bold text-[11px]">
                <TranslateIcon size={12} />
                <span>Выделенный текст ({selectedText.length} симв.)</span>
              </div>
              <button
                onClick={() => { setSelectedText(''); setSelectedTranslation(null); }}
                className="w-4 h-4 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 text-[10px]"
                title="Скрыть"
              >
                ✕
              </button>
            </div>

            {!selectedTranslation ? (
              <button
                onClick={handleTranslateSelection}
                disabled={isTranslatingSelection}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-500 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <TranslateIcon size={12} />
                {isTranslatingSelection ? 'Перевожу...' : 'Перевести фрагмент на русский'}
              </button>
            ) : (
              <div className="p-2.5 rounded-[10px] bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/5 select-text">
                <div className="text-[10px] font-semibold opacity-70 mb-1">Перевод на русский:</div>
                <div className="text-[12.5px] leading-relaxed font-medium">{selectedTranslation}</div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => copyText(selectedTranslation)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-600 text-white flex items-center gap-1 hover:bg-blue-500 transition"
                  >
                    <CopyIcon size={9} /> Копировать перевод
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons under message */}
        {!message.isGenerating && (
          <div className="flex items-center gap-1.5 mt-1.5 transition">
            <button
              onClick={() => copyText(activeContent)}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${actionBtnBg}`}
              title="Копировать текст"
            >
              {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
            </button>

            {/* Translate Button */}
            <button
              onClick={handleToggleTranslation}
              disabled={isTranslating}
              className={`h-6 px-2.5 rounded-full flex items-center gap-1.5 text-[11px] font-semibold transition ${
                showTranslation
                  ? isLight
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-500 text-white shadow-sm'
                  : actionBtnBg
              } disabled:opacity-50`}
              title={showTranslation ? 'Показать оригинал' : 'Перевести на русский'}
            >
              <TranslateIcon size={11} />
              <span>{isTranslating ? 'Перевод...' : showTranslation ? 'Оригинал' : 'Перевести'}</span>
            </button>

            {translateError && (
              <span className="text-[10.5px] text-rose-500 font-medium">
                {translateError}
              </span>
            )}

            <button
              onClick={() => setLiked(liked === 'like' ? null : 'like')}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                liked === 'like'
                  ? isLight
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                  : actionBtnBg
              }`}
              title="Нравится"
            >
              <LikeIcon size={11} filled={liked === 'like'} />
            </button>
            <button
              onClick={() => setLiked(liked === 'dislike' ? null : 'dislike')}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                liked === 'dislike'
                  ? isLight
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                  : actionBtnBg
              }`}
              title="Не нравится"
            >
              <DislikeIcon size={11} filled={liked === 'dislike'} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
