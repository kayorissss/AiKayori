import { APP_VERSION } from '@/lib/version'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-kayori-black text-kayori-white">
      <div className="h-[36px] bg-kayori-black border-b border-kayori-border flex items-center px-4 gap-2">
        <img src="/logo-kayori.png" className="w-5 h-5 rounded" alt="logo" />
        <span className="text-[13px] font-semibold">AI-Kayori</span>
        <span className="text-[10px] font-mono bg-kayori-gray px-1.5 py-0.5 rounded-full border border-kayori-border">v{APP_VERSION}</span>
      </div>

      <div className="max-w-[720px] mx-auto p-6 md:p-10">
        <a href="#" className="text-[13px] px-3 py-1.5 rounded-full bg-kayori-gray border border-kayori-border inline-flex items-center gap-1 hover:bg-kayori-lightgray mb-6">← Назад в чат</a>

        <h1 className="text-[28px] font-bold tracking-tight">Политика конфиденциальности</h1>
        <div className="text-[12px] font-mono text-kayori-muted mt-2">v{APP_VERSION} • 3 октября 2026 • Чёрный #0A0A0A, тёмно-серый #121212</div>

        <div className="mt-8 space-y-8 text-[14px] leading-[1.7] text-white/90">
          <section className="kayori-card p-5">
            <h2 className="text-[16px] font-semibold mb-3">1. Что храним локально</h2>
            <ul className="list-disc pl-5 space-y-1 text-kayori-muted">
              <li>Чаты и сообщения — только в IndexedDB, не на сервере</li>
              <li>Черновики — сохраняются если случайно перешёл в другой чат</li>
              <li>API ключи Google и Cloudflare — в настройках, локально</li>
              <li>Yandex ID токен — опционально</li>
            </ul>
          </section>

          <section className="kayori-card p-5">
            <h2 className="text-[16px] font-semibold mb-3">2. Что запрещено</h2>
            <p>AI-Kayori не позволяет искать личные данные (адрес, телефон, паспорт, ИНН, пробив людей), инструкции по оружию/наркотикам/взлому, детскую порнографию, экстремизм.</p>
            <div className="mt-3 p-3 bg-kayori-black border border-kayori-border rounded-xl font-mono text-[12px]">
              🚫 Запрос содержит запрещённый контент или попытку поиска личных данных.<br />
              Согласно Политике AI-Kayori, я не могу искать личные данные...
            </div>
          </section>

          <section className="kayori-card p-5">
            <h2 className="text-[16px] font-semibold mb-3">3. Куда уходят данные</h2>
            <div className="grid gap-2 text-[12px] font-mono">
              <div className="bg-kayori-black border border-kayori-border rounded-lg p-3">Google Gemini: generativelanguage.googleapis.com — текст + фото</div>
              <div className="bg-kayori-black border border-kayori-border rounded-lg p-3">Cloudflare: api.cloudflare.com/client/v4/accounts/.../ai/run/@cf/meta/llama-3.1-8b-instruct и др.</div>
            </div>
            <p className="mt-3 text-kayori-muted text-[13px]">Мы не логируем запросы на своих серверах.</p>
          </section>

          <section className="kayori-card p-5">
            <h2 className="text-[16px] font-semibold mb-3">4. Изображения</h2>
            <p>Загруженные фото — только в модель для анализа, не сохраняются. Генерация — через Cloudflare Stable Diffusion XL, создаётся на лету.</p>
          </section>

          <section className="kayori-card p-5">
            <h2 className="text-[16px] font-semibold mb-3">5. Модели и иконки</h2>
            <div className="grid grid-cols-1 gap-2">
              {[
                '🔷 Google Gemini 1.5 Flash — gemini-1.5-flash-latest — быстрая мультимодальная',
                '🦙 Llama 3.1 8B Instruct — @cf/meta/llama-3.1-8b-instruct — отлично понимает русский',
                '🦙 Llama 3 8B Instruct — @cf/meta/llama-3-8b-instruct — классическая Llama 3',
                '🌬️ Mistral 7B v0.2 — @cf/mistral/mistral-7b-instruct-v0.2 — короткие задачи',
                '💫 Qwen 1.5 7B Chat AWQ — @cf/qwen/qwen1.5-7b-chat-awq — разные языки',
              ].map(t => (
                <div key={t} className="text-[12px] bg-kayori-black border border-kayori-border rounded-full px-3 py-2">{t}</div>
              ))}
            </div>
          </section>

          <section className="kayori-card p-5">
            <h2 className="text-[16px] font-semibold mb-3">6. Сборки</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[12px]">
              <div className="bg-kayori-black border border-kayori-border rounded-xl p-3">PC Setup<br />AI-Kayori-Setup-v{APP_VERSION}.exe</div>
              <div className="bg-kayori-black border border-kayori-border rounded-xl p-3">PC Portable<br />AI-Kayori-Portable-v{APP_VERSION}.exe</div>
              <div className="bg-kayori-black border border-kayori-border rounded-xl p-3">Android APK<br />AI-Kayori-v{APP_VERSION}.apk</div>
            </div>
            <p className="mt-3 text-[12px] text-kayori-muted">Версия в имени файла — чтобы не спутал когда скачал.</p>
          </section>

          <section className="kayori-card p-5">
            <h2 className="text-[16px] font-semibold mb-3">7. Автообновление и интерфейс</h2>
            <ul className="list-disc pl-5 text-kayori-muted space-y-1">
              <li>Проверка обновлений при запуске с GitHub Releases</li>
              <li>Кастомный TitleBar: чёрный, кнопки в стиле приложения</li>
              <li>Плавные переходы, анимации, загрузки — framer-motion</li>
              <li>Мини-окно (Document PiP) и F11 полный экран</li>
              <li>Память черновика если случайно вышел из чата</li>
            </ul>
          </section>

          <div className="text-center text-[11px] font-mono text-kayori-muted pt-6 border-t border-kayori-border">
            AI-Kayori v{APP_VERSION} • 🐾 Приватный котик • Чёрный, тёмно-серый, серый, белый • security@kayori.ai
          </div>
        </div>
      </div>
    </div>
  )
}
