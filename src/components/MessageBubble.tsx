import { ChatMessage } from '@/lib/storage'
import { MODELS } from '@/lib/version'
import ModelIcon from './ModelIcon'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'

function CopyIcon({ size=14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3"/></svg>
}
function CheckIcon({ size=14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5l10-10"/></svg>
}
function LikeIcon({ size=14, filled=false }: { size?: number, filled?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
}
function DislikeIcon({ size=14, filled=false }: { size?: number, filled?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
}
function DownloadIcon({ size=14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}

function extractFileName(text: string, lang: string): string {
  const patterns = [
    /сохрани как\s+`?([a-zA-Z0-9_\-]+\.[a-z]+)`?/i,
    /`([a-zA-Z0-9_\-]+\.(html|js|css|txt|json))`/,
    /файл:\s*([a-zA-Z0-9_\-]+\.html)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  const ext = lang === 'html' ? 'html' : lang === 'js' || lang === 'javascript' ? 'js' : lang === 'css' ? 'css' : 'txt'
  return `file-${Date.now()}.${ext}`
}

function getFileTypeMeta(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['html','htm'].includes(ext)) return { label: 'HTML', color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', icon: '◧' }
  if (['js','ts','tsx','jsx'].includes(ext)) return { label: 'JavaScript', color: '#F7DF1E', bg: 'rgba(247,223,30,0.12)', icon: '◨' }
  if (['css','scss'].includes(ext)) return { label: 'CSS', color: '#1572B6', bg: 'rgba(21,114,182,0.12)', icon: '◩' }
  if (['docx','doc'].includes(ext)) return { label: 'Word', color: '#2B579A', bg: 'rgba(43,87,154,0.12)', icon: '◫' }
  if (['pdf'].includes(ext)) return { label: 'PDF', color: '#FF3B30', bg: 'rgba(255,59,48,0.12)', icon: '◪' }
  if (['png','jpg','jpeg','webp'].includes(ext)) return { label: 'Изображение', color: '#0A84FF', bg: 'rgba(10,132,255,0.12)', icon: '◫' }
  return { label: ext.toUpperCase() || 'Файл', color: '#888', bg: 'rgba(136,136,136,0.12)', icon: '◫' }
}

export default function MessageBubble({ message, onOpenModelInfo }: { message: ChatMessage & { error?: boolean }, onOpenModelInfo?: (info: any) => void }) {
  const isUser = message.role === 'user'
  const modelInfo = message.modelId ? (MODELS as any)[message.modelId] : null
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [liked, setLiked] = useState<'like' | 'dislike' | null>(null)

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadCode = (code: string, fileName: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    // Try to open downloads folder - electron only
    // @ts-ignore
    if (window.electronAPI?.openDownloads) {
      // @ts-ignore
      window.electronAPI.openDownloads()
    }
  }

  const { html, codeBlocks } = useMemo(() => {
    try {
      const regex = /```(\w+)?\n([\s\S]*?)```/g
      const blocks: { lang: string, code: string, fileName: string }[] = []
      let match
      let contentWithoutCode = message.content
      while ((match = regex.exec(message.content)) !== null) {
        const lang = match[1] || 'text'
        const code = match[2]
        const fileName = extractFileName(message.content, lang)
        blocks.push({ lang, code, fileName })
        contentWithoutCode = contentWithoutCode.replace(match[0], `\n[CODE_BLOCK_${blocks.length-1}]\n`)
      }
      let raw = marked.parse(contentWithoutCode) as string
      blocks.forEach((_, i) => {
        raw = raw.replace(`[CODE_BLOCK_${i}]`, `<div class="code-placeholder" data-idx="${i}"></div>`)
      })
      const sanitized = DOMPurify.sanitize(raw)
      return { html: sanitized, codeBlocks: blocks }
    } catch {
      return { html: message.content, codeBlocks: [] as any[] }
    }
  }, [message.content])

  const timeStr = new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const isError = (message as any).error || message.content.includes('Ошибка запроса к ИИ') || message.content.includes('**"Ошибка')

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex justify-end group">
        <div className="max-w-[80%]">
          <div className="bg-white text-black rounded-[20px] rounded-br-[6px] px-4 py-3 text-[14px] leading-[1.6] shadow-[0_4px_16px_rgba(255,255,255,0.10)]" style={{ fontWeight: 600 }}>
            {message.attachments?.map((att, i) => {
              if (att.type === 'image') {
                return <img key={i} src={att.url} alt="attachment" className="rounded-[12px] max-w-full max-h-[300px] border border-black/10 cursor-pointer mb-2 hover:opacity-90 transition" onClick={() => window.dispatchEvent(new CustomEvent('open-image', { detail: { url: att.url } }))} />
              } else {
                const meta = getFileTypeMeta(att.name || 'file')
                return (
                  <div key={i} className="flex items-center gap-2.5 bg-black/[0.06] border border-black/[0.08] rounded-[12px] px-3 py-2.5 mb-2 cursor-pointer hover:bg-black/[0.10] transition group/file" onClick={() => {
                    if (att.content) window.dispatchEvent(new CustomEvent('open-file', { detail: { name: att.name, content: att.content, type: meta.label } }))
                  }}>
                    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[14px] font-bold" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold truncate flex items-center gap-1.5">{att.name || 'file'} <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/10 font-mono">{meta.label}</span><span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/10 font-mono opacity-0 group-hover/file:opacity-100 transition">открыть</span></div>
                      <div className="text-[10px] text-black/50 font-mono">{att.size ? `${(att.size/1024).toFixed(1)}KB` : `${att.content?.length || 0} симв.`} • клик для просмотра</div>
                    </div>
                  </div>
                )
              }
            })}
            <div className="whitespace-pre-wrap select-text">{message.content}</div>
            <div className="flex justify-end mt-1"><span className="text-[10px] text-black/40 font-mono">{timeStr}</span></div>
          </div>
          <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => copyText(message.content)} className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.10] text-[#888] hover:text-white transition">
              {copied ? <CheckIcon size={12}/> : <CopyIcon size={12}/>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex gap-3 group">
      <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => modelInfo && onOpenModelInfo && onOpenModelInfo(modelInfo)} className="w-8 h-8 rounded-full bg-[#181818] border border-[#222] flex items-center justify-center shrink-0 mt-1 overflow-hidden hover:border-white/20 transition" title="Инфо о модели">
        <img src="./logo-kayori.png" alt="Kayori" className="w-full h-full object-cover" />
      </motion.button>
      <div className="flex-1 max-w-[85%]">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[13px] font-bold" style={{ fontWeight: 700 }}>Kayori</span>
          {modelInfo && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onOpenModelInfo && onOpenModelInfo(modelInfo)} className="text-[11px] px-2.5 py-1 rounded-full bg-[#181818] border border-[#222] font-medium text-[#AAA] flex items-center gap-1.5 hover:border-white/20 hover:text-white transition">
              <ModelIcon modelKey={message.modelId as any} size={14} />
              {modelInfo.name}
            </motion.button>
          )}
        </div>

        <div className={`relative rounded-[18px] rounded-bl-[6px] px-4 py-3.5 border transition-all ${isError ? 'bg-[#1A0A0A] border-[#FF3B30]/30 shadow-[0_0_20px_rgba(255,59,48,0.15),0_4px_16px_rgba(0,0,0,0.3)]' : 'bg-[#151515] border-[#1E1E1E]'}`}>
          {message.isGenerating ? (
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-1.5 h-1.5 bg-white/60 rounded-full" />
              </div>
            </div>
          ) : (
            <>
              <div className={`markdown select-text ${isError ? 'text-[#FF8888]' : 'text-[#E5E5E5]'}`} style={{ fontWeight: 600, lineHeight: 1.65, fontSize: '14px' }} dangerouslySetInnerHTML={{ __html: html }} />
              {codeBlocks.length > 0 && (
                <div className="mt-4 space-y-3">
                  {codeBlocks.map((block, i) => {
                    const meta = getFileTypeMeta(block.fileName)
                    return (
                      <div key={i} className="group/code relative bg-[#0E0E0E] border border-[#222] rounded-[12px] overflow-hidden hover:border-[#2A2A2A] transition">
                        <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border-b border-[#222]">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-[#FF5F57]" /><div className="w-2 h-2 rounded-full bg-[#FFBD2E]" /><div className="w-2 h-2 rounded-full bg-[#28CA42]" /></div>
                            <div className="flex items-center gap-1.5 ml-2">
                              <div className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] font-bold" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
                              <span className="text-[11px] font-mono text-[#888]">{block.fileName}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] font-mono text-[#666]">{meta.label}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => downloadCode(block.code, block.fileName)} className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.12] text-[#888] hover:text-white transition" title={`Скачать ${block.fileName} в Загрузки`}>
                              <DownloadIcon size={12}/>
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { await navigator.clipboard.writeText(block.code); setCopiedCode(`${i}`); setTimeout(() => setCopiedCode(null), 2000) }} className="h-7 px-3 rounded-full bg-white text-black text-[11px] font-bold hover:bg-white/90 transition flex items-center gap-1 shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
                              {copiedCode === `${i}` ? <><CheckIcon size={10}/> скопировано</> : <><CopyIcon size={10}/> копировать</>}
                            </motion.button>
                          </div>
                        </div>
                        <pre className="p-3 overflow-x-auto text-[12px] font-mono m-0 border-0 rounded-none bg-transparent max-h-[420px]"><code className="text-[#CCC] select-text whitespace-pre">{block.code}</code></pre>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="absolute bottom-1.5 right-2.5 text-[10px] font-mono text-white/20 select-none">{timeStr}</div>
            </>
          )}
        </div>

        {!message.isGenerating && (
          <div className="flex items-center gap-1 mt-2.5">
            <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} onClick={() => copyText(message.content)} className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${copied ? 'bg-[#22C55E] border-[#22C55E] text-white' : 'bg-white/[0.05] border-white/[0.06] text-[#666] hover:text-white hover:bg-white/[0.08] hover:border-white/[0.10]'}`} title="Копировать">
              {copied ? <CheckIcon size={12}/> : <CopyIcon size={12}/>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} onClick={() => setLiked(liked === 'like' ? null : 'like')} className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${liked === 'like' ? 'bg-[#22C55E] border-[#22C55E] text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 'bg-white/[0.05] border-white/[0.06] text-[#666] hover:text-[#22C55E] hover:bg-[#22C55E]/10 hover:border-[#22C55E]/20'}`} title="Нравится">
              <LikeIcon size={12} filled={liked==='like'}/>
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }} onClick={() => setLiked(liked === 'dislike' ? null : 'dislike')} className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${liked === 'dislike' ? 'bg-[#EF4444] border-[#EF4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'bg-white/[0.05] border-white/[0.06] text-[#666] hover:text-[#EF4444] hover:bg-[#EF4444]/10 hover:border-[#EF4444]/20'}`} title="Не нравится">
              <DislikeIcon size={12} filled={liked==='dislike'}/>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
