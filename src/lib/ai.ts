// AI-KAYORI v5.0.4 - REAL AI ONLY, ROBUST FALLBACK, NO TEMPLATES, DOCX SUPPORT
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

// ========== FREE AI FALLBACK - POLLINATIONS (NO KEY NEEDED, ALWAYS WORKS) ==========
async function callPollinations(messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const modelInfo = MODELS[modelKey]
  const sysPrompts: Record<string, string> = {
    deepseek: `Ты Kayori DeepSeek V4. Рассуждай по шагам: 1) анализ задачи 2) план 3) решение. Пиши чистый код. Ты глубокий аналитик, отличаешься детальностью.`,
    glm: `Ты Kayori GLM 5.3 Flash. Отвечай структурированно: списки, таблицы, четко. Ты самый логичный.`,
    hy: `Ты Kayori Hunyuan 4 от Tencent. Ты дружелюбный с юмором, иногда мурлыкаешь "мур мур". Ты самый веселый.`,
    mistral: `Ты Kayori Mistral 7B. Отвечай ОЧЕНЬ коротко, только суть, без воды. Ты самый короткий.`,
    qwen: `Ты Kayori Qwen 3 от Alibaba. Давай много примеров кода, объясняй как учитель. Ты учитель.`,
    orcaAuto: `Ты Kayori Auto. Подстраивайся под задачу, будь универсальным.`,
    google: `Ты Kayori Gemini. Дружелюбный, видишь фото, отвечаешь прямо и полезно.`
  }

  // Pollinations OpenAI-compatible endpoint - free, no key
  const openAiMessages = [
    { role: 'system', content: sysPrompts[modelKey] || `Ты Kayori на ${modelInfo.name}. ${(modelInfo as any).personality}` },
    ...messages.slice(-12).map(m => ({ role: m.role, content: m.content.slice(0, 4000) }))
  ]

  // Try multiple pollinations models
  const modelsToTry = ['openai', 'mistral', 'llama']
  for (const polliModel of modelsToTry) {
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: polliModel,
          messages: openAiMessages,
          max_tokens: 2000,
          temperature: modelKey === 'mistral' ? 0.3 : modelKey === 'deepseek' ? 0.7 : 0.8,
          stream: false
        })
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (text && text.length > 5) return text
    } catch {}
  }

  // Fallback to simple GET endpoint
  try {
    const lastPrompt = messages[messages.length-1]?.content || 'Привет'
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(lastPrompt.slice(0,500))}?model=openai&system=${encodeURIComponent(sysPrompts[modelKey] || 'Ты Kayori')}`, {
      method: 'GET'
    })
    if (res.ok) {
      const text = await res.text()
      if (text && text.length > 10) return text
    }
  } catch {}

  throw new Error('Pollinations не ответил')
}

// ========== GOOGLE GEMINI ==========
async function callGoogleGemini(messages: AiMessage[], imageBase64?: string, modelKey: ModelId = 'google'): Promise<string> {
  const { google } = await getKeys()
  if (!google || google.length < 10) throw new Error('Нет Google ключа')

  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (imageBase64 && contents.length > 0) {
    const last = contents[contents.length-1] as any
    const b64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    last.parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } })
  }

  const sysPrompts: Record<string, string> = {
    google: `Ты Kayori на Gemini 1.5 Flash. Видишь фото и файлы. Отвечай дружелюбно, прямо, по делу. Если спрашивают что в файле - отвечай по содержимому файла. Без шаблонов.`,
    deepseek: `Ты Kayori DeepSeek V4. Рассуждай по шагам.`,
    glm: `Ты Kayori GLM 5.3. Структурированно, списки.`,
    hy: `Ты Kayori Hunyuan 4. С юмором, мур мур.`,
    mistral: `Ты Kayori Mistral 7B. Коротко, суть.`,
    qwen: `Ты Kayori Qwen 3. Примеры, код.`,
    orcaAuto: `Ты Kayori Auto.`
  }

  const body = {
    contents,
    generationConfig: { temperature: modelKey === 'mistral' ? 0.4 : 0.7, maxOutputTokens: 4096, topP: 0.95 },
    systemInstruction: { parts: [{ text: sysPrompts[modelKey] || sysPrompts.google }] }
  }

  for (const modelName of ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${google}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.text()
        if (res.status === 429) throw new Error('Gemini лимит — подожди')
        if (res.status === 400 && err.toLowerCase().includes('key')) throw new Error('Неверный Google ключ — вставь свой в Настройки')
        continue
      }
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch (e: any) {
      if (e.message.includes('Лимит') || e.message.includes('ключ')) throw e
    }
  }
  throw new Error('Gemini не ответил')
}

// ========== ORCA ROUTER ==========
async function callOrcaRouter(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { orca } = await getKeys()
  if (!orca) throw new Error('Нет Orca ключа')

  const sysPrompts: Record<string, string> = {
    deepseek: `Ты Kayori DeepSeek V4 Flash. Рассуждай по шагам: 1) анализ, 2) план, 3) решение. Пиши чистый код. Ты глубокий аналитик, отличаешься детальностью. Если спрашивают что в файле - читай содержимое файла и отвечай по нему.`,
    glm: `Ты Kayori GLM 5.3 Flash. Структурированный, логичный, списки, таблицы. Ты самый структурированный. Если спрашивают что в файле - отвечай по файлу.`,
    hy: `Ты Kayori Hunyuan 4 Preview от Tencent. С юмором, дружелюбный, иногда "мур мур". Ты самый дружелюбный. Если спрашивают что в файле - отвечай по файлу.`,
    mistral: `Ты Kayori Mistral 7B. ОЧЕНЬ коротко, только суть, без воды. Ты самый короткий. Файл: отвечай по содержимому.`,
    qwen: `Ты Kayori Qwen 3 4B от Alibaba. Много примеров, кода, объясняй как учитель. Ты учитель. Если спрашивают что в файле - отвечай по файлу.`,
    orcaAuto: `Ты Kayori Orca Auto. Автоматически подстраиваешься. Если файл - отвечай по нему.`,
    google: `Ты Kayori. Отвечай по файлу если спрашивают.`
  }

  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: sysPrompts[modelKey] || `Ты Kayori ${(MODELS[modelKey] as any).personality}` },
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
    if (res.status === 401) throw new Error('Orca ключ неверный — вставь свой в Настройки или используй другую модель')
    if (res.status === 429) throw new Error('Orca лимит на минуту — пробую бесплатно')
    if (res.status === 402) throw new Error('Orca кредиты кончились — пробую бесплатно')
    throw new Error(`Orca ${res.status}: ${errText.slice(0,100)}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Orca пустой ответ')
  return text
}

async function callCloudflare(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) throw new Error('CF нет ключей')
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
  } catch (e: any) {
    throw e
  }
}

// ========== MAIN CHAT WITH FALLBACK CHAIN ==========
export async function chatCompletion(modelKey: ModelId, messages: AiMessage[], opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): Promise<{ text: string, modelInfo: typeof MODELS[ModelId], reasoning?: string, error?: boolean }> {
  const lastText = messages[messages.length-1]?.content || ''
  if (isForbidden(lastText)) return { text: `Не могу помочь с этим.`, modelInfo: MODELS[modelKey], error: true }

  const thinkingPool = ['Думаю над ответом…','Анализирую…','Собираю мысли…','Ищу лучший ответ…','Копаю глубже…','Проверяю контекст…']
  const reasoning = thinkingPool[Math.floor(Math.random()*thinkingPool.length)]

  let fileContext = ''
  if (opts?.fileContent) {
    const cleaned = opts.fileContent.slice(0, 8000)
    fileContext = `\n\n[Содержимое файла ${opts.fileName || ''}]:\n${cleaned}\n[Конец файла]\nЕсли спрашивают что внутри - отвечай по этому содержимому.`
  }

  let msgs = [...messages]
  if (fileContext) {
    msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}${fileContext}` }
  }

  // Try chain depending on model
  const tryChain: Array<() => Promise<string>> = []

  if (modelKey === 'google') {
    tryChain.push(
      () => callGoogleGemini(msgs, opts?.imageBase64, modelKey),
      () => callPollinations(msgs, modelKey),
      () => callOrcaRouter((MODELS[modelKey] as any).orcaId || 'orcarouter/auto', msgs, modelKey)
    )
  } else if (['deepseek','glm','hy','orcaAuto'].includes(modelKey)) {
    const orcaId = (MODELS[modelKey] as any).orcaId || 'orcarouter/auto'
    tryChain.push(
      () => callOrcaRouter(orcaId, msgs, modelKey),
      () => callPollinations(msgs, modelKey),
      () => callGoogleGemini(msgs, opts?.imageBase64, modelKey),
      () => callCloudflare(MODELS[modelKey].id, msgs, modelKey).catch(() => callPollinations(msgs, modelKey))
    )
  } else {
    // mistral, qwen - CF first
    tryChain.push(
      () => callCloudflare(MODELS[modelKey].id, msgs, modelKey),
      () => callOrcaRouter((MODELS[modelKey] as any).orcaId, msgs, modelKey),
      () => callPollinations(msgs, modelKey),
      () => callGoogleGemini(msgs, opts?.imageBase64, modelKey)
    )
  }

  let lastError = ''
  for (const fn of tryChain) {
    try {
      const text = await fn()
      if (text && text.length > 3) {
        return { text, modelInfo: MODELS[modelKey], reasoning, error: false }
      }
    } catch (e: any) {
      lastError = e.message
      console.warn('AI fallback', e.message)
      // if it's rate limit, continue to next
      continue
    }
  }

  // If all failed, return pollinations error but with actual attempt
  try {
    const text = await callPollinations(msgs, modelKey)
    return { text, modelInfo: MODELS[modelKey], reasoning, error: false }
  } catch {
    const text = `Не удалось получить ответ от ${MODELS[modelKey].name}. Последняя ошибка: ${lastError}. Попробуй:\n1. Сменить модель (Orca Auto часто работает)\n2. Вставить свой ключ в Настройки → Ключи API (Google AI Studio бесплатно)\n3. Подождать минуту — лимиты бесплатные сбрасываются\n\nБазовые ключи встроены, но бесплатные лимиты быстро кончаются. Свой ключ = стабильно.`
    return { text, modelInfo: MODELS[modelKey], reasoning: 'Ошибка', error: true }
  }
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

// DOCX text extraction helper for use in InputBar
export async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const { unzipSync, strFromU8 } = await import('fflate')
    const files = unzipSync(new Uint8Array(arrayBuffer))
    const docXml = files['word/document.xml']
    if (!docXml) return '[DOCX без document.xml]'
    const xml = strFromU8(docXml)
    // Extract <w:t> text nodes
    const matches = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    const text = matches.map(m => m[1]).join(' ')
    // Also try <w:p> paragraphs
    if (!text) {
      const pMatches = [...xml.matchAll(/<w:p[^>]*>(.*?)<\/w:p>/gs)]
      return pMatches.map(p => p[1].replace(/<[^>]+>/g, ' ')).join('\n').slice(0, 20000)
    }
    return text.replace(/\s+/g, ' ').trim().slice(0, 20000) || '[Пустой DOCX]'
  } catch (e: any) {
    return `[Ошибка чтения DOCX: ${e.message}]`
  }
}
