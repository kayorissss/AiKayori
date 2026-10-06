# Фичи AI-Kayori — полный список

## Интерфейс
- [x] Тёмная тема: чёрный #0A0A0A, тёмно-серый #121212, серый #242424, белый #FFFFFF
- [x] Логотип: чёрный фон, белая иконка котика геометричного
- [x] Кастомный TitleBar: крестик, квадрат, полоска в стиле приложения
- [x] Плавные переходы, анимации, загрузки (framer-motion, shimmer, typing)
- [x] Sidebar с историей чатов, поиском, коллапсом
- [x] ChatArea с пузырьками, аватаркой котика у AI, моделью и версией
- [x] InputBar с авто-ресайзом, счётчиком, памятью черновика
- [x] SettingsModal: модели, API ключи, автообновление, сборки
- [x] AccountModal: Yandex ID
- [x] PrivacyPage: политика, модели, сборки
- [x] Mini-окно (Document PiP) и F11 полный экран
- [x] Адаптив: мобильная версия, APK

## Чаты
- [x] Создание, удаление, переименование (первое сообщение → заголовок)
- [x] История в IndexedDB (idb)
- [x] Поиск по заголовку
- [x] Draft persistence: если написал запрос и случайно перешёл в другой чат/вышел — текст сохраняется (global-draft + draft-{chatId})
- [x] Сообщения: user (белый) и assistant (тёмный) с markdown, кодом

## Модели
- [x] Google Gemini 1.5 Flash — `gemini-1.5-flash-latest` — быстрая, мультимодальная
- [x] Llama 3.1 8B — `@cf/meta/llama-3.1-8b-instruct` — русский
- [x] Llama 3 8B — `@cf/meta/llama-3-8b-instruct` — классика
- [x] Mistral 7B v0.2 — `@cf/mistral/mistral-7b-instruct-v0.2` — короткие задачи
- [x] Qwen 1.5 7B AWQ — `@cf/qwen/qwen1.5-7b-chat-awq` — мультиязык
- [x] В чате пишет: иконка, название, версия, провайдер

## Фото и генерация
- [x] Загрузка фото 📎 для осмотра (Gemini vision, inline_data)
- [x] Генерация изображений по триггерам "нарисуй", "сгенерируй", "/imagine" через Cloudflare Stable Diffusion XL
- [x] Превью загруженного изображения, удаление

## Сборки
- [x] PC Setup: `AI-Kayori-Setup-v1.0.0.exe` — NSIS installer
- [x] PC Portable: `AI-Kayori-Portable-v1.0.0.exe` — без установки
- [x] APK: `AI-Kayori-v1.0.0.apk` — Capacitor
- [x] Версия в имени файла чтобы не спутал когда скачал
- [x] Скрипт `update-version.js` обновляет версию везде

## Автообновление
- [x] Проверка при запуске (GitHub Releases)
- [x] Кнопка "Проверить сейчас" в настройках
- [x] electron-updater в проде
- [x] `check-updates.js` для CLI

## Безопасность
- [x] Запрет на поиск личного (адрес, телефон, паспорт, пробив)
- [x] Запрет на запрещённое (оружие, наркотики, взлом, детская порнография)
- [x] Политика конфиденциальности PRIVACY.md
- [x] Ключи локально, не на сервере

## Аккаунт
- [x] Yandex ID OAuth — кнопка, токен локально, инструкция в docs/YANDEX_ID.md

## Технологии
Vite + React + TS + Tailwind + Zustand + idb + Framer Motion + Electron + Capacitor + Google Gemini + Cloudflare Workers AI + Yandex ID
