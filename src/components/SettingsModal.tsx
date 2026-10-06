import { motion, AnimatePresence } from 'framer-motion'
import { APP_VERSION, DEVELOPER } from '@/lib/version'
import { useEffect, useState } from 'react'
import { getSetting, saveSetting } from '@/lib/storage'
import { getBaseKeysStatus } from '@/lib/ai'

interface Props { open: boolean; onClose: () => void; theme?: string; onToggleTheme?: () => void }

function GearIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z"/></svg> }
function ShieldIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function InfoIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> }
function PuzzleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2z"/><path d="M7 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z"/><path d="M7 14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2z"/><path d="M14 14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2z"/></svg> }
function KeyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3-3.5 3.5z"/></svg> }

export default function SettingsModal({ open, onClose, theme, onToggleTheme }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'about' | 'addons' | 'keys'>('general')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [updateStatus, setUpdateStatus] = useState('Нажми чтобы проверить')
  const [hasUpdate, setHasUpdate] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const [otherRepos, setOtherRepos] = useState<any[]>([])
  const [repoReleases, setRepoReleases] = useState<Record<string, any>>({})
  const [keysStatus, setKeysStatus] = useState<any>(null)

  useEffect(() => {
    if (open) {
      getSetting('auto-update', true).then(v => setAutoUpdate(v as boolean))
      getBaseKeysStatus().then(setKeysStatus)
      fetch('https://api.github.com/users/kayorissss/repos?per_page=30&sort=updated').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter((r: any) => r.name.toLowerCase() !== 'aikayori' && !r.fork).slice(0, 12)
          setOtherRepos(filtered)
          filtered.forEach((repo: any) => {
            fetch(`https://api.github.com/repos/kayorissss/${repo.name}/releases/latest`).then(r => r.json()).then(rel => {
              if (rel && rel.assets && rel.assets.length > 0) setRepoReleases(prev => ({ ...prev, [repo.name]: rel }))
            }).catch(() => {})
          })
        }
      }).catch(() => {})
    }
  }, [open])

  const checkUpdates = async () => {
    setUpdateStatus('Проверка...')
    try {
      const res = await fetch('https://api.github.com/repos/kayorissss/AiKayori/releases/latest')
      const data = await res.json()
      const latest = data.tag_name?.replace('v','') || APP_VERSION
      setLatestVersion(latest)
      if (latest === APP_VERSION) { setUpdateStatus(`У тебя последняя v${APP_VERSION}`); setHasUpdate(false) }
      else { setUpdateStatus(`Доступна v${latest}, у тебя v${APP_VERSION}`); setHasUpdate(true) }
    } catch { setUpdateStatus('Не удалось проверить') }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-[16px]" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="w-full max-w-[1100px] h-[92vh] md:h-[84vh] bg-[#121212] border border-white/[0.08] rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-[56px] border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0 bg-[#151515]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.06] border border-white/[0.06] flex items-center justify-center"><GearIcon/></div>
                <div className="text-[15px] font-bold" style={{ fontWeight: 700 }}>Настройки</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-[#666]">V{APP_VERSION}</span>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.10] transition">×</motion.button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              <div className="w-full md:w-[200px] border-b md:border-b-0 md:border-r border-white/[0.06] p-2 md:p-3 flex md:flex-col gap-1 bg-[#0F0F0F] overflow-x-auto md:overflow-y-auto shrink-0">
                <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">
                {[
                  { id: 'general', label: 'Общие', icon: <GearIcon/> },
                  { id: 'privacy', label: 'Приватность', icon: <ShieldIcon/> },
                  { id: 'about', label: 'О программе', icon: <InfoIcon/> },
                  { id: 'addons', label: 'Дополнения', icon: <PuzzleIcon/> },
                  { id: 'keys', label: 'Ключи API', icon: <KeyIcon/> },
                ].map(tab => (
                  <motion.button key={tab.id} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap md:w-full text-left px-3 py-2.5 rounded-[12px] text-[13px] transition flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-black shadow-[0_2px_8px_rgba(255,255,255,0.15)]' : 'hover:bg-white/[0.06] text-[#888] hover:text-[#DDD]'}`} style={{ fontWeight: activeTab === tab.id ? 700 : 600 }}>
                    {tab.icon} {tab.label}
                  </motion.button>
                ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#0A0A0A] flex justify-center">
                <div className="w-full max-w-[720px]">
                {activeTab === 'general' && (
                  <div className="space-y-5">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Общие</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-5 hover:border-white/[0.10] transition">
                      <div className="flex items-center justify-between">
                        <div><div className="text-[14px] font-bold" style={{ fontWeight: 700 }}>Автообновление</div><div className="text-[12px] text-[#666] mt-1">Проверять при запуске</div></div>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { const nv = !autoUpdate; setAutoUpdate(nv); saveSetting('auto-update', nv) }} className={`w-12 h-7 rounded-full transition flex items-center px-1 ${autoUpdate ? 'bg-white' : 'bg-white/10'}`}>
                          <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`w-5 h-5 rounded-full ${autoUpdate ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`} />
                        </motion.button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-3">
                        <motion.button whileTap={{ scale: 0.95 }} onClick={checkUpdates} className="px-4 py-2 rounded-full bg-[#1E1E1E] border border-white/[0.08] text-[12px] hover:bg-[#252525] flex items-center gap-2 font-semibold transition">Проверить {hasUpdate && <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />}</motion.button>
                        <span className="text-[11px] font-mono text-[#666]">{updateStatus}</span>
                      </div>
                      {hasUpdate && (
                        <div className="mt-4 p-3 rounded-[12px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-between">
                          <div className="text-[12px] font-bold text-[#FF6B6B]">Доступна v{latestVersion}</div>
                          <a href={`https://github.com/kayorissss/AiKayori/releases/tag/v${latestVersion}`} target="_blank" className="px-3 py-1.5 rounded-full bg-[#FF3B30] text-white text-[11px] font-bold">Скачать</a>
                        </div>
                      )}
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-5 hover:border-white/[0.10] transition">
                      <div className="text-[14px] font-bold mb-2" style={{ fontWeight: 700 }}>Тема</div>
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] text-[#666]">Светлая / тёмная</div>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onToggleTheme && onToggleTheme()} className={`w-12 h-7 rounded-full transition flex items-center px-1 ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                          <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`w-5 h-5 rounded-full ${theme === 'light' ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`} />
                        </motion.button>
                      </div>
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-5 hover:border-white/[0.10] transition">
                      <div className="text-[14px] font-bold mb-2" style={{ fontWeight: 700 }}>Закрытие окна</div>
                      <div className="text-[12px] text-[#666]">При крестике выбор: закрыть или в трей. Можно запомнить.</div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { localStorage.removeItem('close-behavior'); alert('Сброшено') }} className="mt-3 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-semibold hover:bg-white/[0.10] transition">Сбросить выбор</motion.button>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Конфиденциальность</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <h3 className="text-[14px] font-bold mb-3" style={{ fontWeight: 700 }}>Политика AI-KAYORI v5.0.4</h3>
                      <div className="space-y-3 text-[12px] text-[#999] leading-[1.7]">
                        <p><b className="text-white">1. Хранение.</b> Все чаты, файлы, фото — только локально в IndexedDB. Серверов нет.</p>
                        <p><b className="text-white">2. Ключи.</b> Базовые зашиты, кастомные — локально. Используются для прямых запросов к провайдерам.</p>
                        <p><b className="text-white">3. Телеметрия.</b> Отсутствует. Никаких трекеров.</p>
                        <p><b className="text-white">4. Контент.</b> Запрещена только детская порнография. Остальное — по политике модели.</p>
                        <p><b className="text-white">5. Права.</b> Ты владелец данных. Удаляй в один клик.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>О программе</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6 hover:border-white/[0.08] transition">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-[14px] overflow-hidden border border-white/[0.08] bg-[#0A0A0A]"><img src="./logo-kayori.png" alt="logo" className="w-full h-full object-cover" /></div>
                        <div><div className="text-[18px] font-bold" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}><span className="text-white">AI</span><span className="text-[#888]">KAYORI</span></div><div className="text-[12px] font-mono text-[#666]">V{APP_VERSION} • BLACK EDITION</div></div>
                      </div>
                      <p className="text-[13px] text-[#888] leading-[1.6]">Приватный AI-ассистент с памятью чатов, файлами, фото, кодом. Работает на OrcaRouter, Cloudflare AI, Google Gemini. Локальное хранение, быстрый UI.</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                        <div className="bg-[#0A0A0A] border border-white/[0.04] rounded-[10px] p-3"><div className="text-[#555]">Модели</div><div className="text-white font-bold mt-1">Gemini, DeepSeek, GLM, Hunyuan, Mistral, Qwen</div></div>
                        <div className="bg-[#0A0A0A] border border-white/[0.04] rounded-[10px] p-3"><div className="text-[#555]">Память</div><div className="text-white font-bold mt-1">16 сообщений + файлы</div></div>
                      </div>
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6 hover:border-white/[0.08] transition">
                      <div className="text-[14px] font-bold mb-3" style={{ fontWeight: 700 }}>Разработчик</div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">K</div>
                        <div><div className="font-bold">{DEVELOPER.name}</div><div className="text-[11px] text-[#666] font-mono">{DEVELOPER.github}</div></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'keys' && (
                  <div className="space-y-5">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Ключи API — базовые встроены</h2>
                    <p className="text-[12px] text-[#666]">Работает из коробки. Если надо свои — ссылки ниже.</p>
                    <div className="grid gap-3">
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="group bg-[#151515] border border-white/[0.06] rounded-[14px] p-4 flex justify-between items-center hover:border-white/[0.12] hover:bg-[#1A1A1A] transition">
                        <div><div className="text-[13px] font-bold group-hover:text-white transition">Google AI Studio — Gemini</div><div className="text-[11px] text-[#666] mt-1 font-mono">aistudio.google.com/app/apikey</div></div>
                        <div className="flex items-center gap-2"><span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/20">{keysStatus?.google ? 'встроен' : 'нет'}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
                      </a>
                      <a href="https://www.orcarouter.ai/console/token" target="_blank" className="group bg-[#151515] border border-white/[0.06] rounded-[14px] p-4 flex justify-between items-center hover:border-white/[0.12] hover:bg-[#1A1A1A] transition">
                        <div><div className="text-[13px] font-bold group-hover:text-white transition">OrcaRouter — бесплатные модели</div><div className="text-[11px] text-[#666] mt-1 font-mono">orcarouter.ai/console/token — DeepSeek, GLM, Hunyuan</div></div>
                        <div className="flex items-center gap-2"><span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/20">{keysStatus?.orca ? 'встроен' : 'нет'}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
                      </a>
                      <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" className="group bg-[#151515] border border-white/[0.06] rounded-[14px] p-4 flex justify-between items-center hover:border-white/[0.12] hover:bg-[#1A1A1A] transition">
                        <div><div className="text-[13px] font-bold group-hover:text-white transition">Cloudflare — Workers AI Token</div><div className="text-[11px] text-[#666] mt-1 font-mono">dash.cloudflare.com/profile/api-tokens</div></div>
                        <div className="flex items-center gap-2"><span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/20">{keysStatus?.cfToken ? 'встроен' : 'нет'}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>
                      </a>
                    </div>
                    {keysStatus && (
                      <div className="bg-[#0A0A0A] border border-white/[0.06] rounded-[14px] p-4 font-mono text-[11px] space-y-1.5">
                        <div className="text-[#666] text-[10px] uppercase tracking-widest font-bold mb-2">Статус</div>
                        <div className="flex justify-between"><span className="text-[#666]">Google:</span><span className="text-white">{keysStatus.googlePreview} {keysStatus.google ? '✓' : '✗'}</span></div>
                        <div className="flex justify-between"><span className="text-[#666]">OrcaRouter:</span><span className="text-white">{keysStatus.orcaPreview} {keysStatus.orca ? '✓' : '✗'}</span></div>
                        <div className="flex justify-between"><span className="text-[#666]">CF Token:</span><span className="text-white">{keysStatus.cfTokenPreview} {keysStatus.cfToken ? '✓' : '✗'}</span></div>
                        <div className="flex justify-between"><span className="text-[#666]">CF Account:</span><span className="text-white">{keysStatus.cfAccountPreview || 'авто'} {keysStatus.cfAccount ? '✓' : '…'}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'addons' && (
                  <div className="space-y-5">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Дополнения</h2>
                    <p className="text-[12px] text-[#666]">Другие проекты — скачивай напрямую (только exe, без apk на ПК)</p>
                    <div className="grid gap-3">
                      {otherRepos.length === 0 ? <div className="text-[13px] text-[#666] text-center py-8">Загрузка...</div> : otherRepos.map((repo: any) => {
                        const rel = repoReleases[repo.name]
                        const exeAssets = rel?.assets?.filter((a: any) => a.name.endsWith('.exe') && !a.name.toLowerCase().includes('apk')) || []
                        const otherAssets = rel?.assets?.filter((a: any) => !a.name.endsWith('.apk')) || []
                        const displayAssets = exeAssets.length > 0 ? exeAssets : otherAssets.slice(0,2)
                        if (displayAssets.length === 0 && rel?.assets?.some((a: any) => a.name.endsWith('.apk'))) return null
                        return (
                          <div key={repo.id} className="group bg-[#151515] border border-white/[0.06] rounded-[14px] p-4 hover:border-white/[0.10] hover:bg-[#1A1A1A] transition">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0"><div className="text-[13px] font-bold truncate group-hover:text-white transition" style={{ fontWeight: 700 }}>{repo.name}</div><div className="text-[11px] text-[#666] mt-1 line-clamp-2">{repo.description || 'Нет описания'} • {repo.language || 'code'}</div></div>
                              <div className="flex gap-1.5 shrink-0">
                                {rel && displayAssets.length > 0 ? displayAssets.slice(0,2).map((a: any) => (
                                  <motion.button key={a.id} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} onClick={() => window.open(a.browser_download_url, '_blank')} className="px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-bold hover:bg-white/90 transition shadow-[0_2px_8px_rgba(255,255,255,0.1)]">{a.name.split('.').pop()}</motion.button>
                                )) : <a href={repo.html_url} target="_blank" className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-semibold hover:bg-white/[0.10] transition">Открыть</a>}
                              </div>
                            </div>
                            {rel && <div className="mt-2 text-[10px] font-mono text-[#555]">Релиз {rel.tag_name} • {new Date(rel.published_at).toLocaleDateString('ru-RU')}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
