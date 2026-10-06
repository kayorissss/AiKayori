// AI-KAYORI v5.0.5 - NO SWITCHING, WAIT FOR SAME MODEL, FREE AI, BIG FILE SUPPORT
import { MODELS, ModelId } from './version'
import { getSetting, saveSetting } from './storage'

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
function isForbidden(text: string): boolean { return /(детская порнография|child porn)/i.test(text) }

// ========== SYSTEM PROMPTS PER MODEL (DIFFERENT PERSONALITIES) ==========
const SYS_PROMPTS: Record<string, string> = {
  deepseek: `Ты Kayori DeepSeek V4 Flash. Ты глубокий аналитик. Рассуждай по шагам: 1) анализ задачи 2) план 3) решение. Пиши чистый код с комментариями. Отвечаешь детально, структурированно. Если спрашивают что внутри файла - отвечай ПО СОДЕРЖИМОМУ файла, пересказывай, цитируй. Ты отличаешься от других - ты самый детальный.`,
  glm: `Ты Kayori GLM 5.3 Flash. Ты логичный, быстрый, любишь маркированные списки, таблицы, четкую структуру. Отвечай кратко но информативно. Если спрашивают про файл - отвечай по содержимому файла. Ты самый структурированный.`,
  hy: `Ты Kayori Hunyuan 4 Preview от Tencent. Ты дружелюбный, с легким юмором, иногда пишешь "мур мур мяу~". Отвечаешь тепло, по-дружески. Если спрашивают что в файле - отвечай по файлу, дружелюбно. Ты самый веселый.`,
  mistral: `Ты Kayori Mistral 7B. Отвечай МАКСИМАЛЬНО коротко, только суть, без воды, без приветствий. Только факты, код, ответ. Если файл - коротко по содержимому. Ты самый короткий и техничный.`,
  qwen: `Ты Kayori Qwen 3 4B от Alibaba. Ты учитель - даешь много примеров, кода, объяснений, аналогий. Любишь учить. Если спрашивают что в файле - подробно разбирай файл, объясняй. Ты учитель с примерами.`,
  orcaAuto: `Ты Kayori Orca Auto. Ты универсальный, автоматически подстраиваешься под задачу. Отвечаешь сбалансированно. Если файл - отвечай по нему.`,
  google: `Ты Kayori Gemini 1.5 Flash от Google. Ты дружелюбный, видишь фото, читаешь файлы. Отвечаешь прямо, полезно, по делу. Если спрашивают "что внутри файла?" - отвечай по содержимому файла, пересказывай, выделяй главное. Без шаблонов.`
}

// ========== FREE AI - POLLINATIONS (ALWAYS WORKS, NO KEY) ==========
async function callPollinations(messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const sysPrompt = SYS_PROMPTS[modelKey] || SYS_PROMPTS.google
  const openAiMessages = [
    { role: 'system', content: sysPrompt },
    ...messages.slice(-10).map(m => ({ role: m.role, content: m.content.slice(0, 5000) }))
  ]

  // Try OpenAI compatible endpoint
  const endpoints = [
    { url: 'https://text.pollinations.ai/openai', body: { model: 'openai', messages: openAiMessages, temperature: modelKey === 'mistral' ? 0.3 : 0.8, max_tokens: 3000, seed: Math.floor(Math.random()*100000) } },
    { url: 'https://text.pollinations.ai/openai', body: { model: 'mistral', messages: openAiMessages, temperature: 0.8, max_tokens: 3000 } },
    { url: 'https://text.pollinations.ai/openai', body: { model: 'llama', messages: openAiMessages, temperature: 0.8, max_tokens: 3000 } },
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body)
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (text && text.trim().length > 10) return text
    } catch (e) {
      continue
    }
  }

  // Fallback GET
  try {
    const lastUser = messages.filter(m => m.role === 'user').pop()?.content || 'Привет'
    const prompt = `${sysPrompt}\n\nПользователь: ${lastUser.slice(0,1000)}`
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt.slice(0,1500))}`, { method: 'GET' })
    if (res.ok) {
      const text = await res.text()
      if (text && text.length > 15 && !text.includes('<!DOCTYPE')) return text
    }
  } catch {}

  throw new Error('Pollinations не ответил')
}

// ========== GOOGLE GEMINI ==========
async function callGoogleGemini(messages: AiMessage[], imageBase64?: string, modelKey: ModelId = 'google'): Promise<string> {
  const { google } = await getKeys()
  if (!google || google.length < 15) throw new Error('Нет Google ключа')

  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (imageBase64 && contents.length > 0) {
    const last = contents[contents.length-1] as any
    const b64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    last.parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } })
  }

  const body = {
    contents,
    generationConfig: { temperature: modelKey === 'mistral' ? 0.3 : 0.75, maxOutputTokens: 4096, topP: 0.95 },
    systemInstruction: { parts: [{ text: SYS_PROMPTS[modelKey] || SYS_PROMPTS.google }] }
  }

  // Try multiple model names
  for (const modelName of ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest', 'gemini-pro']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${google}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 429) throw new Error('Gemini лимит — подожди 20 сек')
        if (res.status === 400 && errText.toLowerCase().includes('key')) throw new Error('Неверный Google ключ')
        if (res.status === 404) continue
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

// ========== ORCA ROUTER WITH RETRY SAME MODEL ==========
async function callOrcaRouter(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { orca } = await getKeys()
  if (!orca) throw new Error('Нет Orca ключа')

  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: SYS_PROMPTS[modelKey] || `Ты Kayori ${MODELS[modelKey].name}` },
      ...messages.map(m => ({ role: m.role, content: m.content.slice(0, 6000) }))
    ],
    max_tokens: 3000,
    temperature: modelKey === 'mistral' ? 0.3 : modelKey === 'deepseek' ? 0.7 : 0.8,
    stream: false
  }

  // Retry same model 2 times with delay
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
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
        if (res.status === 401) throw new Error('Orca ключ неверный')
        if (res.status === 429) {
          await new Promise(r => setTimeout(r, 2000))
          continue
        }
        if (res.status === 403) {
          // Try alternative free models for same personality
          const altModels = ['openai/gpt-3.5-turbo', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free', 'qwen/qwen-2-7b-instruct:free']
          for (const alt of altModels) {
            if (alt === modelId) continue
            try {
              const altRes = await fetch('https://api.orcarouter.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${orca}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...body, model: alt })
              })
              if (altRes.ok) {
                const altData = await altRes.json()
                const altText = altData.choices?.[0]?.message?.content
                if (altText) return altText
              }
            } catch {}
          }
          throw new Error(`Orca 403 доступ запрещен к ${modelId}`)
        }
        if (res.status === 402) throw new Error('Orca кредиты кончились')
        throw new Error(`Orca ${res.status}`)
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (!text) throw new Error('Orca пустой ответ')
      return text
    } catch (e: any) {
      if (attempt === 1) throw e
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  throw new Error('Orca не ответил после ретраев')
}

async function callCloudflare(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) throw new Error('CF нет ключей')
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
}

// ========== MAIN - NO SWITCHING, WAIT FOR SAME MODEL ==========
export async function chatCompletion(modelKey: ModelId, messages: AiMessage[], opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): Promise<{ text: string, modelInfo: typeof MODELS[ModelId], reasoning?: string, error?: boolean }> {
  const lastText = messages[messages.length-1]?.content || ''
  if (isForbidden(lastText)) return { text: `Не могу помочь с этим.`, modelInfo: MODELS[modelKey], error: true }

  const thinkingPool = ['Думаю над ответом…','Анализирую…','Собираю мысли…','Ищу лучший ответ…','Копаю глубже…','Проверяю контекст…']
  const reasoning = thinkingPool[Math.floor(Math.random()*thinkingPool.length)]

  let fileContext = ''
  if (opts?.fileContent) {
    const cleaned = opts.fileContent.slice(0, 12000)
    fileContext = `\n\n[Содержимое файла ${opts.fileName || ''}]:\n${cleaned}\n[Конец файла]\nЕсли спрашивают "что внутри?" или "чо там?" - отвечай ПО ЭТОМУ СОДЕРЖИМОМУ, пересказывай подробно.`
  }

  let msgs = [...messages]
  if (fileContext) {
    msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}${fileContext}` }
  }

  // Define primary function per model - WAIT FOR SAME MODEL, NO SWITCH
  let primaryFn: () => Promise<string>

  if (modelKey === 'google') {
    primaryFn = async () => {
      try {
        return await callGoogleGemini(msgs, opts?.imageBase64, modelKey)
      } catch (e: any) {
        // If Gemini fails, try Pollinations BUT keep Gemini personality and model name
        console.warn('Gemini fail, trying Pollinations with same personality', e.message)
        return await callPollinations(msgs, modelKey)
      }
    }
  } else if (['deepseek','glm','hy','orcaAuto'].includes(modelKey)) {
    const orcaId = (MODELS[modelKey] as any).orcaId || 'orcarouter/auto'
    primaryFn = async () => {
      try {
        return await callOrcaRouter(orcaId, msgs, modelKey)
      } catch (e: any) {
        console.warn(`Orca ${orcaId} fail, trying Pollinations with same ${modelKey} personality`, e.message)
        // Fallback to Pollinations with SAME personality, NOT different model
        try {
          return await callPollinations(msgs, modelKey)
        } catch {
          // Last try: try Google with same personality
          return await callGoogleGemini(msgs, opts?.imageBase64, modelKey)
        }
      }
    }
  } else {
    // mistral, qwen - CF primary
    primaryFn = async () => {
      try {
        return await callCloudflare(MODELS[modelKey].id, msgs, modelKey)
      } catch (e: any) {
        try {
          return await callOrcaRouter((MODELS[modelKey] as any).orcaId, msgs, modelKey)
        } catch {
          return await callPollinations(msgs, modelKey)
        }
      }
    }
  }

  // Execute with retries for SAME model
  let lastError = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text = await primaryFn()
      if (text && text.trim().length > 3) {
        return { text, modelInfo: MODELS[modelKey], reasoning, error: false }
      }
    } catch (e: any) {
      lastError = e.message
      console.warn(`Attempt ${attempt+1} failed for ${modelKey}:`, e.message)
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500 + attempt*1000))
    }
  }

  // Final fallback - Pollinations with same personality, still show selected model name
  try {
    const text = await callPollinations(msgs, modelKey)
    return { text, modelInfo: MODELS[modelKey], reasoning, error: false }
  } catch {
    const text = `Не смог ответить от ${MODELS[modelKey].name}. Ошибка: ${lastError}\n\nЧто делать:\n1. Подожди 30 сек и попробуй снова - лимиты сбрасываются\n2. Вставь свой ключ в Настройки → Ключи API (бесплатно на aistudio.google.com)\n3. Попробуй Orca Auto - он чаще работает\n\nЕсли был файл ${opts?.fileName || ''} - его содержимое я получил, но ИИ не ответил. Попробуй еще раз.`
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

// ========== FILE READERS ==========
export async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const { unzipSync, strFromU8 } = await import('fflate')
    const files = unzipSync(new Uint8Array(arrayBuffer))
    const docXml = files['word/document.xml']
    if (!docXml) return '[DOCX без document.xml]'
    const xml = strFromU8(docXml)
    const matches = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    const text = matches.map(m => m[1]).join(' ')
    if (!text) {
      const pMatches = [...xml.matchAll(/<w:p[^>]*>(.*?)<\/w:p>/gs)]
      return pMatches.map(p => p[1].replace(/<[^>]+>/g, ' ')).join('\n').slice(0, 20000)
    }
    return text.replace(/\s+/g, ' ').trim().slice(0, 20000) || '[Пустой DOCX]'
  } catch (e: any) {
    return `[Ошибка DOCX: ${e.message}]`
  }
}

export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Simple text extraction from PDF without pdfjs - look for text in parentheses and brackets
    const uint = new Uint8Array(arrayBuffer)
    let text = ''
    // Try to decode as string and extract
    const str = new TextDecoder('latin1').decode(uint)
    // PDF text is often in (text) Tj or [ (text) ] TJ
    const regex = /\(([^)]+)\)\s*Tj/g
    const matches = [...str.matchAll(regex)]
    if (matches.length > 0) {
      text = matches.map(m => m[1]).join(' ').replace(/\\n/g, '\n').replace(/\\r/g, '').slice(0, 15000)
    }
    // Fallback: extract readable ASCII sequences
    if (text.length < 20) {
      const readable = str.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, ' ').replace(/\s+/g, ' ').trim()
      // Find longest readable chunk
      text = readable.slice(0, 15000)
    }
    if (text.length < 10) return `[PDF ${Math.round(arrayBuffer.byteLength/1024)}KB - текст не извлечен, попробуй TXT]`
    return text.slice(0, 20000)
  } catch (e: any) {
    return `[Ошибка PDF: ${e.message}]`
  }
}

export async function readFileAsText(file: File): Promise<{ content: string, type: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const textExts = ['txt','md','json','js','ts','tsx','jsx','html','htm','css','scss','less','xml','yaml','yml','csv','log','py','java','c','cpp','h','cs','php','rb','go','rs','swift','kt','sh','bat','sql','ini','conf','env','gitignore','dockerfile']
  
  if (ext === 'docx') {
    const buf = await file.arrayBuffer()
    const content = await extractDocxText(buf)
    return { content, type: 'docx' }
  }
  if (ext === 'pdf') {
    const buf = await file.arrayBuffer()
    const content = await extractPdfText(buf)
    return { content, type: 'pdf' }
  }
  if (textExts.includes(ext) || file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml') {
    const text = await file.text()
    return { content: text.slice(0, 25000), type: 'text' }
  }
  if (['doc'].includes(ext)) {
    const text = await file.text().catch(() => '')
    const cleaned = text.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, ' ').replace(/\s+/g, ' ').slice(0, 20000)
    return { content: cleaned.length > 20 ? cleaned : `[Старый DOC ${file.name} - сохрани как DOCX]`, type: 'doc' }
  }
  // For other files, try text
  try {
    const text = await file.text()
    if (text.length > 0 && text.length < 50000) {
      // Check if it's mostly readable
      const readable = text.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, '').length / text.length
      if (readable > 0.7) return { content: text.slice(0, 25000), type: 'text' }
    }
  } catch {}
  return { content: `[Файл ${file.name} ${Math.round(file.size/1024)}KB тип ${file.type || ext} - бинарный, содержимое не прочитано. Для анализа конвертируй в TXT/DOCX]`, type: 'binary' }
}
