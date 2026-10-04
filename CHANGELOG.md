# Changelog AI-Kayori

## v1.0.0 — 2026-10-03

Первый релиз 🐾

### Добавлено
- Логотип: чёрный фон #121212, белая иконка геометричного котика
- Цвета: чёрный #0A0A0A, тёмно-серый #121212, серый #242424, белый #FFFFFF
- Чаты: создание, история, поиск, удаление, IndexedDB
- Сообщения: пузырьки, аватарка котика у AI, пишет модель и версию с иконкой
- Ввод: textarea auto-resize, черновик сохраняется при случайном переходе в другой чат/выходе (global-draft + draft-{chatId})
- Модели: Google Gemini 1.5 Flash + 4 Cloudflare Workers AI (Llama 3.1 8B, Llama 3 8B, Mistral 7B v0.2, Qwen 1.5 7B)
- Фото: загрузка для анализа (vision) через Gemini, генерация изображений через Cloudflare Stable Diffusion XL по триггерам "нарисуй"
- TitleBar: кастомный, без системного, кнопки в стиле приложения (полоска, квадрат, крестик)
- Анимации: framer-motion, fade-in, slide-up, typing dots, shimmer
- Сборки с версией в имени: Setup v1.0.0.exe, Portable v1.0.0.exe, APK v1.0.0.apk
- Автообновление: проверка при запуске, кнопка в настройках
- Мини-окно: Document PiP API, F11 полный экран
- Яндекс ID: кнопка входа, OAuth, токен локально
- Политика конфиденциальности: запрет на поиск личного, запрещёнки (PRIVACY.md)
- Настройки: выбор модели, API ключи локально, обновления, интерфейс

### Технологии
Vite + React + TS + Tailwind + Zustand + idb + Framer Motion + Electron + Capacitor + Google Gemini + Cloudflare Workers AI

### Сборки
- PC Setup: AI-Kayori-Setup-v1.0.0.exe (NSIS)
- PC Portable: AI-Kayori-Portable-v1.0.0.exe
- APK: AI-Kayori-v1.0.0.apk
- Web: dist/ (PWA ready)

### Безопасность
- Ключи в .env, не коммитить
- Cloudflare токен YOUR_CF_API_TOKEN_HERE — хранить в секретах
- Google ключ YOUR_GOOGLE_API_KEY_HERE — из AI Studio
