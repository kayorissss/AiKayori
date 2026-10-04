import { motion, AnimatePresence } from 'framer-motion'
import { APP_VERSION } from '@/lib/version'
import { useState, useEffect } from 'react'
import { getSetting, saveSetting } from '@/lib/storage'

interface Props {
  open: boolean
  onClose: () => void
  theme?: string
}

export default function AccountModal({ open, onClose, theme = 'dark' }: Props) {
  const [yandexLogged, setYandexLogged] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (open) {
      getSetting<boolean>('yandex-logged').then(v => setYandexLogged(!!v))
      getSetting<string>('yandex-email').then(v => setEmail(v || ''))
    }
  }, [open])

  const handleYandexLogin = () => {
    const demoEmail = `user_${Math.random().toString(36).slice(2, 6)}@kayori.local`
    setYandexLogged(true)
    setEmail(demoEmail)
    saveSetting('yandex-logged', true)
    saveSetting('yandex-email', demoEmail)
  }

  const handleLogout = async () => {
    setYandexLogged(false)
    setEmail('')
    await saveSetting('yandex-logged', false)
    await saveSetting('yandex-email', '')
  }

  const isLight = theme === 'light'
  const modalBg = isLight ? 'bg-white text-black border-black/10' : 'bg-[#141414] text-white border-white/[0.08]'
  const cardBg = isLight ? 'bg-[#F9FAFB] border-black/10' : 'bg-black/40 border-white/[0.06]'
  const subtextColor = isLight ? 'text-[#6B7280]' : 'text-[#888]'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-[12px] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`w-full max-w-[420px] ${modalBg} border rounded-[24px] overflow-hidden shadow-2xl`}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full border flex items-center justify-center font-bold text-[14px] ${
                      isLight ? 'bg-black/5 border-black/10' : 'bg-white/[0.06] border-white/[0.08]'
                    }`}
                  >
                    {yandexLogged ? email[0]?.toUpperCase() : 'G'}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold">
                      {yandexLogged ? 'Профиль аккаунта' : 'Гостевой режим'}
                    </div>
                    <div className={`text-[11px] font-mono ${subtextColor}`}>
                      v{APP_VERSION} • {yandexLogged ? 'Синхронизация' : 'Без регистрации'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                    isLight ? 'bg-black/5 hover:bg-black/10 border-black/5 text-black' : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-white'
                  }`}
                >
                  ✕
                </button>
              </div>

              {!yandexLogged ? (
                <>
                  <div className={`${cardBg} border rounded-[18px] p-4 mb-4`}>
                    <div className="text-[13.5px] font-bold">Вы работаете локально</div>
                    <div className={`text-[12px] mt-1.5 leading-relaxed ${subtextColor}`}>
                      Все диалоги и файлы хранятся строго в вашем браузере. Вы можете использовать Яндекс ID для привязки профиля.
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-emerald-500">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Локально • Приватно • Без ограничений
                    </div>
                  </div>

                  <button
                    onClick={handleYandexLogin}
                    className="w-full bg-[#FC3F1D] text-white rounded-full py-3 font-bold text-[13.5px] flex items-center justify-center gap-2 hover:bg-[#e53919] transition shadow-[0_6px_20px_rgba(252,63,29,0.25)]"
                  >
                    <span className="w-5 h-5 bg-white text-[#FC3F1D] rounded-full flex items-center justify-center font-bold text-[12px]">
                      Я
                    </span>
                    Войти с Яндекс ID
                  </button>
                </>
              ) : (
                <div className={`${cardBg} border rounded-[18px] p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="text-[13.5px] font-bold">Вы авторизованы</div>
                      <div className={`text-[11px] font-mono ${subtextColor}`}>{email}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleLogout}
                      className={`flex-1 border rounded-full py-2 text-[12px] font-medium transition ${
                        isLight ? 'bg-black/5 hover:bg-black/10 border-black/10' : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08]'
                      }`}
                    >
                      Выйти
                    </button>
                    <button
                      onClick={onClose}
                      className={`flex-1 rounded-full py-2 text-[12px] font-bold transition ${
                        isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      Готово
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
