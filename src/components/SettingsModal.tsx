import { motion, AnimatePresence } from 'framer-motion'
import { APP_VERSION, DEVELOPER } from '@/lib/version'
import { useEffect, useState } from 'react'
import { getSetting, saveSetting } from '@/lib/storage'

interface Props { open: boolean; onClose: () => void; theme?: string; onToggleTheme?: () => void }

function GearIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z"/></svg> }
function UserIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function ShieldIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function InfoIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> }
function PuzzleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2.08C10.5 3.5 9.5 3 7.75 3A5.5 5.5 0 0 0 2.25 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> }

export default function SettingsModal({ open, onClose, theme, onToggleTheme }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'about' | 'addons' | 'account'>('general')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [updateStatus, setUpdateStatus] = useState('Нажми чтобы проверить')
  const [hasUpdate, setHasUpdate] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const [otherRepos, setOtherRepos] = useState<any[]>([])
  const [repoReleases, setRepoReleases] = useState<Record<string, any>>({})
  const isMobileDevice = /Android|iPhone|iPad/i.test(navigator.userAgent)

  useEffect(() => {
    if (open) {
      getSetting('auto-update', true).then(v => setAutoUpdate(v as boolean))
      fetch('https://api.github.com/users/kayorissss/repos?per_page=30&sort=updated').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter((r: any) => r.name.toLowerCase() !== 'aikayori' && !r.fork).slice(0, 12)
          setOtherRepos(filtered)
          filtered.forEach((repo: any) => {
            fetch(`https://api.github.com/repos/kayorissss/${repo.name}/releases/latest`).then(r => r.json()).then(rel => {
              if (rel && rel.assets && rel.assets.length > 0) {
                setRepoReleases(prev => ({ ...prev, [repo.name]: rel }))
              }
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
      if (latest === APP_VERSION) { setUpdateStatus(`У тебя последняя версия v${APP_VERSION}`); setHasUpdate(false) }
      else { setUpdateStatus(`Доступна v${latest}, у тебя v${APP_VERSION}`); setHasUpdate(true) }
    } catch { setUpdateStatus('Не удалось проверить') }
  }

  const downloadFile = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-[12px]" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="w-full max-w-[1100px] h-[92vh] md:h-[84vh] bg-[#121212] border border-white/[0.08] rounded-[20px] md:rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-[56px] border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0 bg-[#151515]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.06] border border-white/[0.06] flex items-center justify-center"><GearIcon/></div>
                <div className="text-[15px] font-bold" style={{ fontWeight: 700 }}>Настройки</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-[#666]">V5.0.0</span>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.10]">×</button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              <div className="w-full md:w-[200px] border-b md:border-b-0 md:border-r border-white/[0.06] p-2 md:p-3 flex md:flex-col gap-1 bg-[#0F0F0F] overflow-x-auto md:overflow-y-auto shrink-0">
                <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">
                {[
                  { id: 'general', label: 'Общие', icon: <GearIcon/> },
                  { id: 'account', label: 'Аккаунт', icon: <UserIcon/> },
                  { id: 'privacy', label: 'Приватность', icon: <ShieldIcon/> },
                  { id: 'about', label: 'О программе', icon: <InfoIcon/> },
                  { id: 'addons', label: 'Дополнения', icon: <PuzzleIcon/> },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap md:w-full text-left px-3 py-2.5 rounded-[12px] text-[13px] transition flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-black' : 'hover:bg-white/[0.06] text-[#888] hover:text-[#DDD]'}`} style={{ fontWeight: activeTab === tab.id ? 700 : 600 }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#0A0A0A] flex justify-center">
                <div className="w-full max-w-[720px]">
                {activeTab === 'general' && (
                  <div className="space-y-5">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Общие</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-5">
                      <div className="flex items-center justify-between">
                        <div><div className="text-[14px] font-bold" style={{ fontWeight: 700 }}>Автообновление</div><div className="text-[12px] text-[#666] mt-1">Проверять при запуске</div></div>
                        <button onClick={() => { const nv = !autoUpdate; setAutoUpdate(nv); saveSetting('auto-update', nv) }} className={`w-12 h-7 rounded-full transition flex items-center px-1 ${autoUpdate ? 'bg-white' : 'bg-white/10'}`}>
                          <div className={`w-5 h-5 rounded-full transition-all ${autoUpdate ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`} />
                        </button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-3">
                        <button onClick={checkUpdates} className="px-4 py-2 rounded-full bg-[#1E1E1E] border border-white/[0.08] text-[12px] hover:bg-[#252525] flex items-center gap-2 font-semibold">Проверить {hasUpdate && <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />}</button>
                        <span className="text-[11px] font-mono text-[#666]">{updateStatus}</span>
                      </div>
                      {hasUpdate && (
                        <div className="mt-4 p-3 rounded-[12px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-between">
                          <div className="text-[12px] font-bold text-[#FF6B6B]">Доступна v{latestVersion}</div>
                          <a href={`https://github.com/kayorissss/AiKayori/releases/tag/v${latestVersion}`} target="_blank" className="px-3 py-1.5 rounded-full bg-[#FF3B30] text-white text-[11px] font-bold">Скачать</a>
                        </div>
                      )}
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-5">
                      <div className="text-[14px] font-bold mb-2" style={{ fontWeight: 700 }}>Тема</div>
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] text-[#666]">Светлая / тёмная</div>
                        <button onClick={() => onToggleTheme && onToggleTheme()} className={`w-12 h-7 rounded-full transition flex items-center px-1 ${theme === 'light' ? 'bg-white' : 'bg-white/10'}`}>
                          <div className={`w-5 h-5 rounded-full transition-all ${theme === 'light' ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-5">
                      <div className="text-[14px] font-bold mb-2" style={{ fontWeight: 700 }}>Закрытие окна</div>
                      <div className="text-[12px] text-[#666]">При крестике выбор: закрыть или в трей. Можно запомнить.</div>
                      <button onClick={() => { localStorage.removeItem('close-behavior'); alert('Сброшено') }} className="mt-3 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-semibold">Сбросить выбор</button>
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Аккаунт</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-8 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-4"><UserIcon/></div>
                      <div className="text-[16px] font-bold" style={{ fontWeight: 700 }}>Гостевой режим</div>
                      <div className="text-[13px] text-[#666] mt-2 max-w-[400px] mx-auto">Чаты хранятся локально. Яндекс ID опционально.</div>
                      <div className="flex gap-2 justify-center mt-6">
                        <button className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-[13px]">Войти через Яндекс ID</button>
                        <button className="px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[13px]">Как гость</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Конфиденциальность</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <h3 className="text-[14px] font-bold mb-3" style={{ fontWeight: 700 }}>Политика конфиденциальности AI-KAYORI v5.0</h3>
                      <div className="space-y-3 text-[12px] text-[#999] leading-[1.6]">
                        <p><b className="text-white">1. Хранение.</b> Все чаты, файлы, изображения хранятся исключительно локально в IndexedDB вашего браузера/приложения. Мы не передаём их на серверы.</p>
                        <p><b className="text-white">2. Ключи.</b> API-ключи Cloudflare и Google хранятся локально, шифруются. Используются только для прямых запросов к провайдерам моделей.</p>
                        <p><b className="text-white">3. Телеметрия.</b> Отсутствует. Никакой аналитики, рекламы, трекеров.</p>
                        <p><b className="text-white">4. Запрещённый контент.</b> Запрещены: детская порнография. Остальное — на усмотрение модели. Поиск личных данных третьих лиц блокируется по запросу пользователя, но не цензурируется агрессивно.</p>
                        <p><b className="text-white">5. Права.</b> Вы владеете своими данными. Можете удалить всё в один клик (очистить чаты в настройках).</p>
                        <p><b className="text-white">6. Обновления.</b> Проверка версий идёт через GitHub API, без передачи личных данных.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>О программе</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-[14px] overflow-hidden border border-white/[0.08] bg-[#0A0A0A]"><img src="./logo-kayori.png" alt="logo" className="w-full h-full object-cover" /></div>
                        <div><div className="text-[18px] font-bold" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700 }}><span className="text-white">AI</span><span className="text-[#888]">KAYORI</span></div><div className="text-[12px] font-mono text-[#666]">V{APP_VERSION} • BLACK EDITION</div></div>
                      </div>
                      <p className="text-[13px] text-[#888] leading-[1.6]">AI-KAYORI — приватный AI-ассистент с памятью чатов, анализом файлов и фото, генерацией кода и изображений. Работает на Cloudflare Workers AI и Google Gemini. Локальное хранение, быстрый интерфейс, поддержка тем.</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                        <div className="bg-[#0A0A0A] border border-white/[0.04] rounded-[10px] p-3"><div className="text-[#555]">Модели</div><div className="text-white font-bold mt-1">Gemini, Llama 3.1, Mistral, Qwen</div></div>
                        <div className="bg-[#0A0A0A] border border-white/[0.04] rounded-[10px] p-3"><div className="text-[#555]">Память</div><div className="text-white font-bold mt-1">16 сообщений контекста</div></div>
                      </div>
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <div className="text-[14px] font-bold mb-3" style={{ fontWeight: 700 }}>Разработчик</div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">K</div>
                        <div><div className="font-bold">{DEVELOPER.name}</div><div className="text-[11px] text-[#666] font-mono">{DEVELOPER.github}</div></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'addons' && (
                  <div className="space-y-5">
                    <h2 className="text-[20px] font-bold" style={{ fontWeight: 700 }}>Дополнения</h2>
                    <p className="text-[12px] text-[#666]">Другие проекты разработчика — скачивай напрямую</p>
                    <div className="grid gap-3">
                      {otherRepos.length === 0 ? <div className="text-[13px] text-[#666] text-center py-8">Загрузка...</div> : otherRepos.filter(r => !isMobileDevice || !r.name.toLowerCase().includes('apk')).map((repo: any) => {
                        const rel = repoReleases[repo.name]
                        return (
                          <div key={repo.id} className="bg-[#151515] border border-white/[0.06] rounded-[14px] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0"><div className="text-[13px] font-bold truncate" style={{ fontWeight: 700 }}>{repo.name}</div><div className="text-[11px] text-[#666] mt-1 line-clamp-2">{repo.description || 'Нет описания'} • {repo.language || 'code'}</div></div>
                              <div className="flex gap-1.5 shrink-0">
                                {rel ? rel.assets.slice(0,2).map((a: any) => (
                                  <button key={a.id} onClick={() => downloadFile(a.browser_download_url)} className="px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-bold hover:bg-white/90">{a.name.split('.').pop()}</button>
                                )) : <a href={repo.html_url} target="_blank" className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-semibold">Открыть</a>}
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
