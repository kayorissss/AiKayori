import { useEffect, useState } from 'react'
import TitleBar from '@/components/TitleBar'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import FilePanel from '@/components/FilePanel'
import SettingsModal from '@/components/SettingsModal'
import AccountModal from '@/components/AccountModal'
import { useChatStore } from '@/store/chatStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function App() {
  const loadChats = useChatStore(s => s.loadChats)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) setCollapsed(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    loadChats()
    const timer = setTimeout(() => setShowSplash(false), 1200)
    const onOpenAccount = () => setAccountOpen(true)
    window.addEventListener('open-account' as any, onOpenAccount)
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
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-account' as any, onOpenAccount)
    }
  }, [settingsOpen, accountOpen])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080808] text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.02),transparent_60%)]" />
      </div>

      <AnimatePresence>
        {showSplash && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[300] bg-[#080808] flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="flex flex-col items-center">
              <div className="w-[80px] h-[80px] md:w-[96px] md:h-[96px] rounded-[20px] md:rounded-[28px] overflow-hidden bg-white/[0.06] border border-white/[0.08] mb-6 flex items-center justify-center">
                <img src="./logo-kayori.png" alt="Kayori" className="w-[70%] h-[70%] object-contain" />
              </div>
              <div className="flex items-baseline gap-[2px]">
                <span className="text-[20px] md:text-[24px] font-bold tracking-tight text-white" style={{ fontFamily: 'Unbounded, sans-serif' }}>AI</span>
                <span className="text-[20px] md:text-[24px] font-medium tracking-tight text-[#777]" style={{ fontFamily: 'Unbounded, sans-serif' }}>Kayori</span>
              </div>
              <div className="text-[10px] md:text-[11px] font-mono text-[#444] mt-2 tracking-widest">v4.1.0</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobile && <TitleBar />}

      <div className={`flex flex-1 overflow-hidden min-h-0 relative z-10 ${isMobile ? 'pt-0' : 'pt-[48px]'}`}>
        {/* Mobile backdrop when sidebar open */}
        <AnimatePresence>
          {isMobile && !collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20" onClick={() => setCollapsed(true)} />
          )}
        </AnimatePresence>

        {/* Sidebar - drawer on mobile */}
        <div className={`${isMobile ? 'absolute inset-y-0 left-0 z-30' : 'relative'} ${isMobile && collapsed ? 'pointer-events-none' : ''}`}>
          <Sidebar onOpenSettings={() => setSettingsOpen(true)} collapsed={isMobile ? false : collapsed} onToggle={() => setCollapsed(!collapsed)} isMobile={isMobile} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#080808] relative">
          {isMobile && (
            <div className="h-[48px] border-b border-white/[0.06] flex items-center px-3 gap-3 bg-[#0A0A0A] shrink-0">
              <button onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[8px] overflow-hidden bg-white/[0.06] border border-white/[0.08]"><img src="./logo-kayori.png" alt="k" className="w-full h-full object-cover" /></div>
                <span className="text-[14px] font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}>AI<span className="text-[#777] font-medium">Kayori</span></span>
              </div>
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            <ChatArea />
            <FilePanel />
          </div>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
