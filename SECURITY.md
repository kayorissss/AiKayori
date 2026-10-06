# Security — AI-Kayori

## ⚠️ Важно: ключи из запроса

В исходном сообщении были указаны реальные ключи:

- Google: `YOUR_GOOGLE_API_KEY_HERE`
- Cloudflare: `YOUR_CF_API_TOKEN_HERE`

**Что делать:**

1. **Немедленно перевыпусти ключи:**
   - Google AI Studio: https://aistudio.google.com/app/apikey → Delete → Create new
   - Cloudflare: https://dash.cloudflare.com/profile/api-tokens → Roll / Delete

2. В этом репозитории ключи хранятся только в `.env` (в .gitignore). В `.env.example` — примеры.

3. В проде используй Cloudflare Worker как прокси (`worker/index.ts`), чтобы токен не светился в браузере.

## Как хранить

- Никогда не коммить `.env`
- Для GitHub Releases — используй GitHub Secrets
- Для Electron — `process.env` в main process, не в renderer

## Отчеты

security@kayori.ai — если нашёл уязвимость.

## Автообновление

Проверяет подпись релизов с GitHub. Не ставь APK/EXE из непроверенных источников.
