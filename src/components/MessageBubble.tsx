import { ChatMessage } from '@/lib/storage'
import { MODELS } from '@/lib/version'
import ModelIcon from './ModelIcon'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { motion } from 'framer-motion'
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
function EditIcon({ size=14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function DownloadIcon({ size=14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}

function extractFileName(text: string, lang: string): string {
  // Look for "сохрани как `clicker.html`" or save as filename
  const patterns = [
    /сохрани как\s+`?([a-zA-Z0-9_-]+\.[a-z]+)`?/i,
    /save as\s+`?([a-zA-Z0-9_-]+\.[a-z]+)`?/i,
    /`([a-zA-Z0-9_-]+\.(html|js|css|txt|json))`/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  const ext = lang === 'html' ? 'html' : lang === 'js' || lang === 'javascript' ? 'js' : lang === 'css' ? 'css' : 'txt'
  return `file-${Date.now()}.${ext}`
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const modelInfo = message.modelId ? (MODELS as any)[message.modelId] : null
  const [copied, setCopied] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [liked, setLiked] = useState<'like' | 'dislike' | null>(null)

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const { html, codeBlocks } = useMemo(() => {
    try {
      // Extract code blocks first
      const regex = /```(\w+)?\n([\s\S]*?)```/g
      const blocks: { lang: string, code: string, fileName: string }[] = []
      let match
      let contentWithoutCode = message.content
      while ((match = regex.exec(message.content)) !== null) {
        const lang = match[1] || 'text'
        const code = match[2]
        const fileName = extractFileName(message.content, lang)
        blocks.push({ lang, code, fileName })
        // Replace code block with placeholder to avoid double rendering
        contentWithoutCode = contentWithoutCode.replace(match[0], `\n[CODE_BLOCK_${blocks.length-1}]\n`)
      }
      // Parse remaining markdown without code blocks
      let raw = marked.parse(contentWithoutCode) as string
      // Restore code block placeholders as simple text (will be rendered separately)
      blocks.forEach((_, i) => {
        raw = raw.replace(`[CODE_BLOCK_${i}]`, `<div class="code-placeholder" data-idx="${i}"></div>`)
      })
      const sanitized = DOMPurify.sanitize(raw)
      return { html: sanitized, codeBlocks: blocks }
    } catch {
      return { html: message.content, codeBlocks: [] }
    }
  }, [message.content])

  const timeStr = new Date(message.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex justify-end group">
        <div className="max-w-[80%]">
          <div className="bg-white text-black rounded-[20px] rounded-br-[6px] px-4 py-3 text-[14px] leading-[1.6] shadow-[0_2px_12px_rgba(255,255,255,0.08)]" style={{ fontFamily: 'Gotham, Manrope, sans-serif', fontWeight: 500 }}>
            {message.attachments?.map((att, i) => (
              <div key={i} className="mb-2">
                {att.type === 'image' ? (
                  <img src={att.url} alt="attachment" className="rounded-[12px] max-w-full max-h-[300px] border border-black/10" />
                ) : (
                  <div className="flex items-center gap-2 bg-black/10 border border-black/10 rounded-[12px] px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-[12px]">📄</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold truncate">{att.name || 'file'}</div>
                      <div className="text-[10px] text-black/50">{att.content ? `${att.content.length} символов` : ''}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="whitespace-pre-wrap select-text">{message.content}</div>
            <div className="flex justify-end mt-1.5"><span className="text-[10px] text-black/40 font-mono">{timeStr}</span></div>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => copyText(message.content)} className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition text-[#888] hover:text-white">
              {copied ? <CheckIcon size={12}/> : <CopyIcon size={12}/>}
            </button>
            <button className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition text-[#888] hover:text-white">
              <EditIcon size={12}/>
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#222] flex items-center justify-center shrink-0 mt-1 overflow-hidden">
        <img src="./logo-kayori.png" alt="Kayori" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[13px] font-bold" style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 700 }}>Kayori</span>
          {modelInfo && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#181818] border border-[#222] font-medium text-[#AAA] flex items-center gap-1.5">
              <ModelIcon modelKey={message.modelId as any} size={14} />
              {modelInfo.name}
            </span>
          )}
        </div>

        <div className="relative bg-[#151515] border border-[#1E1E1E] rounded-[18px] rounded-bl-[6px] px-4 py-3.5">
          {message.isGenerating ? (
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-[typing_1.2s_infinite]" />
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-[typing_1.2s_infinite_0.2s]" />
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-[typing_1.2s_infinite_0.4s]" />
              </div>
              <span className="text-[11px] text-[#666] ml-2">печатает</span>
            </div>
          ) : (
            <>
              <div className="markdown text-[#E5E5E5] select-text" style={{ fontFamily: 'Gotham, Manrope, sans-serif', fontWeight: 500, lineHeight: 1.65, fontSize: '14px' }} dangerouslySetInnerHTML={{ __html: html }} />
              {codeBlocks.length > 0 && (
                <div className="mt-4 space-y-3">
                  {codeBlocks.map((block, i) => (
                    <div key={i} className="group/code relative bg-[#0E0E0E] border border-[#222] rounded-[12px] overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border-b border-[#222]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
                          <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                          <div className="w-2 h-2 rounded-full bg-[#28CA42]" />
                          <span className="ml-2 text-[11px] font-mono text-[#666]">{block.lang} • {block.fileName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => downloadCode(block.code, block.fileName)} className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition text-[#888] hover:text-white" title={`Скачать ${block.fileName}`}>
                            <DownloadIcon size={12}/>
                          </button>
                          <button onClick={async () => { await navigator.clipboard.writeText(block.code); setCopiedCode(`${i}`); setTimeout(() => setCopiedCode(null), 2000) }} className="h-7 px-3 rounded-full bg-white text-black text-[11px] font-medium hover:bg-white/90 transition flex items-center gap-1">
                            {copiedCode === `${i}` ? <><CheckIcon size={10}/> скопировано</> : <><CopyIcon size={10}/> копировать</>}
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 overflow-x-auto text-[12px] font-mono m-0 border-0 rounded-none bg-transparent max-h-[400px]"><code className="text-[#CCC] select-text whitespace-pre">{block.code}</code></pre>
                    </div>
                  ))}
                </div>
              )}
              <div className="absolute bottom-1.5 right-2.5 text-[10px] font-mono text-white/20 select-none">{timeStr}</div>
            </>
          )}
        </div>

        {!message.isGenerating && (
          <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => copyText(message.content)} className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] transition text-[#666] hover:text-white" title="Копировать">
              {copied ? <CheckIcon size={12}/> : <CopyIcon size={12}/>}
            </button>
            <button onClick={() => setLiked(liked === 'like' ? null : 'like')} className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${liked === 'like' ? 'bg-white text-black border-white' : 'bg-white/[0.05] border-white/[0.06] text-[#666] hover:text-white hover:bg-white/[0.08]'}`} title="Нравится">
              <LikeIcon size={12} filled={liked==='like'}/>
            </button>
            <button onClick={() => setLiked(liked === 'dislike' ? null : 'dislike')} className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${liked === 'dislike' ? 'bg-white text-black border-white' : 'bg-white/[0.05] border-white/[0.06] text-[#666] hover:text-white hover:bg-white/[0.08]'}`} title="Не нравится">
              <DislikeIcon size={12} filled={liked==='dislike'}/>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
