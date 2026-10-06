# Сборки AI-Kayori v1.0.0

## Версия в имени файла
Чтобы не спутал человек когда скачал — версия прямо в имени:

- `AI-Kayori-Setup-v1.0.0.exe` — установщик NSIS
- `AI-Kayori-Portable-v1.0.0.exe` — portable без установки
- `AI-Kayori-v1.0.0.apk` — Android

Настраивается в `electron-builder.yml`:
```yml
artifactName: "AI-Kayori-Setup-v${version}.${ext}"
```

При `npm version patch` скрипт `scripts/update-version.js` обновляет `src/lib/version.ts` и `index.html`.

## PC Setup (установщик)

```bash
npm run electron:build:setup
# выход: release/setup/AI-Kayori-Setup-v1.0.0.exe
```

NSIS опции:
- oneClick: false (можно выбрать папку)
- createDesktopShortcut: true
- Автообновление через electron-updater (в проде)

## PC Portable

```bash
npm run electron:build:portable
# выход: release/portable/AI-Kayori-Portable-v1.0.0.exe
```

Portable не пишет в реестр, хранит чаты рядом в `userData` или IndexedDB.

## Android APK

```bash
npm run build # собрать веб
npx cap add android # первый раз
npx cap copy android
npx cap open android # откроет Android Studio
# В Android Studio: Build -> Build APK
# Итог: android/app/build/outputs/apk/debug/AI-Kayori-v1.0.0.apk
# Переименуй вручную или скриптом:
cp android/app/build/outputs/apk/debug/app-debug.apk release/AI-Kayori-v1.0.0.apk
```

Capacitor config в `capacitor.config.ts`:
- backgroundColor #0A0A0A
- StatusBar темный
- SplashScreen чёрный

## Автообновление

`src/lib/version.ts` + `electron/main.ts` + `scripts/check-updates.js`

- При запуске `checkUpdates()` дергает GitHub Releases API
- Если есть новая версия — показывает баннер
- Скачивает с `https://github.com/kayorissss/AiKayori/releases`
- Electron-updater в проде делает `autoUpdater.checkForUpdatesAndNotify()`

Проверка вручную: Настройки -> Проверить сейчас

## Кастомное окно

Electron `frame: false`, `titleBarStyle: hidden`

TitleBar.tsx — чёрный #0A0A0A, border #333, кнопки:
- Минимизировать: полоска 12x1.5px белая
- Развернуть: квадрат 12x12 border white
- Закрыть: крестик 12x12, hover red-500

Все в стиле приложения, не системные.

## Иконки

- `public/logo-kayori.png` — оригинал 1024, чёрный фон, белый геометричный котик
- `public/icons/icon.png` — для electron-builder
- Для APK: `android/app/src/main/res/mipmap-*/ic_launcher.png` (сгенерировать из icon.png)

## Мини-окно и F11

- F11: `document.documentElement.requestFullscreen()` + Esc выход
- Мини-окно: Document Picture-in-Picture API (Chrome 111+), fallback — Electron BrowserView

## Яндекс ID

В `AccountModal.tsx`:
```ts
window.open(`https://oauth.yandex.ru/authorize?response_type=token&client_id=${CLIENT_ID}`)
```
Scope: `login:email login:info`

Токен парсится из hash, сохраняется в IndexedDB.

## Cloudflare

Модели из `src/lib/version.ts`:
- Llama 3.1 8B — быстрая, русский
- Llama 3 8B — классика
- Mistral 7B v0.2 — короткие задачи
- Qwen 1.5 7B AWQ — мультиязык

Worker в `worker/index.ts` — прокси чтобы не светить токен `cfut_pjlsr...`

## Google

Gemini 1.5 Flash — `generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=...`

Поддерживает image inline_data для анализа фото.
