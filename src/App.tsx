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
  const [showFiles, setShowFiles] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [viewerImage, setViewerImage] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setCollapsed(true)
        setShowFiles(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    getSetting<'dark' | 'light'>('theme', 'dark').then(t => {
      const active = t || 'dark'
      setTheme(active)
      if (active === 'light') {
        document.documentElement.classList.add('light')
        document.body.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
        document.body.classList.remove('light')
      }
    })

    loadChats()
    const timer = setTimeout(() => setShowSplash(false), 450)

    const onOpenAccount = () => setAccountOpen(true)
    const onOpenSettings = () => setSettingsOpen(true)
    const onOpenImage = (e: any) => setViewerImage(e.detail.url)

    window.addEventListener('open-account' as any, onOpenAccount)
    window.addEventListener('open-settings' as any, onOpenSettings)
    window.addEventListener('open-image' as any, onOpenImage)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen()
      }
      if (e.key === 'Escape') {
        if (settingsOpen || accountOpen) {
          e.preventDefault()
          e.stopPropagation()
          setSettingsOpen(false)
          setAccountOpen(false)
        }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-account' as any, onOpenAccount)
      window.removeEventListener('open-settings' as any, onOpenSettings)
      window.removeEventListener('open-image' as any, onOpenImage)
    }
  }, [settingsOpen, accountOpen])

  const toggleTheme = () => {
    const nt = theme === 'dark' ? 'light' : 'dark'
    setTheme(nt)
    saveSetting('theme', nt)
    if (nt === 'light') {
      document.documentElement.classList.add('light')
      document.body.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
      document.body.classList.remove('light')
    }
  }

  const isLight = theme === 'light'

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden relative transition-colors duration-200 ${
        isLight ? 'bg-[#F6F7F9] text-[#111827]' : 'bg-[#080808] text-white'
      }`}
    >
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 z-[300] flex flex-col items-center justify-center ${
              isLight ? 'bg-[#FFFFFF]' : 'bg-[#080808]'
            }`}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div
                className={`w-[68px] h-[68px] rounded-[20px] overflow-hidden border mb-3 flex items-center justify-center shadow-lg ${
                  isLight ? 'bg-white border-black/10' : 'bg-white/[0.06] border-white/[0.08]'
                }`}
              >
                <img src="./logo-kayori.png" alt="Kayori" className="w-[75%] h-[75%] object-contain" />
              </div>
              <div className="flex items-baseline gap-[1px]">
                <span className="text-[20px] font-bold tracking-tight">AI</span>
                <span className={`text-[20px] font-medium tracking-tight ${isLight ? 'text-[#666]' : 'text-[#888]'}`}>
                  KAYORI
                </span>
                <span
                  className={`ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isLight ? 'bg-black/5 border-black/10 text-black' : 'bg-white/[0.08] border-white/[0.06] text-white'
                  }`}
                >
                  v5.0.0
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Custom TitleBar */}
      {!isMobile && <TitleBar theme={theme} version="v5.0.0" />}

      {/* Main App Container */}
      <div className={`flex flex-1 overflow-hidden min-h-0 relative z-10 ${isMobile ? 'pt-0' : 'pt-[44px]'}`}>
        {/* Mobile Backdrop */}
        <AnimatePresence>
          {isMobile && !collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 backdrop-blur-[4px]"
              onClick={() => setCollapsed(true)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <div
          className={`${
            isMobile
              ? `fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${
                  collapsed ? '-translate-x-full pointer-events-none' : 'translate-x-0'
                }`
              : 'relative'
          } flex h-full`}
        >
          <Sidebar
            onOpenSettings={() => setSettingsOpen(true)}
            collapsed={isMobile ? false : collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            isMobile={isMobile}
            theme={theme}
          />
          {!isMobile && !collapsed && (
            <div
              className={`w-[3px] hover:w-[5px] bg-transparent hover:bg-blue-500/30 cursor-col-resize transition-all shrink-0`}
              onMouseDown={e => {
                const startX = e.clientX
                const startWidth = 300
                const onMove = (ev: MouseEvent) => {
                  const newWidth = Math.max(220, Math.min(480, startWidth + (ev.clientX - startX)))
                  document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`)
                }
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove)
                  window.removeEventListener('mouseup', onUp)
                }
                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
              }}
            />
          )}
        </div>

        {/* Chat + FilePanel Container */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 relative ${isLight ? 'bg-[#F6F7F9]' : 'bg-[#080808]'}`}>
          {/* Mobile Top Bar */}
          {isMobile && (
            <div
              className={`h-[48px] border-b flex items-center px-3.5 gap-3 shrink-0 ${
                isLight ? 'bg-white border-black/10 text-black' : 'bg-[#0A0A0A] border-white/[0.06] text-white'
              }`}
            >
              <button
                onClick={() => setCollapsed(false)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  isLight ? 'bg-black/5 border-black/5 text-black' : 'bg-white/[0.06] border-white/[0.06] text-white'
                }`}
                title="Меню чатов"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-[7px] overflow-hidden border flex items-center justify-center ${
                    isLight ? 'bg-white border-black/10' : 'bg-white/[0.06] border-white/[0.08]'
                  }`}
                >
                  <img src="./logo-kayori.png" alt="k" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-[13px] font-bold">
                  AI<span className={isLight ? 'text-[#666]' : 'text-[#888]'}>KAYORI</span>
                </span>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={toggleTheme}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-[13px] transition ${
                    isLight ? 'bg-black/5 border-black/10 text-black' : 'bg-white/[0.06] border-white/[0.08] text-white'
                  }`}
                  title="Переключить тему"
                >
                  {isLight ? '🌙' : '☀️'}
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                    isLight ? 'bg-black/5 border-black/10 text-black' : 'bg-white/[0.06] border-white/[0.08] text-white'
                  }`}
                  title="Настройки"
                >
                  ⚙️
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

      {/* Settings Dialog */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Account Dialog */}
      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} theme={theme} />

      {/* Fullscreen Image Viewer */}
      <ImageViewer url={viewerImage} onClose={() => setViewerImage(null)} />
    </div>
  )
}
