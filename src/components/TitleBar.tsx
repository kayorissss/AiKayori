import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TitleBar({ theme, version }: { theme?: string, version?: string }) {
  const [isElectron, setIsElectron] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [rememberChoice, setRememberChoice] = useState(false)
  const [hoverTip, setHoverTip] = useState<string | null>(null)

  useEffect(() => {
    // @ts-ignore
    setIsElectron(!!window.electronAPI)
  }, [])

  const handleMin = () => {
    // @ts-ignore
    window.electronAPI?.minimize()
  }
  const handleMax = () => {
    // @ts-ignore
    window.electronAPI?.maximize()
  }
  const handleClose = () => {
    const saved = localStorage.getItem('close-behavior')
    if (saved === 'tray') {
      // @ts-ignore
      window.electronAPI?.minimizeToTray?.() || window.electronAPI?.minimize()
      return
    }
    if (saved === 'close') {
      // @ts-ignore
      window.electronAPI?.close()
      return
    }
    setShowCloseDialog(true)
  }
  const confirmClose = (behavior: 'close' | 'tray') => {
    if (rememberChoice) localStorage.setItem('close-behavior', behavior)
    setShowCloseDialog(false)
    if (behavior === 'tray') {
      // @ts-ignore
      window.electronAPI?.minimizeToTray?.() || window.electronAPI?.minimize()
    } else {
      // @ts-ignore
      window.electronAPI?.close()
    }
  }

  return (
    <>
      <div className="h-[48px] bg-[#0A0A0A]/90 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-5 select-none drag-region fixed top-0 left-0 right-0 z-[100]">
        <div className="flex items-center gap-3 no-drag">
          <div className="w-8 h-8 rounded-[12px] overflow-hidden bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <img src="./logo-kayori.png" alt="Kayori" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-baseline gap-[1px]">
            <span className="text-[14px] font-bold tracking-tight text-white" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>AI</span>
            <span className="text-[14px] font-medium tracking-tight text-[#9A9A9A]" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 500 }}>KAYORI</span>
          </div>
          <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-[#666] tracking-widest">{version || 'V5.0.0'}</span>
        </div>

        <div className="flex items-center gap-1 no-drag">
          {isElectron ? (
            <>
              <div className="relative" onMouseEnter={() => setHoverTip('Свернуть')} onMouseLeave={() => setHoverTip(null)}>
                <button onClick={handleMin} className="w-8 h-8 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition group">
                  <span className="w-3 h-[1px] bg-white/50 group-hover:bg-white/90 block" />
                </button>
                {hoverTip === 'Свернуть' && <div className="absolute top-full right-0 mt-2 px-2.5 py-1 rounded-full bg-black border border-white/10 text-[10px] text-white whitespace-nowrap">Свернуть</div>}
              </div>
              <div className="relative" onMouseEnter={() => setHoverTip('Развернуть')} onMouseLeave={() => setHoverTip(null)}>
                <button onClick={handleMax} className="w-8 h-8 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition group">
                  <span className="w-3 h-3 border border-white/50 group-hover:border-white/90 rounded-[2px] block" />
                </button>
                {hoverTip === 'Развернуть' && <div className="absolute top-full right-0 mt-2 px-2.5 py-1 rounded-full bg-black border border-white/10 text-[10px] text-white whitespace-nowrap">Развернуть • F11</div>}
              </div>
              <div className="relative" onMouseEnter={() => setHoverTip('Закрыть')} onMouseLeave={() => setHoverTip(null)}>
                <button onClick={handleClose} className="w-8 h-8 rounded-full hover:bg-[#FF3B30] flex items-center justify-center transition group ml-1">
                  <span className="relative w-3 h-3 block">
                    <span className="absolute top-1/2 left-0 w-3 h-[1px] bg-white/70 group-hover:bg-white rotate-45 -translate-y-1/2 block" />
                    <span className="absolute top-1/2 left-0 w-3 h-[1px] bg-white/70 group-hover:bg-white -rotate-45 -translate-y-1/2 block" />
                  </span>
                </button>
                {hoverTip === 'Закрыть' && <div className="absolute top-full right-0 mt-2 px-2.5 py-1 rounded-full bg-black border border-white/10 text-[10px] text-white whitespace-nowrap">Закрыть</div>}
              </div>
            </>
          ) : (
            <div className="text-[11px] font-mono text-[#666] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] tracking-widest">{version || 'V5.0.0'}</div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCloseDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-[20px] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="bg-[#141414] border border-white/[0.08] rounded-[24px] p-6 w-full max-w-[360px] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
              <div className="text-[16px] font-bold" style={{ fontWeight: 700 }}>Закрыть AI-KAYORI?</div>
              <div className="text-[13px] text-[#888] mt-2 leading-relaxed">Выбери действие. Можно запомнить выбор.</div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="remember" checked={rememberChoice} onChange={e => setRememberChoice(e.target.checked)} className="rounded" />
                <label htmlFor="remember" className="text-[12px] text-[#666]">Запомнить выбор</label>
              </div>
              <div className="flex gap-2.5 mt-6">
                <button onClick={() => setShowCloseDialog(false)} className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full py-3 text-[13px] font-medium">Отмена</button>
                <button onClick={() => confirmClose('tray')} className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full py-3 text-[13px] font-medium">В трей</button>
                <button onClick={() => confirmClose('close')} className="flex-1 bg-white text-black rounded-full py-3 text-[13px] font-bold">Закрыть</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
