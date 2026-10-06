import { motion, AnimatePresence } from 'framer-motion'
import { APP_VERSION } from '@/lib/version'
import { useState, useEffect } from 'react'
import { getSetting, saveSetting } from '@/lib/storage'

interface Props { open: boolean; onClose: () => void }

export default function AccountModal({ open, onClose }: Props) {
  const [yandexLogged, setYandexLogged] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (open) {
      getSetting('yandex-logged').then(v => setYandexLogged(!!v))
      getSetting('yandex-email').then(v => setEmail(v || ''))
    }
  }, [open])

  const handleYandexLogin = () => {
    const demoEmail = `guest_${Math.random().toString(36).slice(2,6)}@kayori.local`
    setYandexLogged(true); setEmail(demoEmail)
    saveSetting('yandex-logged', true); saveSetting('yandex-email', demoEmail)
  }
  const handleLogout = async () => {
    setYandexLogged(false); setEmail('')
    await saveSetting('yandex-logged', false); await saveSetting('yandex-email', '')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-[20px] flex items-center justify-center p-4">
          <motion.div initial={{ y: 24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="w-full max-w-[440px] bg-[rgba(18,18,18,0.9)] backdrop-blur-2xl border border-white/[0.08] rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="p-7">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl flex items-center justify-center font-bold text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">{yandexLogged ? email[0]?.toUpperCase() : 'G'}</div>
                  <div><div className="text-[16px] font-bold" style={{ fontFamily: 'Gotham, sans-serif' }}>{yandexLogged ? 'Аккаунт' : 'Гостевой режим'}</div><div className="text-[11px] text-[#666] font-mono">v{APP_VERSION} • {yandexLogged ? 'Вошёл' : 'Без входа'}</div></div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition">×</button>
              </div>

              {!yandexLogged ? (
                <>
                  <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] rounded-[20px] p-5 mb-4">
                    <div className="text-[14px] font-bold" style={{ fontWeight: 600 }}>Ты в гостевом режиме</div>
                    <div className="text-[13px] text-[#888] mt-2 leading-relaxed">Можешь писать без входа. Чаты сохраняются локально на устройстве. Войди через Яндекс ID для синхронизации между устройствами.</div>
                    <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-[#666]"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Локально • безлимит чатов • приватно</div>
                  </div>
                  <button onClick={handleYandexLogin} className="w-full bg-[#FC3F1D] text-white rounded-full py-3.5 font-bold text-[14px] flex items-center justify-center gap-2.5 hover:bg-[#e53919] transition shadow-[0_8px_24px_rgba(252,63,29,0.25)]"><span className="w-7 h-7 bg-white text-[#FC3F1D] rounded-full flex items-center justify-center font-bold text-[14px]">Я</span> Войти с Яндекс ID</button>
                  <div className="text-[11px] text-[#555] text-center mt-3">Необязательно — можно оставаться гостем. Аккаунт теперь внутри настроек, не выкидывает.</div>
                </>
              ) : (
                <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] rounded-[20px] p-5">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">✓</div><div><div className="text-[14px] font-bold">Вы вошли</div><div className="text-[12px] text-[#888] font-mono">{email}</div></div></div>
                  <div className="mt-5 flex gap-2"><button onClick={handleLogout} className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full py-3 text-[13px] hover:bg-white/[0.08] font-medium">Выйти</button><button onClick={onClose} className="flex-1 bg-white text-black rounded-full py-3 text-[13px] font-bold">Продолжить</button></div>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <div className="text-[11px] font-mono text-[#555] uppercase tracking-widest mb-3 font-bold">Возможности</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-black/30 backdrop-blur-xl border border-white/[0.06] rounded-[16px] p-4"><div className="text-[11px] text-[#666]">Чаты</div><div className="text-[20px] font-bold mt-1">∞</div><div className="text-[10px] text-[#555]">Локально</div></div>
                  <div className="bg-black/30 backdrop-blur-xl border border-white/[0.06] rounded-[16px] p-4"><div className="text-[11px] text-[#666]">Модели</div><div className="text-[20px] font-bold mt-1">5</div><div className="text-[10px] text-[#555]">Gemini + Llama и др.</div></div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
