export const APP_VERSION = '5.0.0'
export const APP_NAME = 'AI-KAYORI'
export const APP_BUILD = `build-${Date.now()}`
export const APP_FULL_NAME = `${APP_NAME}`

export const MODELS = {
  google: {
    id: 'google-gemini',
    name: 'Gemini 1.5 Flash',
    short: 'G',
    provider: 'Google',
    version: 'Flash',
    color: '#4285F4',
    description: 'Видит фото, файлы, быстро',
    supportsVision: true,
    supportsFiles: true,
    icon: 'gemini',
    capabilities: ['vision', 'code', 'text']
  },
  llama31: {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    short: 'L31',
    provider: 'Meta',
    version: '3.1',
    color: '#8B5CF6',
    description: 'Русский, дружелюбный, память',
    icon: 'llama',
    capabilities: ['text', 'code']
  },
  llama3: {
    id: '@cf/meta/llama-3-8b-instruct',
    name: 'Llama 3 8B',
    short: 'L3',
    provider: 'Meta',
    version: '3.0',
    color: '#A78BFA',
    description: 'Классика, структура',
    icon: 'llama',
    capabilities: ['text']
  },
  mistral: {
    id: '@cf/mistral/mistral-7b-instruct-v0.2',
    name: 'Mistral 7B',
    short: 'M7',
    provider: 'Mistral',
    version: 'v0.2',
    color: '#FF6B35',
    description: 'Коротко, технично',
    icon: 'mistral',
    capabilities: ['code', 'text']
  },
  qwen: {
    id: '@cf/qwen/qwen1.5-7b-chat-awq',
    name: 'Qwen 1.5 7B',
    short: 'Q7',
    provider: 'Alibaba',
    version: 'AWQ',
    color: '#7C3AED',
    description: 'Мультиязычная, примеры',
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
