import { useEffect, useState } from 'react'
import TitleBar from '@/components/TitleBar'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import FilePanel from '@/components/FilePanel'
import SettingsModal from '@/components/SettingsModal'
import ImageViewer from '@/components/ImageViewer'
import ContextMenu from '@/components/ContextMenu'
import { useChatStore } from '@/store/chatStore'
import { motion, AnimatePresence } from 'framer-motion'
import { getSetting, saveSetting } from '@/lib/storage'

export default function App() {
  const loadChats = useChatStore(s => s.loadChats)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showFiles, setShowFiles] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [viewerImage, setViewerImage] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, target: HTMLElement | null } | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    getSetting<'dark' | 'light'>('theme', 'dark').then(t => setTheme(t as any || 'dark'))
    loadChats()
    const timer = setTimeout(() => setShowSplash(false), 500)
    const onOpenImage = (e: any) => setViewerImage(e.detail.url)
    window.addEventListener('open-image' as any, onOpenImage)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen()
      }
      if (e.key === 'Escape') {
        if (settingsOpen) { e.preventDefault(); e.stopPropagation(); setSettingsOpen(false); return }
        if (contextMenu) { setContextMenu(null); return }
      }
    }
    window.addEventListener('keydown', onKey)
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, target: e.target as HTMLElement })
    }
    window.addEventListener('contextmenu', onContextMenu)
    const onClick = () => setContextMenu(null)
    window.addEventListener('click', onClick)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-image' as any, onOpenImage)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('click', onClick)
    }
  }, [settingsOpen, contextMenu])

  const toggleTheme = () => {
    const nt = theme === 'dark' ? 'light' : 'dark'
    setTheme(nt)
    saveSetting('theme', nt)
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden relative select-none ${theme === 'dark' ? 'bg-[#080808] text-white' : 'bg-[#F5F5F5] text-black'}`}>
      <AnimatePresence>
        {showSplash && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className={`fixed inset-0 z-[300] flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#080808]' : 'bg-white'}`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex flex-col items-center">
              <div className="w-[72px] h-[72px] rounded-[18px] overflow-hidden bg-white/[0.06] border border-white/[0.08] mb-4 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                <img src="./logo-kayori.png" alt="Kayori" className="w-[70%] h-[70%] object-contain" />
              </div>
              <div className="flex items-baseline gap-[1px]">
                <span className="text-[20px] font-bold tracking-tight" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>AI</span>
                <span className="text-[20px] font-medium tracking-tight text-[#777]" style={{ fontFamily: 'Unbounded, sans-serif' }}>KAYORI</span>
                <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.06]">V5.0.6</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobile && <TitleBar theme={theme} version="V5.0.6" />}

      <div className={`flex flex-1 overflow-hidden min-h-0 relative z-10 ${isMobile ? 'pt-0' : 'pt-[48px]'}`}>
        <AnimatePresence>
          {isMobile && !collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20" onClick={() => setCollapsed(true)} />
          )}
        </AnimatePresence>

        <div className={`${isMobile ? 'absolute inset-y-0 left-0 z-30' : 'relative'} ${isMobile && collapsed ? 'pointer-events-none' : ''} flex`}>
          <Sidebar onOpenSettings={() => setSettingsOpen(true)} collapsed={isMobile ? false : collapsed} onToggle={() => setCollapsed(!collapsed)} isMobile={isMobile} theme={theme} />
          {!isMobile && !collapsed && (
            <div className="w-[5px] hover:w-[8px] bg-transparent hover:bg-white/[0.06] cursor-col-resize transition-all shrink-0" onMouseDown={e => {
              const startX = e.clientX
              const startWidth = 320
              const onMove = (ev: MouseEvent) => {
                const newWidth = Math.max(200, Math.min(480, startWidth + (ev.clientX - startX)))
                document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`)
              }
              const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
              window.addEventListener('mousemove', onMove)
              window.addEventListener('mouseup', onUp)
            }} />
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#080808] relative">
          {isMobile && (
            <div className="h-[48px] border-b border-white/[0.06] flex items-center px-3 gap-3 bg-[#0A0A0A] shrink-0">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.10] transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </motion.button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] overflow-hidden bg-white/[0.06] border border-white/[0.08]"><img src="./logo-kayori.png" alt="k" className="w-full h-full object-cover" /></div>
                <span className="text-[14px] font-bold" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}>AI<span className="text-[#777]">KAYORI</span></span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.08]">V5.0.6</span>
              </div>
              <div className="ml-auto flex gap-1.5">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowFiles(!showFiles)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${showFiles ? 'bg-white text-black border-white' : 'bg-white/[0.06] border-white/[0.06] text-[#666] hover:text-white'}`} title="Файлы">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                </motion.button>
              </div>
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            <ChatArea showFiles={showFiles} setShowFiles={setShowFiles} theme={theme} />
            <AnimatePresence>
              {showFiles && <FilePanel theme={theme} onClose={() => setShowFiles(false)} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} onToggleTheme={toggleTheme} />
      <ImageViewer url={viewerImage} onClose={() => setViewerImage(null)} />
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} target={contextMenu.target} onClose={() => setContextMenu(null)} />}
    </div>
  )
}
