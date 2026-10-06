# Yandex ID в AI-Kayori

## Как получить Client ID

1. Иди на https://oauth.yandex.ru/client/new
2. Название: AI-Kayori
3. Платформы: Веб-сервисы
4. Redirect URI: `https://kayori.ai/auth/yandex/callback` или `http://localhost:5173` для dev
5. Доступы: `login:email`, `login:info`, `login:avatar`
6. Создать → скопировать Client ID

## .env

```
VITE_YANDEX_CLIENT_ID=ваш_id_из_яндекса
```

## Flow

```ts
// AccountModal.tsx
const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}`
window.location.href = authUrl

// После редиректа парсим hash:
const hash = window.location.hash // #access_token=xxx&token_type=bearer
const token = new URLSearchParams(hash.slice(1)).get('access_token')

// Получаем инфо:
fetch('https://login.yandex.ru/info?format=json', {
  headers: { Authorization: `OAuth ${token}` }
})
```

## Что храним

- access_token в IndexedDB `settings` -> `yandex-token`
- email, display_name, avatar

## Кнопка

Красная #FC3F1D с белой Я в круге — как в дизайне Яндекса.

## Зачем

- Синхронизация чатов (будущее)
- Премиум модели
- Персонализация

Сейчас — демо, без бэкенда. Токен локально.
