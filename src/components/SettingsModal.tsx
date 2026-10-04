import { motion, AnimatePresence } from 'framer-motion'
import { APP_VERSION, DEVELOPER } from '@/lib/version'
import { useEffect, useState } from 'react'
import { getSetting, saveSetting } from '@/lib/storage'

interface Props { open: boolean; onClose: () => void }

function GearIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z"/></svg>
}
function UserIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function ShieldIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
function InfoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}
function PuzzleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 7a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2z"/><path d="M7 7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"/><path d="M7 14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2z"/><path d="M14 14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2z"/></svg>
}

export default function SettingsModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'about' | 'addons' | 'account'>('general')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [updateStatus, setUpdateStatus] = useState('Нажми чтобы проверить')
  const [hasUpdate, setHasUpdate] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const [otherRepos, setOtherRepos] = useState<any[]>([])
  const [repoReleases, setRepoReleases] = useState<Record<string, any>>({})

  useEffect(() => {
    if (open) {
      getSetting('auto-update', true).then(v => setAutoUpdate(v as boolean))
      fetch('https://api.github.com/users/kayorissss/repos?per_page=30&sort=updated').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          const filtered = data.filter((r: any) => r.name !== 'AiKayori' && !r.fork).slice(0, 10)
          setOtherRepos(filtered)
          // Fetch latest release for each repo for direct download
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

  const downloadFile = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.target = '_blank'
    a.click()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[8px]">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="w-full max-w-[1100px] h-[90vh] md:h-[85vh] bg-[#121212] border border-white/[0.08] rounded-[16px] md:rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
            <div className="h-[56px] border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0 bg-[#151515]">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div className="text-[16px] font-bold" style={{ fontFamily: 'Gotham, sans-serif' }}>Настройки</div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08]">×</button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              <div className="w-full md:w-[200px] border-b md:border-b-0 md:border-r border-white/[0.06] p-2 md:p-3 flex md:flex-col gap-1 bg-[#0F0F0F] overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-thin">
                <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">
                {[
                  { id: 'general', label: 'Общие', icon: <GearIcon/> },
                  { id: 'account', label: 'Аккаунт', icon: <UserIcon/> },
                  { id: 'privacy', label: 'Приватность', icon: <ShieldIcon/> },
                  { id: 'about', label: 'О программе', icon: <InfoIcon/> },
                  { id: 'addons', label: 'Дополнения', icon: <PuzzleIcon/> },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap md:w-full text-left px-3 py-2 md:py-2.5 rounded-[10px] text-[12px] md:text-[13px] font-medium transition flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-black font-bold' : 'hover:bg-white/[0.06] text-[#888] hover:text-[#DDD]'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0A0A0A] flex justify-center">
                <div className="w-full max-w-[800px]">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold text-center" style={{ fontFamily: 'Gotham, sans-serif' }}>Общие</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-5">
                      <div className="flex items-center justify-between">
                        <div><div className="text-[14px] font-bold">Автообновление</div><div className="text-[12px] text-[#666] mt-1">Проверять при запуске</div></div>
                        <button onClick={() => { const nv = !autoUpdate; setAutoUpdate(nv); saveSetting('auto-update', nv) }} className={`w-12 h-7 rounded-full transition flex items-center px-1 ${autoUpdate ? 'bg-white' : 'bg-white/10'}`}>
                          <div className={`w-5 h-5 rounded-full transition-all ${autoUpdate ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`} />
                        </button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-3">
                        <button onClick={checkUpdates} className="px-4 py-2 rounded-full bg-[#1E1E1E] border border-white/[0.08] text-[12px] hover:bg-[#252525] flex items-center gap-2">Проверить обновления {hasUpdate && <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />}</button>
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
                      <div className="text-[14px] font-bold mb-3">Закрытие окна</div>
                      <div className="text-[12px] text-[#666]">При крестике выбор: закрыть или в трей. Можно запомнить.</div>
                      <button onClick={() => { localStorage.removeItem('close-behavior'); alert('Сброс') }} className="mt-3 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px]">Сбросить выбор</button>
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold text-center" style={{ fontFamily: 'Gotham, sans-serif' }}>Аккаунт</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-8 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[24px] mb-4"><UserIcon/></div>
                      <div className="text-[16px] font-bold">Гостевой режим</div>
                      <div className="text-[13px] text-[#666] mt-2 max-w-[400px] mx-auto">Чаты хранятся только у тебя локально. Вход через Яндекс ID опционально для синхронизации.</div>
                      <div className="flex gap-2 justify-center mt-6">
                        <button className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-[13px]">Войти через Яндекс ID</button>
                        <button className="px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[13px]">Как гость</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold text-center" style={{ fontFamily: 'Gotham, sans-serif' }}>Приватность</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <h3 className="text-[14px] font-bold mb-3">Что храним</h3>
                      <ul className="space-y-2 text-[13px] text-[#888] list-disc pl-5">
                        <li>Чаты — только локально в IndexedDB</li>
                        <li>Черновики — при переходе между чатами</li>
                        <li>Ключи — локально, шифруются</li>
                        <li>Телеметрии нет</li>
                      </ul>
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <h3 className="text-[14px] font-bold mb-3">Запрещено</h3>
                      <p className="text-[13px] text-[#888] leading-relaxed">Поиск личных данных, оружие, наркотики, взлом, детская порнография, экстремизм. При попытке — отказ.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold text-center" style={{ fontFamily: 'Gotham, sans-serif' }}>О программе</h2>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-[14px] overflow-hidden border border-white/[0.08] bg-[#0A0A0A]"><img src="./logo-kayori.png" alt="logo" className="w-full h-full object-cover" /></div>
                        <div><div className="text-[18px] font-bold" style={{ fontFamily: 'Unbounded, sans-serif' }}><span className="text-white">AI</span><span className="text-[#888]">Kayori</span></div><div className="text-[12px] font-mono text-[#666]">v{APP_VERSION}</div></div>
                      </div>
                      <p className="text-[13px] text-[#888] leading-relaxed">Приватный AI-ассистент. История чатов, файлы, генерация изображений. Цвета: чёрный, тёмно-серый, белый. Шрифт Gotham Medium.</p>
                    </div>
                    <div className="bg-[#151515] border border-white/[0.06] rounded-[16px] p-6">
                      <div className="text-[14px] font-bold mb-3">Разработчик</div>
                      <div className="space-y-2 text-[13px]">
                        <div className="flex justify-between"><span className="text-[#666]">Команда</span><span className="font-bold">{DEVELOPER.name}</span></div>
                        <div className="flex justify-between"><span className="text-[#666]">GitHub</span><a href={DEVELOPER.github} target="_blank" className="text-white hover:underline font-mono text-[12px]">{DEVELOPER.github.replace('https://','')}</a></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'addons' && (
                  <div className="space-y-6">
                    <h2 className="text-[20px] font-bold text-center" style={{ fontFamily: 'Gotham, sans-serif' }}>Дополнения</h2>
                    <p className="text-[13px] text-[#666] text-center">Другие твои проекты — скачивай последнюю версию сразу через программу</p>
                    <div className="grid gap-3">
                      {otherRepos.length === 0 ? <div className="text-[13px] text-[#666] text-center py-8">Загрузка...</div> : otherRepos.map((repo: any) => {
                        const rel = repoReleases[repo.name]
                        return (
                          <div key={repo.id} className="bg-[#151515] border border-white/[0.06] rounded-[14px] p-4">
                            <div className="flex items-center justify-between">
                              <div><div className="text-[14px] font-bold">{repo.name}</div><div className="text-[11px] text-[#666] mt-1">{repo.description || 'Нет описания'} • {repo.language || 'code'}</div></div>
                              <div className="flex gap-2">
                                {rel ? (
                                  <div className="flex gap-1.5">
                                    {rel.assets.slice(0,2).map((a: any) => (
                                      <button key={a.id} onClick={() => downloadFile(a.browser_download_url, a.name)} className="px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-bold hover:bg-white/90">Скачать {a.name.split('.').pop()}</button>
                                    ))}
                                  </div>
                                ) : (
                                  <a href={repo.html_url} target="_blank" className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px]">Открыть</a>
                                )}
                              </div>
                            </div>
                            {rel && <div className="mt-2 text-[10px] font-mono text-[#555]">Последний релиз {rel.tag_name} • {new Date(rel.published_at).toLocaleDateString('ru-RU')}</div>}
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
