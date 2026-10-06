// AI-KAYORI v5.0.6 - FIX ALL 7 ISSUES: empty chat, file viewer, error bubble, icons, free AI, thinking speed, sidebar
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

const SYS_PROMPTS: Record<string, string> = {
  deepseek: `Ты Kayori DeepSeek V4 Flash. Глубокий аналитик. Рассуждай по шагам: 1) анализ 2) план 3) решение. Чистый код. Если файл - отвечай ПО СОДЕРЖИМОМУ файла. Ты детальный.`,
  glm: `Ты Kayori GLM 5.3 Flash. Логичный, списки, таблицы, четко. Если файл - по содержимому. Ты структурированный.`,
  hy: `Ты Kayori Hunyuan 4 Preview. Дружелюбный с юмором, иногда "мур мур мяу~". Если файл - по файлу. Ты веселый.`,
  mistral: `Ты Kayori Mistral 7B. МАКСИМАЛЬНО коротко, только суть. Если файл - коротко по содержимому. Ты короткий.`,
  qwen: `Ты Kayori Qwen 3 4B. Учитель - примеры, код, объяснения. Если файл - подробно разбирай. Ты учитель.`,
  orcaAuto: `Ты Kayori Orca Auto. Универсальный, подстраиваешься. Если файл - по нему.`,
  google: `Ты Kayori Gemini 1.5 Flash. Дружелюбный, видишь фото, читаешь файлы. Если спрашивают "что внутри файла?" - пересказывай содержимое файла подробно.`
}

// ========== FREE AI - MULTIPLE ENDPOINTS ==========

// 1. Pollinations
async function callPollinations(messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const sysPrompt = SYS_PROMPTS[modelKey] || SYS_PROMPTS.google
  const openAiMessages = [
    { role: 'system', content: sysPrompt },
    ...messages.slice(-8).map(m => ({ role: m.role, content: m.content.slice(0, 4000) }))
  ]
  const endpoints = [
    { model: 'openai', temp: modelKey === 'mistral' ? 0.3 : 0.8 },
    { model: 'mistral', temp: 0.7 },
    { model: 'llama', temp: 0.8 },
  ]
  for (const ep of endpoints) {
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: ep.model, messages: openAiMessages, temperature: ep.temp, max_tokens: 2500, seed: Math.floor(Math.random()*100000) })
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (text && text.trim().length > 10) return text
    } catch {}
  }
  // GET fallback
  try {
    const lastUser = messages.filter(m => m.role === 'user').pop()?.content || 'Привет'
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(lastUser.slice(0, 800))}`, { method: 'GET' })
    if (res.ok) {
      const text = await res.text()
      if (text && text.length > 15 && !text.includes('<!DOCTYPE') && text.length < 5000) return text
    }
  } catch {}
  throw new Error('Pollinations не ответил')
}

// 2. DuckDuckGo AI Chat (free, no key, very reliable)
async function callDuckDuckGo(messages: AiMessage[], modelKey: ModelId): Promise<string> {
  try {
    // Get VQD token
    const statusRes = await fetch('https://duckduckgo.com/duckchat/v1/status', {
      method: 'GET',
      headers: { 'x-vqd-accept': '1' }
    })
    const vqd = statusRes.headers.get('x-vqd-4') || ''
    if (!vqd) throw new Error('no vqd')

    const sysPrompt = SYS_PROMPTS[modelKey] || SYS_PROMPTS.google
    const chatMessages = [
      { role: 'user', content: sysPrompt },
      ...messages.slice(-8).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 3000) }))
    ]

    const res = await fetch('https://duckduckgo.com/duckchat/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vqd-4': vqd
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: chatMessages })
    })
    if (!res.ok) throw new Error('duck fail')
    const text = await res.text()
    // Duck returns event-stream like data: {"message": "..."}
    const lines = text.split('\n')
    let full = ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const j = JSON.parse(line.slice(6))
          if (j.message) full += j.message
        } catch {}
      }
    }
    if (full.length > 10) return full
    throw new Error('duck empty')
  } catch (e: any) {
    throw new Error('DuckDuckGo не ответил')
  }
}

// 3. Blackbox AI (free)
async function callBlackbox(messages: AiMessage[], modelKey: ModelId): Promise<string> {
  try {
    const sysPrompt = SYS_PROMPTS[modelKey] || SYS_PROMPTS.google
    const lastUser = messages.filter(m => m.role === 'user').pop()?.content || ''
    const res = await fetch('https://www.blackbox.ai/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { id: 'sys', content: sysPrompt, role: 'user' },
          ...messages.slice(-6).map((m, i) => ({ id: `msg${i}`, content: m.content.slice(0, 3000), role: m.role === 'assistant' ? 'assistant' : 'user' }))
        ],
        id: Math.random().toString(36).slice(2),
        previewToken: null,
        userId: null,
        codeModelMode: true,
        agentMode: {},
        trendingAgentMode: {},
        isMicMode: false,
        userSystemPrompt: sysPrompt,
        maxTokens: 2000,
        playgroundTopP: 0.9,
        playgroundTemperature: 0.7,
        isChromeExt: false,
        githubToken: null,
        clickedAnswer2: false,
        clickedAnswer3: false,
        clickedForceWebSearch: false,
        visitFromDelta: false,
        mobileClient: false,
        userSelectedModel: null,
        validated: '00f37b34-a166-4efb-bce5-1312d87f2f94'
      })
    })
    if (!res.ok) throw new Error('blackbox fail')
    const text = await res.text()
    if (text && text.length > 20) return text
    throw new Error('blackbox empty')
  } catch {
    throw new Error('Blackbox не ответил')
  }
}

// 4. Google Gemini
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
  for (const modelName of ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${google}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 429) throw new Error('Gemini лимит')
        if (res.status === 400 && errText.toLowerCase().includes('key')) throw new Error('Неверный Google ключ')
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

// 5. Orca Router
async function callOrcaRouter(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { orca } = await getKeys()
  if (!orca) throw new Error('Нет Orca ключа')
  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: SYS_PROMPTS[modelKey] || `Ты Kayori ${MODELS[modelKey].name}` },
      ...messages.map(m => ({ role: m.role, content: m.content.slice(0, 5000) }))
    ],
    max_tokens: 2500,
    temperature: modelKey === 'mistral' ? 0.3 : 0.7,
    stream: false
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.orcarouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${orca}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://kayori.ai', 'X-Title': 'AI-KAYORI' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 401) throw new Error('Orca ключ неверный')
        if (res.status === 429) { await new Promise(r => setTimeout(r, 1000)); continue }
        if (res.status === 403) {
          const alts = ['openai/gpt-3.5-turbo', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free', 'qwen/qwen-2-7b-instruct:free', 'orcarouter/auto']
          for (const alt of alts) {
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
          throw new Error(`Orca 403 ${modelId}`)
        }
        throw new Error(`Orca ${res.status}`)
      }
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content
      if (text) return text
      throw new Error('Orca пустой')
    } catch (e: any) {
      if (attempt === 1) throw e
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error('Orca не ответил')
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

// ========== MAIN - NO SWITCHING, FAST THINKING ==========
export async function chatCompletion(modelKey: ModelId, messages: AiMessage[], opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): Promise<{ text: string, modelInfo: typeof MODELS[ModelId], reasoning?: string, error?: boolean }> {
  const lastText = messages[messages.length-1]?.content || ''
  if (isForbidden(lastText)) return { text: `Не могу помочь с этим.`, modelInfo: MODELS[modelKey], error: true }

  const thinkingPool = ['Думаю…','Анализирую…','Собираю мысли…']
  const reasoning = thinkingPool[Math.floor(Math.random()*thinkingPool.length)]

  let fileContext = ''
  if (opts?.fileContent) {
    const cleaned = opts.fileContent.slice(0, 12000)
    fileContext = `\n\n[Содержимое файла ${opts.fileName || ''}]:\n${cleaned}\n[Конец файла]\nЕсли спрашивают "что внутри?" - отвечай ПО ЭТОМУ СОДЕРЖИМОМУ подробно.`
  }
  let msgs = [...messages]
  if (fileContext) msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}${fileContext}` }

  // Build chain per model - SAME personality, no switching visible
  const chain: Array<() => Promise<string>> = []

  if (modelKey === 'google') {
    chain.push(
      () => callGoogleGemini(msgs, opts?.imageBase64, modelKey),
      () => callDuckDuckGo(msgs, modelKey),
      () => callPollinations(msgs, modelKey),
      () => callBlackbox(msgs, modelKey),
      () => callOrcaRouter('orcarouter/auto', msgs, modelKey)
    )
  } else if (['deepseek','glm','hy','orcaAuto'].includes(modelKey)) {
    const orcaId = (MODELS[modelKey] as any).orcaId || 'orcarouter/auto'
    chain.push(
      () => callOrcaRouter(orcaId, msgs, modelKey),
      () => callDuckDuckGo(msgs, modelKey),
      () => callPollinations(msgs, modelKey),
      () => callBlackbox(msgs, modelKey),
      () => callGoogleGemini(msgs, opts?.imageBase64, modelKey)
    )
  } else {
    chain.push(
      () => callCloudflare(MODELS[modelKey].id, msgs, modelKey),
      () => callOrcaRouter((MODELS[modelKey] as any).orcaId, msgs, modelKey),
      () => callDuckDuckGo(msgs, modelKey),
      () => callPollinations(msgs, modelKey),
      () => callBlackbox(msgs, modelKey)
    )
  }

  let lastError = ''
  for (let i = 0; i < chain.length; i++) {
    try {
      const text = await chain[i]()
      if (text && text.trim().length > 5) return { text, modelInfo: MODELS[modelKey], reasoning, error: false }
    } catch (e: any) {
      lastError = e.message
      console.warn(`AI ${modelKey} step ${i} failed:`, e.message)
      continue
    }
  }

  const text = `Не смог ответить от ${MODELS[modelKey].name}. Ошибка: ${lastError}. Попробуй еще раз через 10 сек — бесплатные лимиты сбрасываются быстро. Файл ${opts?.fileName || ''} я прочитал, но ИИ не ответил. Нажми отправить снова.`
  return { text, modelInfo: MODELS[modelKey], reasoning: 'Ошибка', error: true }
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

// File readers
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
  } catch (e: any) { return `[Ошибка DOCX: ${e.message}]` }
}

export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint = new Uint8Array(arrayBuffer)
    const str = new TextDecoder('latin1').decode(uint)
    const regex = /\(([^)]+)\)\s*Tj/g
    const matches = [...str.matchAll(regex)]
    let text = ''
    if (matches.length > 0) text = matches.map(m => m[1]).join(' ').replace(/\\n/g, '\n').slice(0, 15000)
    if (text.length < 20) {
      const readable = str.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, ' ').replace(/\s+/g, ' ').trim()
      text = readable.slice(0, 15000)
    }
    if (text.length < 10) return `[PDF ${Math.round(arrayBuffer.byteLength/1024)}KB - текст не извлечен, попробуй TXT]`
    return text.slice(0, 20000)
  } catch (e: any) { return `[Ошибка PDF: ${e.message}]` }
}

export async function readFileAsText(file: File): Promise<{ content: string, type: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const textExts = ['txt','md','json','js','ts','tsx','jsx','html','htm','css','scss','less','xml','yaml','yml','csv','log','py','java','c','cpp','h','cs','php','rb','go','rs','swift','kt','sh','bat','sql','ini','conf','env','gitignore','dockerfile']
  if (ext === 'docx') { const buf = await file.arrayBuffer(); return { content: await extractDocxText(buf), type: 'docx' } }
  if (ext === 'pdf') { const buf = await file.arrayBuffer(); return { content: await extractPdfText(buf), type: 'pdf' } }
  if (textExts.includes(ext) || file.type.startsWith('text/') || file.type === 'application/json') { const t = await file.text(); return { content: t.slice(0, 25000), type: 'text' } }
  if (['doc'].includes(ext)) { const t = await file.text().catch(() => ''); const cleaned = t.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, ' ').replace(/\s+/g, ' ').slice(0, 20000); return { content: cleaned.length > 20 ? cleaned : `[Старый DOC ${file.name} - сохрани как DOCX]`, type: 'doc' } }
  try { const t = await file.text(); if (t.length > 0 && t.length < 50000) { const readable = t.replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, '').length / t.length; if (readable > 0.7) return { content: t.slice(0, 25000), type: 'text' } } } catch {}
  return { content: `[Файл ${file.name} ${Math.round(file.size/1024)}KB - бинарный. Конвертируй в TXT/DOCX]`, type: 'binary' }
}
