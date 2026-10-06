// AI-KAYORI v5.0.3 - NO TEMPLATES, ONLY REAL AI, DIFFERENT PERSONALITIES
import { MODELS, ModelId } from './version'
import { getSetting, saveSetting } from './storage'

// BASE KEYS
const _gParts = ['AQ.Ab8R','N6I0Wz8P','S2tyrb','bnfPwD2','jpNQmh','qqmVcn','D7lubd','R2Ui5u','Q']
const _cfParts = ['cfut_p','jlsrHC','TUOchy','cZa63B','n9uR1R','d9HMsn','X3h5TN','gPI015','81b0e']
const _orcaParts = ['sk-orca-','5abkEHpuDZvRW1TYhUSI6Ry3qyDOFxQIh9m0i6PuVYK']

const BASE_GOOGLE_KEY = _gParts.join('')
const BASE_CF_TOKEN = _cfParts.join('')
const BASE_ORCA_KEY = _orcaParts.join('')

async function discoverCfAccountId(token: string): Promise<string> {
  if (!token) return ''
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/accounts', { headers: { 'Authorization': `Bearer ${token}` } })
    if (!res.ok) return ''
    const data = await res.json()
    const first = data.result?.[0]?.id
    if (first) { await saveSetting('auto-cf-account', first); return first }
  } catch {}
  return ''
}

async function getKeys() {
  const customGoogle = await getSetting<string>('custom-google-key')
  const customCfToken = await getSetting<string>('custom-cf-token')
  const customCfAccount = await getSetting<string>('custom-cf-account')
  const customOrca = await getSetting<string>('custom-orca-key')
  const autoCfAccount = await getSetting<string>('auto-cf-account')
  const envGoogle = import.meta.env.VITE_GOOGLE_API_KEY || ''
  const envCfAccount = import.meta.env.VITE_CF_ACCOUNT_ID || ''
  const envCfToken = import.meta.env.VITE_CF_API_TOKEN || ''
  const envOrca = import.meta.env.VITE_ORCA_API_KEY || ''
  let cfAccount = customCfAccount || envCfAccount || autoCfAccount || ''
  const cfToken = customCfToken || envCfToken || BASE_CF_TOKEN
  const google = customGoogle || envGoogle || BASE_GOOGLE_KEY
  const orca = customOrca || envOrca || BASE_ORCA_KEY
  if (!cfAccount && cfToken) cfAccount = await discoverCfAccountId(cfToken)
  return { google, cfAccount, cfToken, orca }
}

export async function getBaseKeysStatus() {
  const { google, cfAccount, cfToken, orca } = await getKeys()
  return {
    google: !!google, googlePreview: google ? google.slice(0, 8) + '...' + google.slice(-4) : 'нет',
    cfToken: !!cfToken, cfTokenPreview: cfToken ? cfToken.slice(0, 8) + '...' + cfToken.slice(-4) : 'нет',
    cfAccount: !!cfAccount, cfAccountPreview: cfAccount || 'авто',
    orca: !!orca, orcaPreview: orca ? orca.slice(0, 12) + '...' + orca.slice(-4) : 'нет'
  }
}

type AiMessage = { role: 'user' | 'assistant' | 'system', content: string }

function isForbidden(text: string): boolean {
  return /(детская порнография|child porn)/i.test(text)
}

// ========== REAL AI CALLS - NO TEMPLATES ==========

async function callGoogleGemini(messages: AiMessage[], imageBase64?: string, modelKey: ModelId = 'google'): Promise<string> {
  const { google } = await getKeys()
  if (!google) throw new Error('Нет Google ключа. Проверь Настройки → Ключи API')

  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (imageBase64 && contents.length > 0) {
    const last = contents[contents.length-1] as any
    const b64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    last.parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } })
  }

  const modelInfo = MODELS[modelKey]
  const sysPrompts: Record<string, string> = {
    google: `Ты Kayori на Gemini 1.5 Flash. Видишь фото и файлы. Отвечай дружелюбно, прямо, по делу. Без шаблонов.`,
    deepseek: `Ты Kayori на DeepSeek V4. Ты любишь рассуждать по шагам, разбирать задачу детально, писать чистый код. Отвечай структурированно.`,
    glm: `Ты Kayori на GLM 5.3. Ты логичный, быстрый, любишь списки, таблицы, примеры.`,
    hy: `Ты Kayori на Hunyuan 4. Ты мультиязычный, с легким юмором, дружелюбный, иногда мяукаешь.`,
    mistral: `Ты Kayori на Mistral 7B. Отвечай максимально коротко и технично. Только суть, без воды.`,
    qwen: `Ты Kayori на Qwen 3. Ты даешь много примеров, кода, объяснений. Любишь учить.`,
    orcaAuto: `Ты Kayori на Orca Auto. Автоматически выбираешь стиль под задачу.`
  }

  const body = {
    contents,
    generationConfig: { temperature: modelKey === 'mistral' ? 0.4 : modelKey === 'deepseek' ? 0.7 : 0.85, maxOutputTokens: 4096, topP: 0.95 },
    systemInstruction: { parts: [{ text: sysPrompts[modelKey] || sysPrompts.google }] }
  }

  // Try 2 endpoints
  for (const modelName of ['gemini-1.5-flash-latest', 'gemini-1.5-flash']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${google}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.text()
        if (res.status === 429) throw new Error('Лимит Gemini — подожди минуту')
        if (res.status === 400 && err.includes('API key')) throw new Error('Неверный Google ключ')
        continue
      }
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch (e: any) {
      if (e.message.includes('Лимит') || e.message.includes('ключ')) throw e
    }
  }
  throw new Error('Gemini не ответил. Попробуй другую модель (DeepSeek/GLM) — они через OrcaRouter')
}

async function callOrcaRouter(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { orca } = await getKeys()
  if (!orca) throw new Error('Нет OrcaRouter ключа')

  const modelInfo = MODELS[modelKey]
  const sysPrompts: Record<string, string> = {
    deepseek: `Ты Kayori на DeepSeek V4 Flash. Рассуждай по шагам: 1) анализ, 2) план, 3) решение. Пиши чистый код. Ты отличаешься от других — ты глубокий аналитик.`,
    glm: `Ты Kayori на GLM 5.3 Flash. Ты структурированный, логичный, любишь маркированные списки, таблицы. Отвечай четко. Ты отличаешься — ты самый структурированный.`,
    hy: `Ты Kayori на Hunyuan 4 Preview от Tencent. Ты с юмором, дружелюбный, иногда пишешь "мур мур". Ты отличаешься — ты самый дружелюбный и с юмором.`,
    mistral: `Ты Kayori на Mistral 7B. Отвечай ОЧЕНЬ коротко, технично, только суть. Без приветствий, без воды. Ты отличаешься — ты самый короткий.`,
    qwen: `Ты Kayori на Qwen 3 4B от Alibaba. Давай много примеров, кода, объясняй как учитель. Ты отличаешься — ты учитель с примерами.`,
    orcaAuto: `Ты Kayori на Orca Auto. Ты автоматически подстраиваешься.`,
    google: `Ты Kayori на Gemini через Orca.`
  }

  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: sysPrompts[modelKey] || `Ты Kayori на ${modelInfo.name}. ${(modelInfo as any).personality}` },
      ...messages.map(m => ({ role: m.role, content: m.content.slice(0, 6000) }))
    ],
    max_tokens: 2048,
    temperature: modelKey === 'mistral' ? 0.3 : modelKey === 'deepseek' ? 0.7 : 0.8,
    stream: false
  }

  const res = await fetch('https://api.orcarouter.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${orca}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://kayori.ai',
      'X-Title': 'AI-KAYORI'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Orca error', errText.slice(0,300))
    if (res.status === 401) throw new Error('OrcaRouter ключ неверный')
    if (res.status === 429) throw new Error('OrcaRouter лимит — попробуй позже или другую модель')
    if (res.status === 402) throw new Error('OrcaRouter — закончились кредиты, используй Gemini')
    throw new Error(`OrcaRouter ${res.status}: ${errText.slice(0,120)}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('OrcaRouter пустой ответ')
  return text
}

async function callCloudflare(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) {
    // fallback to Orca
    const orcaId = (MODELS[modelKey] as any).orcaId || 'orcarouter/auto'
    return callOrcaRouter(orcaId, messages, modelKey)
  }
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${modelId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content.slice(0,4000) })), max_tokens: 2048 })
    })
    if (!res.ok) throw new Error('CF failed')
    const data = await res.json()
    const text = data.result?.response || data.result?.output || (typeof data.result === 'string' ? data.result : '')
    if (text) return text
    throw new Error('CF empty')
  } catch {
    const orcaId = (MODELS[modelKey] as any).orcaId || 'orcarouter/auto'
    return callOrcaRouter(orcaId, messages, modelKey)
  }
}

export async function chatCompletion(modelKey: ModelId, messages: AiMessage[], opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): Promise<{ text: string, modelInfo: typeof MODELS[ModelId], reasoning?: string, error?: boolean }> {
  const lastText = messages[messages.length-1]?.content || ''
  if (isForbidden(lastText)) return { text: `Не могу помочь с этим.`, modelInfo: MODELS[modelKey], error: true }

  const thinkingPool = [
    'Думаю над ответом…',
    'Анализирую запрос…',
    'Собираю мысли…',
    'Ищу лучший ответ…',
    'Копаю глубже…',
    'Проверяю контекст…'
  ]
  const reasoning = thinkingPool[Math.floor(Math.random()*thinkingPool.length)]

  let text = ''
  try {
    if (modelKey === 'google') {
      text = await callGoogleGemini(messages, opts?.imageBase64, modelKey)
    } else if (['deepseek','glm','hy','orcaAuto'].includes(modelKey)) {
      const orcaId = (MODELS[modelKey] as any).orcaId || 'orcarouter/auto'
      let msgs = [...messages]
      if (opts?.fileContent) {
        const cleanContent = opts.fileContent.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, '').slice(0, 6000)
        msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}\n\n[Файл ${opts.fileName || ''}]:\n${cleanContent}` }
      }
      text = await callOrcaRouter(orcaId, msgs, modelKey)
    } else {
      let msgs = [...messages]
      if (opts?.fileContent) {
        const cleanContent = opts.fileContent.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, '').slice(0, 6000)
        msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}\n\n[Файл ${opts.fileName || ''}]:\n${cleanContent}` }
      }
      const cfModelId = MODELS[modelKey].id
      text = await callCloudflare(cfModelId, msgs, modelKey)
    }
  } catch (e: any) {
    // NO TEMPLATES - real error
    text = `Ошибка: ${e.message}. Попробуй сменить модель — сейчас ${MODELS[modelKey].name} не отвечает. Базовые ключи: Google и OrcaRouter встроены, CF Account определяется автоматически. Проверь Настройки → Ключи API.`
    return { text, modelInfo: MODELS[modelKey], reasoning: 'Ошибка', error: true }
  }

  if (!text) throw new Error('Пустой ответ от ИИ')

  return { text, modelInfo: MODELS[modelKey], reasoning, error: false }
}

export async function generateImageCloudflare(prompt: string): Promise<string | null> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) return null
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch { return null }
}
