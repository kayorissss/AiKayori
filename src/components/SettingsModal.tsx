import { motion, AnimatePresence } from 'framer-motion'
import { APP_VERSION, DEVELOPER } from '@/lib/version'
import { useEffect, useState } from 'react'
import { getSetting, saveSetting } from '@/lib/storage'
import { getKeys, saveKeys, testGoogleKey, testOpenAIKey, testCloudflareKey } from '@/lib/ai'

interface Props {
  open: boolean
  onClose: () => void
  theme?: string
  onToggleTheme?: () => void
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 15a1.65 1.65 0 0 0-1-1.51V13a2 2 0 0 1 0-4v-.49c.3-.27.65-.48 1-.63a1.65 1.65 0 0 0 1-1.51V6a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 11a1.65 1.65 0 0 0 1 1.51V13a2 2 0 0 1 0 4v.49c-.3.27-.65.48-1 .63-.3.18-.52.48-.63.84z" />
    </svg>
  )
}
function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21 2-2 2m-1.5 1.5L14 9M10 13l-4 4-2-2-4 4 4 4 4-4-2-2 4-4m1.5-1.5L17 5" />
      <circle cx="15.5" cy="8.5" r="5.5" />
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
function PuzzleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2.08C10.5 3.5 9.5 3 7.75 3A5.5 5.5 0 0 0 2.25 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

export default function SettingsModal({ open, onClose, theme = 'dark', onToggleTheme }: Props) {
  const [activeTab, setActiveTab] = useState<'api' | 'general' | 'account' | 'privacy' | 'about' | 'addons'>('api')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [updateStatus, setUpdateStatus] = useState('Нажми чтобы проверить')
  const [hasUpdate, setHasUpdate] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const [otherRepos, setOtherRepos] = useState<any[]>([])
  const [repoReleases, setRepoReleases] = useState<Record<string, any>>({})
  const isMobileDevice = /Android|iPhone|iPad/i.test(navigator.userAgent)

  // API Keys state
  const [googleKey, setGoogleKey] = useState('')
  const [cfAccount, setCfAccount] = useState('')
  const [cfToken, setCfToken] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [openaiUrl, setOpenaiUrl] = useState('https://api.openai.com/v1')
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini')

  const [googleTestStatus, setGoogleTestStatus] = useState<{ loading: boolean; msg: string; ok?: boolean } | null>(null)
  const [cfTestStatus, setCfTestStatus] = useState<{ loading: boolean; msg: string; ok?: boolean } | null>(null)
  const [openaiTestStatus, setOpenaiTestStatus] = useState<{ loading: boolean; msg: string; ok?: boolean } | null>(null)
  const [saveBanner, setSaveBanner] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      getSetting('auto-update', true).then(v => setAutoUpdate(v as boolean))
      getKeys().then(keys => {
        setGoogleKey(keys.google)
        setCfAccount(keys.cfAccount)
        setCfToken(keys.cfToken)
        setOpenaiKey(keys.openaiKey)
        setOpenaiUrl(keys.openaiUrl || 'https://api.openai.com/v1')
        setOpenaiModel(keys.openaiModel || 'gpt-4o-mini')
      })
      fetch('https://api.github.com/users/kayorissss/repos?per_page=30&sort=updated')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const filtered = data.filter((r: any) => r.name.toLowerCase() !== 'aikayori' && !r.fork).slice(0, 12)
            setOtherRepos(filtered)
            filtered.forEach((repo: any) => {
              fetch(`https://api.github.com/repos/kayorissss/${repo.name}/releases/latest`)
                .then(r => r.json())
                .then(rel => {
                  if (rel && rel.assets && rel.assets.length > 0) {
                    setRepoReleases(prev => ({ ...prev, [repo.name]: rel }))
                  }
                })
                .catch(() => {})
            })
          }
        })
        .catch(() => {})
    }
  }, [open])

  const handleSaveApiKeys = async () => {
    await saveKeys({
      google: googleKey,
      cfAccount,
      cfToken,
      openaiKey,
      openaiUrl,
      openaiModel
    })
    setSaveBanner('Ключи сохранены!')
    setTimeout(() => setSaveBanner(null), 3000)
  }

  const handleTestGoogle = async () => {
    setGoogleTestStatus({ loading: true, msg: 'Проверка ключа...' })
    await handleSaveApiKeys()
    const res = await testGoogleKey(googleKey)
    setGoogleTestStatus({ loading: false, msg: res.message, ok: res.ok })
  }

  const handleTestOpenAI = async () => {
    setOpenaiTestStatus({ loading: true, msg: 'Проверка...' })
    await handleSaveApiKeys()
    const res = await testOpenAIKey(openaiKey, openaiUrl, openaiModel)
    setOpenaiTestStatus({ loading: false, msg: res.message, ok: res.ok })
  }

  const handleTestCloudflare = async () => {
    setCfTestStatus({ loading: true, msg: 'Проверка...' })
    await handleSaveApiKeys()
    const res = await testCloudflareKey(cfAccount, cfToken)
    setCfTestStatus({ loading: false, msg: res.message, ok: res.ok })
  }

  const applyPreset = (preset: 'openai' | 'groq' | 'openrouter' | 'deepseek') => {
    if (preset === 'openai') {
      setOpenaiUrl('https://api.openai.com/v1')
      setOpenaiModel('gpt-4o-mini')
    } else if (preset === 'groq') {
      setOpenaiUrl('https://api.groq.com/openai/v1')
      setOpenaiModel('llama-3.3-70b-versatile')
    } else if (preset === 'openrouter') {
      setOpenaiUrl('https://openrouter.ai/api/v1')
      setOpenaiModel('meta-llama/llama-3.1-8b-instruct:free')
    } else if (preset === 'deepseek') {
      setOpenaiUrl('https://api.deepseek.com/v1')
      setOpenaiModel('deepseek-chat')
    }
  }

  const checkUpdates = async () => {
    setUpdateStatus('Проверка...')
    try {
      const res = await fetch('https://api.github.com/repos/kayorissss/AiKayori/releases/latest')
      const data = await res.json()
      const latest = data.tag_name?.replace('v', '') || APP_VERSION
      setLatestVersion(latest)
      if (latest === APP_VERSION) {
        setUpdateStatus(`У тебя последняя версия v${APP_VERSION}`)
        setHasUpdate(false)
      } else {
        setUpdateStatus(`Доступна v${latest}, у тебя v${APP_VERSION}`)
        setHasUpdate(true)
      }
    } catch {
      setUpdateStatus('Не удалось проверить')
    }
  }

  const isLight = theme === 'light'

  // Dynamic styling tokens based on theme
  const modalBg = isLight ? 'bg-[#FFFFFF]' : 'bg-[#121212]'
  const modalBorder = isLight ? 'border-black/10' : 'border-white/[0.08]'
  const headerBg = isLight ? 'bg-[#F9FAFB]' : 'bg-[#151515]'
  const sidebarBg = isLight ? 'bg-[#F3F4F6]' : 'bg-[#0F0F0F]'
  const contentBg = isLight ? 'bg-[#FAFAFA]' : 'bg-[#0A0A0A]'
  const cardBg = isLight ? 'bg-[#FFFFFF]' : 'bg-[#151515]'
  const cardBorder = isLight ? 'border-black/10' : 'border-white/[0.06]'
  const textColor = isLight ? 'text-[#111827]' : 'text-white'
  const subtextColor = isLight ? 'text-[#6B7280]' : 'text-[#888888]'
  const inputBg = isLight ? 'bg-[#FFFFFF]' : 'bg-[#0A0A0A]'
  const inputBorder = isLight ? 'border-black/15' : 'border-white/[0.1]'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-[12px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`w-full max-w-[1050px] h-[92vh] md:h-[86vh] ${modalBg} border ${modalBorder} rounded-[22px] md:rounded-[26px] shadow-[0_24px_64px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ${textColor}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`h-[56px] border-b ${cardBorder} flex items-center justify-between px-6 shrink-0 ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-[10px] ${isLight ? 'bg-black/5 border border-black/5' : 'bg-white/[0.06] border border-white/[0.06]'} flex items-center justify-center`}>
                  <GearIcon />
                </div>
                <div className="text-[15px] font-bold">Настройки</div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isLight ? 'bg-black/5 text-[#555]' : 'bg-white/[0.06] text-[#888]'}`}>
                  V{APP_VERSION}
                </span>
                {saveBanner && (
                  <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    {saveBanner}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-full ${isLight ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/[0.06] hover:bg-white/[0.12] text-white'} flex items-center justify-center transition`}
              >
                ✕
              </button>
            </div>

            {/* Content area with tabs */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Sidebar Tabs */}
              <div className={`w-full md:w-[210px] border-b md:border-b-0 md:border-r ${cardBorder} p-2 md:p-3 flex md:flex-col gap-1 ${sidebarBg} overflow-x-auto md:overflow-y-auto shrink-0`}>
                <div className="flex md:flex-col gap-1 min-w-max md:min-w-0 w-full">
                  {[
                    { id: 'api', label: 'API Ключи (ИИ)', icon: <KeyIcon /> },
                    { id: 'general', label: 'Общие и Тема', icon: <GearIcon /> },
                    { id: 'account', label: 'Аккаунт', icon: <UserIcon /> },
                    { id: 'privacy', label: 'Конфиденциальность', icon: <ShieldIcon /> },
                    { id: 'about', label: 'О программе', icon: <InfoIcon /> },
                    { id: 'addons', label: 'Дополнения', icon: <PuzzleIcon /> },
                  ].map(tab => {
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`whitespace-nowrap md:w-full text-left px-3.5 py-2.5 rounded-[12px] text-[13px] transition flex items-center gap-2.5 font-semibold ${
                          isActive
                            ? isLight
                              ? 'bg-black text-white shadow-sm'
                              : 'bg-white text-black shadow-sm'
                            : isLight
                            ? 'hover:bg-black/5 text-[#4B5563]'
                            : 'hover:bg-white/[0.06] text-[#888] hover:text-[#DDD]'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tab Panel */}
              <div className={`flex-1 overflow-y-auto p-5 md:p-8 ${contentBg} flex justify-center`}>
                <div className="w-full max-w-[740px] space-y-6">

                  {/* API KEYS TAB */}
                  {activeTab === 'api' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-[20px] font-bold">Подключение ИИ и API ключи</h2>
                        <p className={`text-[13px] ${subtextColor} mt-1`}>
                          Чтобы бот отвечал настоящим интеллектом (а не шаблонами), укажите свой ключ ниже. Все ключи сохраняются локально на вашем компьютере.
                        </p>
                      </div>

                      {/* Google Gemini Card */}
                      <div className={`${cardBg} border ${cardBorder} rounded-[18px] p-5 shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4] font-bold text-[14px]">
                              G
                            </div>
                            <div>
                              <div className="text-[14px] font-bold">Google Gemini (Рекомендуется)</div>
                              <div className={`text-[11px] ${subtextColor}`}>Модели Gemini 1.5 Flash и Pro. Анализирует фото, код, файлы.</div>
                            </div>
                          </div>
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-[#4285F4] hover:underline flex items-center gap-1"
                          >
                            Получить ключ бесплатно ↗
                          </a>
                        </div>

                        <div className="space-y-3 mt-4">
                          <div>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${subtextColor}`}>
                              Google AI Studio API Key (AIzaSy...)
                            </label>
                            <input
                              type="password"
                              value={googleKey}
                              onChange={e => setGoogleKey(e.target.value)}
                              placeholder="Вставьте ваш ключ: AIzaSy..."
                              className={`w-full ${inputBg} border ${inputBorder} rounded-[12px] px-3.5 py-2.5 text-[13px] font-mono focus:border-[#4285F4] transition`}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleTestGoogle}
                                disabled={googleTestStatus?.loading || !googleKey.trim()}
                                className={`px-4 py-2 rounded-full text-[12px] font-bold transition flex items-center gap-1.5 ${
                                  isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {googleTestStatus?.loading ? 'Проверка...' : 'Проверить ключ'}
                              </button>
                              <button
                                onClick={handleSaveApiKeys}
                                className={`px-4 py-2 rounded-full text-[12px] font-semibold border ${cardBorder} ${
                                  isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                                }`}
                              >
                                Сохранить
                              </button>
                            </div>

                            {googleTestStatus && (
                              <div className={`text-[12px] font-medium flex items-center gap-1.5 ${
                                googleTestStatus.ok ? 'text-emerald-500' : 'text-rose-500'
                              }`}>
                                <span>{googleTestStatus.ok ? '✓' : '✗'}</span>
                                <span className="max-w-[280px] truncate">{googleTestStatus.msg}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* OpenAI / Groq / OpenRouter Card */}
                      <div className={`${cardBg} border ${cardBorder} rounded-[18px] p-5 shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#10A37F]/15 border border-[#10A37F]/30 flex items-center justify-center text-[#10A37F] font-bold text-[14px]">
                              AI
                            </div>
                            <div>
                              <div className="text-[14px] font-bold">OpenAI / Groq / OpenRouter / DeepSeek</div>
                              <div className={`text-[11px] ${subtextColor}`}>Если у вас ключ от любого бота, Groq (бесплатно), OpenAI или OpenRouter</div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap my-3">
                          <span className={`text-[11px] font-medium ${subtextColor} mr-1`}>Быстрые шаблоны:</span>
                          <button
                            onClick={() => applyPreset('groq')}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cardBorder} ${
                              openaiUrl.includes('groq') ? 'bg-[#F55036] text-white border-transparent' : isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            Groq (Быстрый & Бесплатный)
                          </button>
                          <button
                            onClick={() => applyPreset('openai')}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cardBorder} ${
                              openaiUrl.includes('openai.com') ? 'bg-[#10A37F] text-white border-transparent' : isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            OpenAI
                          </button>
                          <button
                            onClick={() => applyPreset('openrouter')}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cardBorder} ${
                              openaiUrl.includes('openrouter') ? 'bg-[#6366F1] text-white border-transparent' : isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            OpenRouter
                          </button>
                          <button
                            onClick={() => applyPreset('deepseek')}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cardBorder} ${
                              openaiUrl.includes('deepseek') ? 'bg-[#0EA5E9] text-white border-transparent' : isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            DeepSeek
                          </button>
                        </div>

                        <div className="space-y-3 mt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${subtextColor}`}>
                                API URL (Базовый адрес)
                              </label>
                              <input
                                type="text"
                                value={openaiUrl}
                                onChange={e => setOpenaiUrl(e.target.value)}
                                placeholder="https://api.groq.com/openai/v1"
                                className={`w-full ${inputBg} border ${inputBorder} rounded-[12px] px-3.5 py-2.5 text-[12px] font-mono focus:border-[#10A37F] transition`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${subtextColor}`}>
                                Модель
                              </label>
                              <input
                                type="text"
                                value={openaiModel}
                                onChange={e => setOpenaiModel(e.target.value)}
                                placeholder="llama-3.3-70b-versatile или gpt-4o-mini"
                                className={`w-full ${inputBg} border ${inputBorder} rounded-[12px] px-3.5 py-2.5 text-[12px] font-mono focus:border-[#10A37F] transition`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${subtextColor}`}>
                              API Ключ (gsk_..., sk-...)
                            </label>
                            <input
                              type="password"
                              value={openaiKey}
                              onChange={e => setOpenaiKey(e.target.value)}
                              placeholder="Вставьте ваш ключ"
                              className={`w-full ${inputBg} border ${inputBorder} rounded-[12px] px-3.5 py-2.5 text-[13px] font-mono focus:border-[#10A37F] transition`}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleTestOpenAI}
                                disabled={openaiTestStatus?.loading || !openaiKey.trim()}
                                className={`px-4 py-2 rounded-full text-[12px] font-bold transition flex items-center gap-1.5 ${
                                  isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {openaiTestStatus?.loading ? 'Проверка...' : 'Проверить'}
                              </button>
                              <button
                                onClick={handleSaveApiKeys}
                                className={`px-4 py-2 rounded-full text-[12px] font-semibold border ${cardBorder} ${
                                  isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                                }`}
                              >
                                Сохранить
                              </button>
                            </div>

                            {openaiTestStatus && (
                              <div className={`text-[12px] font-medium flex items-center gap-1.5 ${
                                openaiTestStatus.ok ? 'text-emerald-500' : 'text-rose-500'
                              }`}>
                                <span>{openaiTestStatus.ok ? '✓' : '✗'}</span>
                                <span className="max-w-[280px] truncate">{openaiTestStatus.msg}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cloudflare Workers AI Card */}
                      <div className={`${cardBg} border ${cardBorder} rounded-[18px] p-5 shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#F38020]/15 border border-[#F38020]/30 flex items-center justify-center text-[#F38020] font-bold text-[14px]">
                              CF
                            </div>
                            <div>
                              <div className="text-[14px] font-bold">Cloudflare Workers AI</div>
                              <div className={`text-[11px] ${subtextColor}`}>Для Llama 3.1, Mistral, Qwen и генерации картинок SDXL</div>
                            </div>
                          </div>
                          <a
                            href="https://dash.cloudflare.com/profile/api-tokens"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-[#F38020] hover:underline"
                          >
                            Создать токен ↗
                          </a>
                        </div>

                        {/* Guide banner for Cloudflare */}
                        <div className={`rounded-[12px] p-3 text-[11.5px] leading-[1.6] mb-3 border ${
                          isLight ? 'bg-amber-500/5 border-amber-500/20 text-[#78350F]' : 'bg-amber-500/10 border-amber-500/20 text-[#FDE68A]'
                        }`}>
                          <div className="font-bold mb-1">📖 Где взять Account ID и API Token:</div>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>
                              <b>Account ID:</b> Войдите на <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="underline font-bold">dash.cloudflare.com</a>. Ваш 32-значный ID указан прямо в адресной строке браузера (<code>dash.cloudflare.com/<b>ВАШ_ID</b>/...</code>), либо на главной странице в правом сайдбаре в блоке «API».
                            </li>
                            <li>
                              <b>API Token:</b> Откройте <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noreferrer" className="underline font-bold">API Tokens</a> → нажмите <b>Create Token</b> → выберите готовый шаблон <b>Workers AI (Read and Write)</b> → нажмите <b>Create</b> и скопируйте токен.
                            </li>
                          </ul>
                          <div className="mt-2 text-[10.5px] opacity-90">
                            💡 <b>Лайфхак:</b> Если у вас есть ключ от Telegram-бота (Groq, OpenAI, OpenRouter), вы можете вставить его в блок <b>OpenAI / Groq</b> выше — тогда настраивать Cloudflare не нужно!
                          </div>
                        </div>

                        <div className="space-y-3 mt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${subtextColor}`}>
                                Account ID
                              </label>
                              <input
                                type="text"
                                value={cfAccount}
                                onChange={e => setCfAccount(e.target.value)}
                                placeholder="Ваш Account ID из панели CF"
                                className={`w-full ${inputBg} border ${inputBorder} rounded-[12px] px-3.5 py-2.5 text-[12px] font-mono focus:border-[#F38020] transition`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${subtextColor}`}>
                                API Token
                              </label>
                              <input
                                type="password"
                                value={cfToken}
                                onChange={e => setCfToken(e.target.value)}
                                placeholder="Ваш Workers AI токен"
                                className={`w-full ${inputBg} border ${inputBorder} rounded-[12px] px-3.5 py-2.5 text-[12px] font-mono focus:border-[#F38020] transition`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleTestCloudflare}
                                disabled={cfTestStatus?.loading || !cfAccount.trim() || !cfToken.trim()}
                                className={`px-4 py-2 rounded-full text-[12px] font-bold transition flex items-center gap-1.5 ${
                                  isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {cfTestStatus?.loading ? 'Проверка...' : 'Проверить'}
                              </button>
                              <button
                                onClick={handleSaveApiKeys}
                                className={`px-4 py-2 rounded-full text-[12px] font-semibold border ${cardBorder} ${
                                  isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                                }`}
                              >
                                Сохранить
                              </button>
                            </div>

                            {cfTestStatus && (
                              <div className={`text-[12px] font-medium flex items-center gap-1.5 ${
                                cfTestStatus.ok ? 'text-emerald-500' : 'text-rose-500'
                              }`}>
                                <span>{cfTestStatus.ok ? '✓' : '✗'}</span>
                                <span className="max-w-[280px] truncate">{cfTestStatus.msg}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* GENERAL TAB */}
                  {activeTab === 'general' && (
                    <div className="space-y-5">
                      <h2 className="text-[20px] font-bold">Общие настройки</h2>

                      {/* Theme Setting */}
                      <div className={`${cardBg} border ${cardBorder} rounded-[16px] p-5 shadow-sm`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[14px] font-bold">Оформление темы</div>
                            <div className={`text-[12px] ${subtextColor} mt-1`}>
                              Текущая тема: <b className={textColor}>{isLight ? 'Светлая' : 'Тёмная (Black Edition)'}</b>
                            </div>
                          </div>
                          <button
                            onClick={() => onToggleTheme && onToggleTheme()}
                            className={`px-4 py-2 rounded-full font-bold text-[12px] border transition flex items-center gap-2 ${
                              isLight
                                ? 'bg-[#18181B] text-white border-transparent hover:bg-black'
                                : 'bg-white text-black border-transparent hover:bg-white/90'
                            }`}
                          >
                            <span>{isLight ? '☀️ Светлая' : '🌙 Тёмная'}</span>
                            <span className="text-[10px] opacity-75">сменить</span>
                          </button>
                        </div>
                      </div>

                      {/* Auto Update Setting */}
                      <div className={`${cardBg} border ${cardBorder} rounded-[16px] p-5 shadow-sm`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[14px] font-bold">Автообновление</div>
                            <div className={`text-[12px] ${subtextColor} mt-1`}>Проверять новые версии при запуске</div>
                          </div>
                          <button
                            onClick={() => {
                              const nv = !autoUpdate
                              setAutoUpdate(nv)
                              saveSetting('auto-update', nv)
                            }}
                            className={`w-12 h-7 rounded-full transition flex items-center px-1 ${
                              autoUpdate ? (isLight ? 'bg-black' : 'bg-white') : (isLight ? 'bg-black/15' : 'bg-white/15')
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full transition-all ${
                                autoUpdate
                                  ? isLight
                                    ? 'bg-white translate-x-5'
                                    : 'bg-black translate-x-5'
                                  : isLight
                                  ? 'bg-white translate-x-0'
                                  : 'bg-white translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        <div className={`mt-4 pt-4 border-t ${cardBorder} flex flex-wrap items-center gap-3`}>
                          <button
                            onClick={checkUpdates}
                            className={`px-4 py-2 rounded-full border ${cardBorder} text-[12px] font-semibold flex items-center gap-2 ${
                              isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                            }`}
                          >
                            Проверить обновления
                            {hasUpdate && <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />}
                          </button>
                          <span className={`text-[11px] font-mono ${subtextColor}`}>{updateStatus}</span>
                        </div>
                        {hasUpdate && (
                          <div className="mt-4 p-3 rounded-[12px] bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-between">
                            <div className="text-[12px] font-bold text-[#FF6B6B]">Доступна версия v{latestVersion}</div>
                            <a
                              href={`https://github.com/kayorissss/AiKayori/releases/tag/v${latestVersion}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-full bg-[#FF3B30] text-white text-[11px] font-bold"
                            >
                              Скачать
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Close Behavior */}
                      <div className={`${cardBg} border ${cardBorder} rounded-[16px] p-5 shadow-sm`}>
                        <div className="text-[14px] font-bold mb-1">Поведение при закрытии</div>
                        <div className={`text-[12px] ${subtextColor}`}>Сбросить выбор сворачивания в трей или выхода.</div>
                        <button
                          onClick={() => {
                            localStorage.removeItem('close-behavior')
                            alert('Выбор сброшен')
                          }}
                          className={`mt-3 px-3 py-1.5 rounded-full border ${cardBorder} text-[11px] font-semibold ${
                            isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                          }`}
                        >
                          Сбросить сохранённый выбор
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ACCOUNT TAB */}
                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      <h2 className="text-[20px] font-bold">Аккаунт</h2>
                      <div className={`${cardBg} border ${cardBorder} rounded-[18px] p-8 text-center shadow-sm`}>
                        <div className={`w-16 h-16 mx-auto rounded-full ${isLight ? 'bg-black/5 border border-black/10' : 'bg-white/[0.06] border border-white/[0.08]'} flex items-center justify-center mb-4`}>
                          <UserIcon />
                        </div>
                        <div className="text-[16px] font-bold">Локальный приватный режим</div>
                        <div className={`text-[13px] ${subtextColor} mt-2 max-w-[420px] mx-auto`}>
                          Все чаты и прикреплённые файлы хранятся только локально в IndexedDB на вашем устройстве.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRIVACY TAB */}
                  {activeTab === 'privacy' && (
                    <div className="space-y-6">
                      <h2 className="text-[20px] font-bold">Конфиденциальность</h2>
                      <div className={`${cardBg} border ${cardBorder} rounded-[18px] p-6 shadow-sm`}>
                        <h3 className="text-[14px] font-bold mb-3">Политика безопасности AI-KAYORI</h3>
                        <div className={`space-y-3 text-[12px] leading-[1.65] ${subtextColor}`}>
                          <p>
                            <b className={textColor}>1. Хранение.</b> Чаты, файлы, изображения и ключи хранятся исключительно локально в браузере / Electron.
                          </p>
                          <p>
                            <b className={textColor}>2. Прямые запросы.</b> Все запросы идут напрямую с вашего устройства на серверы Google AI Studio, Cloudflare или выбранного провайдера.
                          </p>
                          <p>
                            <b className={textColor}>3. Приватность.</b> Нет никакой внешней аналитики или логирования пользовательских сообщений.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABOUT TAB */}
                  {activeTab === 'about' && (
                    <div className="space-y-6">
                      <h2 className="text-[20px] font-bold">О программе</h2>
                      <div className={`${cardBg} border ${cardBorder} rounded-[18px] p-6 shadow-sm`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-[14px] overflow-hidden border ${cardBorder} ${inputBg} flex items-center justify-center`}>
                            <img src="./logo-kayori.png" alt="logo" className="w-10 h-10 object-contain" />
                          </div>
                          <div>
                            <div className="text-[18px] font-bold">
                              AI<span className={subtextColor}>KAYORI</span>
                            </div>
                            <div className={`text-[12px] font-mono ${subtextColor}`}>
                              V{APP_VERSION} • {isLight ? 'CLEAN LIGHT' : 'BLACK EDITION'}
                            </div>
                          </div>
                        </div>
                        <p className={`text-[13px] leading-[1.6] ${subtextColor}`}>
                          AI-KAYORI — приватный AI-ассистент с поддержкой Google Gemini, Cloudflare Workers AI и OpenAI-совместимых провайдеров. Быстрый интерфейс, Markdown разметка, работа с кодом, загрузка файлов и фото.
                        </p>
                      </div>

                      <div className={`${cardBg} border ${cardBorder} rounded-[18px] p-6 shadow-sm`}>
                        <div className="text-[14px] font-bold mb-3">Разработчик</div>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${isLight ? 'bg-black text-white' : 'bg-white text-black'} flex items-center justify-center font-bold`}>
                            K
                          </div>
                          <div>
                            <div className="font-bold">{DEVELOPER.name}</div>
                            <div className={`text-[11px] font-mono ${subtextColor}`}>{DEVELOPER.github}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ADDONS TAB */}
                  {activeTab === 'addons' && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-[20px] font-bold">Дополнения</h2>
                        <p className={`text-[12px] ${subtextColor} mt-0.5`}>Другие проекты разработчика</p>
                      </div>
                      <div className="grid gap-3">
                        {otherRepos.length === 0 ? (
                          <div className={`text-[13px] ${subtextColor} text-center py-8`}>Загрузка списка...</div>
                        ) : (
                          otherRepos
                            .filter(r => !isMobileDevice || !r.name.toLowerCase().includes('apk'))
                            .map((repo: any) => {
                              const rel = repoReleases[repo.name]
                              return (
                                <div key={repo.id} className={`${cardBg} border ${cardBorder} rounded-[14px] p-4 shadow-sm`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[13px] font-bold truncate">{repo.name}</div>
                                      <div className={`text-[11px] ${subtextColor} mt-1 line-clamp-2`}>
                                        {repo.description || 'Нет описания'} • {repo.language || 'code'}
                                      </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                      {rel && rel.assets && rel.assets.length > 0 ? (
                                        rel.assets.slice(0, 2).map((a: any) => (
                                          <button
                                            key={a.id}
                                            onClick={() => window.open(a.browser_download_url, '_blank')}
                                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                                              isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                                            }`}
                                          >
                                            {a.name.split('.').pop()}
                                          </button>
                                        ))
                                      ) : (
                                        <a
                                          href={repo.html_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`px-3 py-1.5 rounded-full border ${cardBorder} text-[11px] font-semibold ${
                                            isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1]'
                                          }`}
                                        >
                                          GitHub
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                        )}
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
