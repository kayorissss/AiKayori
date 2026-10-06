export const APP_VERSION = '5.0.2'
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
    description: 'Фото и файлы',
    supportsVision: true,
    supportsFiles: true,
    icon: 'gemini',
    capabilities: ['photo', 'code', 'text'],
    personality: 'Дружелюбный, видит фото, отвечает прямо'
  },
  deepseek: {
    id: 'deepseek/deepseek-v3.2-exp',
    orcaId: 'deepseek/deepseek-v4-flash-free',
    name: 'DeepSeek V4 Flash',
    short: 'DS',
    provider: 'DeepSeek',
    version: 'V4',
    color: '#0A84FF',
    description: 'Рассуждает, код',
    supportsVision: false,
    icon: 'deepseek',
    capabilities: ['reasoning', 'code'],
    personality: 'Рассуждает глубоко, любит разбирать по шагам, пишет чистый код'
  },
  glm: {
    id: 'z-ai/glm-4.5-air',
    orcaId: 'z-ai/glm-5.3-flash-free',
    name: 'GLM 5.3 Flash',
    short: 'GLM',
    provider: 'Z-AI',
    version: '5.3',
    color: '#7C3AED',
    description: 'Быстрый, логичный',
    icon: 'glm',
    capabilities: ['text', 'code'],
    personality: 'Логичный, структурированный, любит списки и примеры'
  },
  hy: {
    id: 'tencent/hunyuan-a13b-instruct',
    orcaId: 'tencent/hy4-preview-free',
    name: 'Hunyuan 4 Preview',
    short: 'HY',
    provider: 'Tencent',
    version: 'Preview',
    color: '#00D492',
    description: 'Мультиязычный',
    icon: 'tencent',
    capabilities: ['text', 'photo'],
    personality: 'Мультиязычный, дружелюбный, с юмором'
  },
  mistral: {
    id: '@cf/mistral/mistral-7b-instruct-v0.2',
    orcaId: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B',
    short: 'M7',
    provider: 'Mistral',
    version: 'v0.2',
    color: '#FF6B35',
    description: 'Коротко и по делу',
    icon: 'mistral',
    capabilities: ['code'],
    personality: 'Коротко, технично, без воды, только суть'
  },
  qwen: {
    id: '@cf/qwen/qwen1.5-7b-chat-awq',
    orcaId: 'qwen/qwen3-4b',
    name: 'Qwen 3 4B',
    short: 'Q3',
    provider: 'Alibaba',
    version: '3.0',
    color: '#A78BFA',
    description: 'Примеры и код',
    icon: 'qwen',
    capabilities: ['code', 'text'],
    personality: 'Дает много примеров, любит код и объяснения'
  },
  orcaAuto: {
    id: 'orcarouter/auto',
    orcaId: 'orcarouter/auto',
    name: 'Orca Auto',
    short: 'OA',
    provider: 'OrcaRouter',
    version: 'Auto',
    color: '#FFFFFF',
    description: 'Авто выбор лучшей',
    icon: 'orca',
    capabilities: ['auto', 'text'],
    personality: 'Выбирает лучшую модель под задачу автоматически'
  }
} as const

export type ModelId = keyof typeof MODELS

export const DEVELOPER = {
  name: 'KayoriSAN',
  github: 'https://github.com/kayorissss',
  email: 'dev@kayori.ai'
}
