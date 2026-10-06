import { useEffect, useState } from 'react'
import TitleBar from '@/components/TitleBar'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import FilePanel from '@/components/FilePanel'
import SettingsModal from '@/components/SettingsModal'
import AccountModal from '@/components/AccountModal'
import ImageViewer from '@/components/ImageViewer'
import { useChatStore } from '@/store/chatStore'
import { motion, AnimatePresence } from 'framer-motion'
import { getSetting, saveSetting } from '@/lib/storage'

export default function App() {
  const loadChats = useChatStore(s => s.loadChats)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showFiles, setShowFiles] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [viewerImage, setViewerImage] = useState<string | null>(null)

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
    const timer = setTimeout(() => setShowSplash(false), 600) // Faster startup
    const onOpenAccount = () => setAccountOpen(true)
    const onOpenImage = (e: any) => setViewerImage(e.detail.url)
    window.addEventListener('open-account' as any, onOpenAccount)
    window.addEventListener('open-image' as any, onOpenImage)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen()
      }
      if (e.key === 'Escape') {
        if (settingsOpen || accountOpen) {
          e.preventDefault(); e.stopPropagation()
          setSettingsOpen(false); setAccountOpen(false); return
        }
      }
    }
    window.addEventListener('keydown', onKey)
    // Context menu for copy/paste everywhere
    const onContextMenu = (e: MouseEvent) => {
      // Allow native context menu for inputs and text selection
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || window.getSelection()?.toString()) {
        return // allow native
      }
    }
    window.addEventListener('contextmenu', onContextMenu as any)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-account' as any, onOpenAccount)
      window.removeEventListener('open-image' as any, onOpenImage)
    }
  }, [settingsOpen, accountOpen])

  const toggleTheme = () => {
    const nt = theme === 'dark' ? 'light' : 'dark'
    setTheme(nt)
    saveSetting('theme', nt)
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden relative ${theme === 'dark' ? 'bg-[#080808] text-white' : 'bg-[#F5F5F5] text-black'}`}>
      <AnimatePresence>
        {showSplash && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className={`fixed inset-0 z-[300] flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#080808]' : 'bg-white'}`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="flex flex-col items-center">
              <div className="w-[72px] h-[72px] rounded-[18px] overflow-hidden bg-white/[0.06] border border-white/[0.08] mb-4 flex items-center justify-center">
                <img src="./logo-kayori.png" alt="Kayori" className="w-[70%] h-[70%] object-contain" />
              </div>
              <div className="flex items-baseline gap-[1px]">
                <span className="text-[20px] font-bold tracking-tight" style={{ fontFamily: 'Unbounded, sans-serif' }}>AI</span>
                <span className="text-[20px] font-medium tracking-tight text-[#777]" style={{ fontFamily: 'Unbounded, sans-serif' }}>KAYORI</span>
                <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.06]">v5.0.1</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobile && <TitleBar theme={theme} version="v5.0.1" />}

      <div className={`flex flex-1 overflow-hidden min-h-0 relative z-10 ${isMobile ? 'pt-0' : 'pt-[48px]'}`}>
        <AnimatePresence>
          {isMobile && !collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 z-20" onClick={() => setCollapsed(true)} />
          )}
        </AnimatePresence>

        <div className={`${isMobile ? 'absolute inset-y-0 left-0 z-30' : 'relative'} ${isMobile && collapsed ? 'pointer-events-none' : ''} flex`}>
          <Sidebar onOpenSettings={() => setSettingsOpen(true)} collapsed={isMobile ? false : collapsed} onToggle={() => setCollapsed(!collapsed)} isMobile={isMobile} theme={theme} />
          {/* Resizable border */}
          {!isMobile && !collapsed && (
            <div className="w-[4px] hover:w-[6px] bg-transparent hover:bg-white/[0.06] cursor-col-resize transition-all shrink-0" onMouseDown={e => {
              const startX = e.clientX
              const startWidth = 320
              const onMove = (ev: MouseEvent) => {
                const newWidth = Math.max(200, Math.min(500, startWidth + (ev.clientX - startX)))
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
              <button onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] overflow-hidden bg-white/[0.06] border border-white/[0.08]"><img src="./logo-kayori.png" alt="k" className="w-full h-full object-cover" /></div>
                <span className="text-[14px] font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>AI<span className="text-[#777]">KAYORI</span></span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.08]">v5.0.1</span>
              </div>
              <div className="ml-auto flex gap-1.5">
                <button onClick={() => setShowFiles(!showFiles)} className={`w-8 h-8 rounded-full border flex items-center justify-center ${showFiles ? 'bg-white text-black border-white' : 'bg-white/[0.06] border-white/[0.06] text-[#666]'}`} title="Файлы">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                </button>
                <button onClick={toggleTheme} className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[#666]">
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            <ChatArea showFiles={showFiles} setShowFiles={setShowFiles} theme={theme} />
            {showFiles && <FilePanel theme={theme} onClose={() => setShowFiles(false)} />}
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} onToggleTheme={toggleTheme} />
      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} theme={theme} />
      <ImageViewer url={viewerImage} onClose={() => setViewerImage(null)} />
    </div>
  )
}
