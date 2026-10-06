# Дизайн-система AI-Kayori

## Цвета

- Чёрный: #0A0A0A — фон приложения, TitleBar
- Тёмно-серый: #121212 — sidebar, лого фон
- Серый: #242424 — карточки, инпуты, кнопки ghost
- Светло-серый: #2E2E2E — hover, scrollbar thumb
- Бордер: #333333 — границы
- Белый: #FFFFFF — текст, основная кнопка, иконка котика
- Muted: #9CA3AF — вторичный текст

## Логотип

- Фон чёрный/тёмно-серый
- Иконка белая — символичный котик
- Геометрия: треугольные ушки, шестиугольник мордочки, узкие глаза-щёлки
- Стиль: монолайн, минимализм, премиум AI
- Файл: `public/logo-kayori.png` 1024x1024

Использование:
- TitleBar 20x20 rounded 6px
- Сообщения AI — аватарка 32x32
- Пустой экран — 80x80 rounded 24px
- Favicon

## Типографика

- Sans: Inter, Manrope, system-ui
- Mono: JetBrains Mono (версии, время, коды)
- Заголовки: 14-28px, semibold, tracking-tight
- Тело: 14px, leading 1.5-1.6
- Мелкий: 11-12px mono для метаинфы

## Компоненты

- `kayori-card`: bg #1A1A1A, border #333, rounded 16px
- `kayori-btn`: bg white, text black, rounded-full, px 5 py 2.5, 14px medium
- `kayori-btn-ghost`: bg #242424, border, rounded-full
- `kayori-input`: bg #242424, border, rounded 16px, px 4 py 3, 14px

## Анимации

- fade-in 0.3s ease-out
- slide-up 0.3s
- typing dots 1.4s infinite
- shimmer 1.5s для загрузки
- framer-motion для чатов, модалок

## Окно

- Custom TitleBar 36px, drag-region
- Кнопки 32x32 rounded-full, hover bg #242424, close hover red-500
- Тень: `shadow-[0_20px_80px_rgba(0,0,0,0.6)]` для модалок
- Blur: backdrop-blur-xl для header, glass эффект

## Сообщения

- User: белый фон, чёрный текст, rounded 20px + br 6px, shadow white/8%
- AI: карточка #1A1A1A border, аватарка котика, имя + модель + версия + иконка, время mono

## Инпут

- Контейнер: bg #242424 border rounded 24px, p 2 pl 3
- Textarea auto-resize до 160px
- Кнопка отправки: белая 36x36 rounded-full, стрелка ↑
- Подсказки: 11px mono, centered

## Скроллбар

- width 6px, track #121212, thumb #2E2E2E rounded 3px, hover #3a3a3a
