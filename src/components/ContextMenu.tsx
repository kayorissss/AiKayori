import { motion } from 'framer-motion'

export default function ContextMenu({ x, y, target, onClose }: { x: number, y: number, target: HTMLElement | null, onClose: () => void }) {
  const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as any).isContentEditable || target.closest('input, textarea, [contenteditable]'))
  const hasSelection = typeof window !== 'undefined' && window.getSelection()?.toString()

  const items = []

  if (isInput) {
    items.push(
      { label: 'Вырезать', icon: '✂', action: () => document.execCommand('cut') },
      { label: 'Копировать', icon: '⧉', action: () => document.execCommand('copy') },
      { label: 'Вставить', icon: '⎘', action: async () => { try { const t = await navigator.clipboard.readText(); if (target && (target as HTMLInputElement).value !== undefined) { const el = target as HTMLInputElement; const start = el.selectionStart || 0; const end = el.selectionEnd || 0; el.value = el.value.slice(0,start)+t+el.value.slice(end); el.dispatchEvent(new Event('input', { bubbles: true })) } } catch {} } },
    )
  } else if (hasSelection) {
    items.push(
      { label: 'Копировать', icon: '⧉', action: () => { const s = window.getSelection()?.toString(); if (s) navigator.clipboard.writeText(s) } },
    )
  }

  items.push(
    { label: 'Выделить всё', icon: '☰', action: () => { if (isInput) (target as HTMLInputElement).select?.(); else document.execCommand('selectAll') } },
  )

  if (!isInput && !hasSelection) {
    items.push(
      { label: 'Копировать текст', icon: '⧉', action: () => { const txt = target?.innerText?.slice(0,500); if (txt) navigator.clipboard.writeText(txt) } },
      { label: 'Вставить', icon: '⎘', action: async () => { try { const t = await navigator.clipboard.readText(); const active = document.activeElement as any; if (active && active.value !== undefined) active.value += t } catch {} } },
    )
  }

  // Adjust position to stay in viewport
  const adjX = Math.min(x, window.innerWidth - 200)
  const adjY = Math.min(y, window.innerHeight - 200)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="fixed z-[300] w-[200px] bg-[#161616] border border-white/[0.10] rounded-[14px] shadow-[0_16px_40px_rgba(0,0,0,0.6)] p-1.5 overflow-hidden" style={{ left: adjX, top: adjY }} onClick={e => e.stopPropagation()}>
      {items.map((it, idx) => (
        <button key={idx} onClick={() => { it.action(); onClose() }} className="w-full text-left px-3 py-2 rounded-[10px] text-[12px] hover:bg-white/[0.08] flex items-center gap-2.5 text-[#CCC] hover:text-white transition font-medium">
          <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[10px]">{it.icon}</span>
          {it.label}
        </button>
      ))}
    </motion.div>
  )
}
