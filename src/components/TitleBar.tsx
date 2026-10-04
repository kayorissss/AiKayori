import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TitleBar({ theme = 'dark', version }: { theme?: string; version?: string }) {
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

  const isLight = theme === 'light'
  const barBg = isLight
    ? 'bg-white/90 backdrop-blur-xl border-black/10 text-black'
    : 'bg-[#0A0A0A]/90 backdrop-blur-xl border-white/[0.06] text-white'
  const borderCol = isLight ? 'border-black/10' : 'border-white/[0.06]'
  const badgeBg = isLight ? 'bg-black/5 text-[#555]' : 'bg-white/[0.06] text-[#888]'

  return (
    <>
      <div
        className={`h-[44px] ${barBg} border-b flex items-center justify-between px-4 select-none drag-region fixed top-0 left-0 right-0 z-[100] transition-colors`}
      >
        <div className="flex items-center gap-2.5 no-drag">
          <div
            className={`w-7 h-7 rounded-[9px] overflow-hidden border ${borderCol} flex items-center justify-center ${
              isLight ? 'bg-white shadow-sm' : 'bg-white/[0.06]'
            }`}
          >
            <img src="./logo-kayori.png" alt="Kayori" className="w-5 h-5 object-contain" />
          </div>
          <div className="flex items-baseline gap-[1px]">
            <span
              className={`text-[13px] font-bold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}
              style={{ fontFamily: 'Gotham, sans-serif' }}
            >
              AI
            </span>
            <span
              className={`text-[13px] font-medium tracking-tight ${isLight ? 'text-[#666]' : 'text-[#888]'}`}
              style={{ fontFamily: 'Gotham, sans-serif' }}
            >
              KAYORI
            </span>
          </div>
          <span className={`ml-1.5 text-[9.5px] font-mono px-2 py-0.5 rounded-full border ${borderCol} ${badgeBg}`}>
            {version || 'V5.0.0'}
          </span>
        </div>

        <div className="flex items-center gap-1 no-drag">
          {isElectron ? (
            <>
              <div
                className="relative"
                onMouseEnter={() => setHoverTip('Свернуть')}
                onMouseLeave={() => setHoverTip(null)}
              >
                <button
                  onClick={handleMin}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                    isLight ? 'hover:bg-black/5 text-black' : 'hover:bg-white/[0.08] text-white'
                  }`}
                >
                  <span className={`w-3 h-[1.5px] ${isLight ? 'bg-black/70' : 'bg-white/70'} block`} />
                </button>
                {hoverTip === 'Свернуть' && (
                  <div className="absolute top-full right-0 mt-1.5 px-2 py-0.5 rounded-full bg-black text-white text-[10px] whitespace-nowrap z-50">
                    Свернуть
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setHoverTip('Развернуть')}
                onMouseLeave={() => setHoverTip(null)}
              >
                <button
                  onClick={handleMax}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                    isLight ? 'hover:bg-black/5 text-black' : 'hover:bg-white/[0.08] text-white'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 border ${isLight ? 'border-black/70' : 'border-white/70'} rounded-[2px] block`} />
                </button>
                {hoverTip === 'Развернуть' && (
                  <div className="absolute top-full right-0 mt-1.5 px-2 py-0.5 rounded-full bg-black text-white text-[10px] whitespace-nowrap z-50">
                    Развернуть • F11
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setHoverTip('Закрыть')}
                onMouseLeave={() => setHoverTip(null)}
              >
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full hover:bg-rose-500 hover:text-white flex items-center justify-center transition ml-0.5"
                >
                  <span className="text-[12px] font-bold leading-none">✕</span>
                </button>
                {hoverTip === 'Закрыть' && (
                  <div className="absolute top-full right-0 mt-1.5 px-2 py-0.5 rounded-full bg-black text-white text-[10px] whitespace-nowrap z-50">
                    Закрыть
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${borderCol} ${badgeBg}`}>
              {isLight ? 'Светлая тема' : 'Тёмная тема'}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCloseDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-[12px] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`border ${borderCol} rounded-[22px] p-6 w-full max-w-[360px] shadow-2xl ${
                isLight ? 'bg-white text-black' : 'bg-[#141414] text-white'
              }`}
            >
              <div className="text-[16px] font-bold">Закрыть AI-KAYORI?</div>
              <div className={`text-[12.5px] mt-1.5 leading-relaxed ${isLight ? 'text-[#666]' : 'text-[#888]'}`}>
                Выберите действие. Выбор можно запомнить.
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberChoice}
                  onChange={e => setRememberChoice(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="remember" className={`text-[12px] cursor-pointer ${isLight ? 'text-[#555]' : 'text-[#888]'}`}>
                  Запомнить мой выбор
                </label>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowCloseDialog(false)}
                  className={`flex-1 border ${borderCol} rounded-full py-2.5 text-[12px] font-medium ${
                    isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                  }`}
                >
                  Отмена
                </button>
                <button
                  onClick={() => confirmClose('tray')}
                  className={`flex-1 border ${borderCol} rounded-full py-2.5 text-[12px] font-medium ${
                    isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                  }`}
                >
                  В трей
                </button>
                <button
                  onClick={() => confirmClose('close')}
                  className={`flex-1 rounded-full py-2.5 text-[12px] font-bold ${
                    isLight ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
