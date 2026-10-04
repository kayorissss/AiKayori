// AI-KAYORI - Real AI Engine (Google Gemini, Cloudflare Workers AI, OpenAI / Groq / OpenRouter)
import { MODELS, ModelId } from './version'
import { getSetting, saveSetting } from './storage'

export interface ApiKeysConfig {
  google: string
  cfAccount: string
  cfToken: string
  openaiKey: string
  openaiUrl: string
  openaiModel: string
}

export type AiMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function getKeys(): Promise<ApiKeysConfig> {
  const customGoogle = (await getSetting<string>('custom-google-key')) || localStorage.getItem('custom-google-key') || ''
  const customCfToken = (await getSetting<string>('custom-cf-token')) || localStorage.getItem('custom-cf-token') || ''
  const customCfAccount = (await getSetting<string>('custom-cf-account')) || localStorage.getItem('custom-cf-account') || ''
  const customOpenaiKey = (await getSetting<string>('custom-openai-key')) || localStorage.getItem('custom-openai-key') || ''
  const customOpenaiUrl = (await getSetting<string>('custom-openai-url')) || localStorage.getItem('custom-openai-url') || 'https://api.openai.com/v1'
  const customOpenaiModel = (await getSetting<string>('custom-openai-model')) || localStorage.getItem('custom-openai-model') || 'gpt-4o-mini'

  const envGoogle = (import.meta as any).env?.VITE_GOOGLE_API_KEY || ''
  const envCfAccount = (import.meta as any).env?.VITE_CF_ACCOUNT_ID || ''
  const envCfToken = (import.meta as any).env?.VITE_CF_API_TOKEN || ''
  const envOpenaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || ''

  return {
    google: customGoogle || envGoogle,
    cfAccount: customCfAccount || envCfAccount,
    cfToken: customCfToken || envCfToken,
    openaiKey: customOpenaiKey || envOpenaiKey,
    openaiUrl: customOpenaiUrl.replace(/\/+$/, ''),
    openaiModel: customOpenaiModel
  }
}

export async function saveKeys(keys: Partial<ApiKeysConfig>) {
  if (keys.google !== undefined) {
    await saveSetting('custom-google-key', keys.google.trim())
    localStorage.setItem('custom-google-key', keys.google.trim())
  }
  if (keys.cfAccount !== undefined) {
    await saveSetting('custom-cf-account', keys.cfAccount.trim())
    localStorage.setItem('custom-cf-account', keys.cfAccount.trim())
  }
  if (keys.cfToken !== undefined) {
    await saveSetting('custom-cf-token', keys.cfToken.trim())
    localStorage.setItem('custom-cf-token', keys.cfToken.trim())
  }
  if (keys.openaiKey !== undefined) {
    await saveSetting('custom-openai-key', keys.openaiKey.trim())
    localStorage.setItem('custom-openai-key', keys.openaiKey.trim())
  }
  if (keys.openaiUrl !== undefined) {
    await saveSetting('custom-openai-url', keys.openaiUrl.trim())
    localStorage.setItem('custom-openai-url', keys.openaiUrl.trim())
  }
  if (keys.openaiModel !== undefined) {
    await saveSetting('custom-openai-model', keys.openaiModel.trim())
    localStorage.setItem('custom-openai-model', keys.openaiModel.trim())
  }
}

// Dynamically discover valid Gemini models for this specific API key
export async function getAvailableGoogleModels(key: string): Promise<string[]> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key.trim()}`)
    if (res.ok) {
      const data = await res.json()
      const models: any[] = data.models || []
      const supported = models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''))
      if (supported.length > 0) return supported
    }
  } catch {}
  return [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro'
  ]
}

// Key verification tests
export async function testGoogleKey(key: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = key.trim()
  if (!trimmed) return { ok: false, message: 'Ключ пустой' }

  try {
    // 1. First test using list models (validates key validity and gets supported model list)
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`)
    const listData = await listRes.json()

    if (!listRes.ok) {
      const err = listData.error?.message || `Ошибка HTTP ${listRes.status}`
      return { ok: false, message: err }
    }

    const available = (listData.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace(/^models\//, ''))

    const testModel =
      available.find((m: string) => m.includes('1.5-flash') || m.includes('flash') || m.includes('2.0')) ||
      available[0] ||
      'gemini-1.5-flash-latest'

    // 2. Perform a test completion with the discovered model
    const testEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${trimmed}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${trimmed}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${trimmed}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${trimmed}`
    ]

    for (const url of testEndpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Ответь словом "ОК"' }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        })
        const data = await res.json()
        if (res.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ОК'
          return {
            ok: true,
            message: `Подключено! Модель: ${testModel}. Ответ: ${text.trim()}`
          }
        }
      } catch {}
    }

    return {
      ok: true,
      message: `Ключ подтвержден! Доступно моделей: ${available.length} (${testModel})`
    }
  } catch (e: any) {
    return { ok: false, message: e.message || 'Ошибка сети' }
  }
}

export async function testOpenAIKey(
  key: string,
  baseUrl: string = 'https://api.openai.com/v1',
  model: string = 'gpt-4o-mini'
): Promise<{ ok: boolean; message: string }> {
  const trimmed = key.trim()
  if (!trimmed) return { ok: false, message: 'Ключ пустой' }
  const cleanUrl = baseUrl.trim().replace(/\/+$/, '')
  try {
    const res = await fetch(`${cleanUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trimmed}`
      },
      body: JSON.stringify({
        model: model.trim() || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Ответь "ОК"' }],
        max_tokens: 10
      })
    })
    const data = await res.json()
    if (!res.ok) {
      const err = data.error?.message || `Ошибка HTTP ${res.status}`
      return { ok: false, message: err }
    }
    const text = data.choices?.[0]?.message?.content || 'Подключено'
    return { ok: true, message: `Успешно! Ответ модели: ${text.trim()}` }
  } catch (e: any) {
    return { ok: false, message: e.message || 'Ошибка сети' }
  }
}

export async function testCloudflareKey(account: string, token: string): Promise<{ ok: boolean; message: string }> {
  const acc = account.trim()
  const tok = token.trim()
  if (!acc || !tok) return { ok: false, message: 'Укажите Account ID и API Token' }
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tok}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10
      })
    })
    const data = await res.json()
    if (!res.ok || data.success === false) {
      const err = data.errors?.[0]?.message || data.error || `Ошибка HTTP ${res.status}`
      return { ok: false, message: err }
    }
    const text = data.result?.response || 'Подключено'
    return { ok: true, message: `Успешно! Ответ: ${String(text).slice(0, 50)}` }
  } catch (e: any) {
    return { ok: false, message: e.message || 'Ошибка сети' }
  }
}

function isForbiddenQuery(text: string): boolean {
  return /(детская порнография|child porn|cp\s)/i.test(text)
}

function prepareGeminiContents(messages: AiMessage[], imageBase64?: string) {
  const filtered = messages.filter(m => m.role !== 'system')
  const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = []

  for (let i = 0; i < filtered.length; i++) {
    const msg = filtered[i]
    const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user'

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts.push({ text: msg.content })
    } else {
      contents.push({
        role,
        parts: [{ text: msg.content || ' ' }]
      })
    }
  }

  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Привет' }] })
  }

  if (imageBase64 && contents.length > 0) {
    let lastUserIndex = -1
    for (let i = contents.length - 1; i >= 0; i--) {
      if (contents[i].role === 'user') {
        lastUserIndex = i
        break
      }
    }
    if (lastUserIndex !== -1) {
      let mimeType = 'image/jpeg'
      let base64Data = imageBase64
      if (imageBase64.startsWith('data:')) {
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          mimeType = matches[1]
          base64Data = matches[2]
        }
      }
      contents[lastUserIndex].parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      })
    }
  }

  return contents
}

export async function callGoogleGemini(
  modelId: string,
  messages: AiMessage[],
  imageBase64?: string
): Promise<string> {
  const { google } = await getKeys()
  if (!google) {
    throw new Error(
      'MISSING_GOOGLE_KEY: Не указан API ключ Google Gemini. Перейдите в «Настройки» → «API Ключи» и вставьте ваш ключ Google AI Studio (он бесплатный: https://aistudio.google.com/app/apikey).'
    )
  }

  const contents = prepareGeminiContents(messages, imageBase64)
  const isPro = modelId.includes('pro')

  // List of fallback candidates so 404 never occurs
  const candidateModels = isPro
    ? ['gemini-1.5-pro-latest', 'gemini-1.5-pro', 'gemini-1.5-pro-002', 'gemini-1.5-pro-001', 'gemini-pro']
    : ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-002', 'gemini-1.5-flash-001', 'gemini-pro']

  const candidateUrls: string[] = []
  for (const m of candidateModels) {
    candidateUrls.push(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${google}`)
    candidateUrls.push(`https://generativelanguage.googleapis.com/v1/models/${m}:generateContent?key=${google}`)
  }

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096
    },
    systemInstruction: {
      parts: [
        {
          text: 'Ты Kayori — умный, дружелюбный и компетентный AI ассистент. Отвечай подробно, по делу, грамотно оформляй код в markdown с указанием языка. Помогай пользователю решать реальные задачи.'
        }
      ]
    }
  }

  let lastErrorMsg = ''

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        lastErrorMsg = data.error?.message || `HTTP ${res.status}`
        // If 404 (model not found for this version), try next candidate URL
        if (res.status === 404 || lastErrorMsg.includes('not found')) {
          continue
        }
        if (res.status === 400 && lastErrorMsg.includes('API key not valid')) {
          throw new Error('INVALID_GOOGLE_KEY: Введённый API ключ Google Gemini недействителен. Проверьте ключ в Настройках.')
        }
        if (res.status === 429) {
          throw new Error('QUOTA_EXCEEDED: Превышен лимит запросов к Google Gemini API. Попробуйте через минуту.')
        }
        throw new Error(`Ошибка Google Gemini: ${lastErrorMsg}`)
      }

      const candidate = data.candidates?.[0]
      if (candidate?.finishReason === 'SAFETY') {
        return 'Запрос заблокирован фильтром безопасности Google Gemini.'
      }

      const text = candidate?.content?.parts?.[0]?.text
      if (text) return text
    } catch (e: any) {
      if (e.message?.startsWith('INVALID_GOOGLE_KEY') || e.message?.startsWith('QUOTA_EXCEEDED')) {
        throw e
      }
      lastErrorMsg = e.message || lastErrorMsg
    }
  }

  throw new Error(`Не удалось получить ответ от Google Gemini: ${lastErrorMsg}`)
}

export async function callOpenAICompatible(
  messages: AiMessage[],
  opts?: { imageBase64?: string; fileContent?: string; fileName?: string }
): Promise<{ text: string; reasoning?: string }> {
  const { openaiKey, openaiUrl, openaiModel } = await getKeys()
  if (!openaiKey) {
    throw new Error(
      'MISSING_OPENAI_KEY: Не указан API ключ для OpenAI-совместимого провайдера (Groq, OpenAI, OpenRouter, DeepSeek). Укажите его в «Настройках» → «API Ключи».'
    )
  }

  const formattedMessages: any[] = []

  formattedMessages.push({
    role: 'system',
    content:
      'Ты Kayori — профессиональный, полезный AI ассистент. Отвечай информативно, логично и вежливо. Используй красивый Markdown с разметкой для кода.'
  })

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (m.role === 'system') continue

    if (i === messages.length - 1 && m.role === 'user' && (opts?.imageBase64 || opts?.fileContent)) {
      if (opts.imageBase64) {
        formattedMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: m.content || 'Что на этом изображении?' },
            {
              type: 'image_url',
              image_url: {
                url: opts.imageBase64.startsWith('data:') ? opts.imageBase64 : `data:image/jpeg;base64,${opts.imageBase64}`
              }
            }
          ]
        })
      } else if (opts.fileContent) {
        formattedMessages.push({
          role: 'user',
          content: `${m.content}\n\n[Прикрепленный файл: ${opts.fileName || 'file'}]:\n${opts.fileContent.slice(0, 12000)}`
        })
      }
    } else {
      formattedMessages.push({
        role: m.role,
        content: m.content
      })
    }
  }

  const res = await fetch(`${openaiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: openaiModel || 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  const data = await res.json()

  if (!res.ok) {
    const errMsg = data.error?.message || data.message || `HTTP ${res.status}`
    throw new Error(`Ошибка API (${openaiModel}): ${errMsg}`)
  }

  const choice = data.choices?.[0]
  const text = choice?.message?.content || ''
  const reasoning = choice?.message?.reasoning_content || undefined

  if (!text && !reasoning) {
    throw new Error('Модель вернула пустой ответ.')
  }

  return { text: text || (reasoning ? 'Размышления завершены.' : ''), reasoning }
}

export async function callCloudflare(modelId: string, messages: AiMessage[]): Promise<string> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) {
    throw new Error(
      'MISSING_CLOUDFLARE_CREDENTIALS: Для работы моделей Cloudflare укажите Account ID и API Token в Настройках, либо используйте Google Gemini или OpenAI/Groq.'
    )
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${modelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 3072
    })
  })

  const data = await res.json()

  if (!res.ok || data.success === false) {
    const err = data.errors?.[0]?.message || data.error || `HTTP ${res.status}`
    throw new Error(`Ошибка Cloudflare Workers AI: ${err}`)
  }

  const text = data.result?.response || data.result?.output || (typeof data.result === 'string' ? data.result : '')
  if (!text) {
    throw new Error('Cloudflare AI вернул пустой результат.')
  }
  return text
}

export async function chatCompletion(
  modelKey: ModelId,
  messages: AiMessage[],
  opts?: { imageBase64?: string; fileContent?: string; fileName?: string }
): Promise<{ text: string; modelInfo: (typeof MODELS)[ModelId]; reasoning?: string }> {
  const lastText = messages[messages.length - 1]?.content || ''
  if (isForbiddenQuery(lastText)) {
    return {
      text: 'Извините, я не могу обработать данный запрос, так как он нарушает политику безопасности.',
      modelInfo: MODELS[modelKey]
    }
  }

  const keys = await getKeys()

  let msgs = [...messages]
  if (opts?.fileContent && modelKey !== 'custom' && modelKey !== 'google' && modelKey !== 'geminiPro') {
    msgs[msgs.length - 1] = {
      ...msgs[msgs.length - 1],
      content: `${msgs[msgs.length - 1].content}\n\n[Файл: ${opts.fileName || ''}]:\n${opts.fileContent.slice(0, 8000)}`
    }
  }

  let text = ''
  let reasoning: string | undefined = undefined

  if (modelKey === 'google' || modelKey === 'geminiPro') {
    if (!keys.google && keys.openaiKey) {
      const res = await callOpenAICompatible(messages, opts)
      return {
        text: `> *Ответ получен через ${keys.openaiModel || 'OpenAI API'} (ключ Google Gemini не был указан)*\n\n${res.text}`,
        modelInfo: MODELS[modelKey],
        reasoning: res.reasoning
      }
    }
    const modelConfig = MODELS[modelKey]
    text = await callGoogleGemini(modelConfig.id, msgs, opts?.imageBase64)
  } else if (modelKey === 'custom') {
    const res = await callOpenAICompatible(messages, opts)
    text = res.text
    reasoning = res.reasoning
  } else {
    if ((!keys.cfAccount || !keys.cfToken) && keys.google) {
      text = await callGoogleGemini('gemini-1.5-flash-latest', msgs, opts?.imageBase64)
    } else if ((!keys.cfAccount || !keys.cfToken) && keys.openaiKey) {
      const res = await callOpenAICompatible(messages, opts)
      text = res.text
      reasoning = res.reasoning
    } else {
      const cfModelId = MODELS[modelKey].id
      text = await callCloudflare(cfModelId, msgs)
    }
  }

  return { text, modelInfo: MODELS[modelKey], reasoning }
}

export async function generateImageCloudflare(prompt: string): Promise<string | null> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) return null
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      }
    )
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}
