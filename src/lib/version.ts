export const APP_VERSION = '5.0.3'
export const APP_NAME = 'AI-KAYORI'
export const APP_BUILD = `build-${Date.now()}`
export const APP_FULL_NAME = `${APP_NAME}`

export const MODELS = {
  google: {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    short: 'G',
    provider: 'Google AI Studio',
    version: '1.5 Flash',
    color: '#4285F4',
    description: 'Умная, мультимодальная (фото, файлы), быстрый ответ',
    supportsVision: true,
    supportsFiles: true,
    icon: 'gemini',
    capabilities: ['vision', 'code', 'text']
  },
  geminiPro: {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    short: 'GP',
    provider: 'Google AI Studio',
    version: '1.5 Pro',
    color: '#34A853',
    description: 'Глубокий анализ, сложные рассуждения, код и файлы',
    supportsVision: true,
    supportsFiles: true,
    icon: 'gemini',
    capabilities: ['vision', 'code', 'reasoning']
  },
  custom: {
    id: 'custom-openai',
    name: 'OpenAI / Groq / OpenRouter',
    short: 'AI',
    provider: 'OpenAI-совместимый API',
    version: 'Custom',
    color: '#10A37F',
    description: 'Любой API ключ: OpenAI, Groq, OpenRouter, DeepSeek',
    supportsVision: true,
    supportsFiles: true,
    icon: 'openai',
    capabilities: ['text', 'code', 'reasoning']
  },
  llama31: {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    short: 'L31',
    provider: 'Meta / Cloudflare',
    version: '3.1',
    color: '#8B5CF6',
    description: 'Отличный русский язык, логика, память контекста',
    icon: 'llama',
    capabilities: ['text', 'code']
  },
  mistral: {
    id: '@cf/mistral/mistral-7b-instruct-v0.2',
    name: 'Mistral 7B',
    short: 'M7',
    provider: 'Mistral / Cloudflare',
    version: 'v0.2',
    color: '#FF6B35',
    description: 'Компактная, быстрая модель для чётких задач',
    icon: 'mistral',
    capabilities: ['code', 'text']
  },
  qwen: {
    id: '@cf/qwen/qwen1.5-7b-chat-awq',
    name: 'Qwen 1.5 7B',
    short: 'Q7',
    provider: 'Alibaba / Cloudflare',
    version: 'AWQ',
    color: '#7C3AED',
    description: 'Сильна в мультиязычных задачах и математике',
    icon: 'qwen',
    capabilities: ['text', 'code']
  }
} as const

export type ModelId = keyof typeof MODELS

export const DEVELOPER = {
  name: 'KayoriSAN',
  github: 'https://github.com/kayorissss',
  email: 'dev@kayori.ai'
}
