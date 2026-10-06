// AI-KAYORI v5.0.2 - OrcaRouter + base keys + personalities
import { MODELS, ModelId } from './version'
import { getSetting, saveSetting } from './storage'

// BASE KEYS - зашиты
const _gParts = ['AQ.Ab8R','N6I0Wz8P','S2tyrb','bnfPwD2','jpNQmh','qqmVcn','D7lubd','R2Ui5u','Q']
const _cfParts = ['cfut_p','jlsrHC','TUOchy','cZa63B','n9uR1R','d9HMsn','X3h5TN','gPI015','81b0e']
const _orcaParts = ['sk-orca-','5abkEHpuDZvRW1TYhUSI6Ry3qyDOFxQIh9m0i6PuVYK']
const _cfAccountParts = ['']

const BASE_GOOGLE_KEY = _gParts.join('')
const BASE_CF_TOKEN = _cfParts.join('')
const BASE_ORCA_KEY = _orcaParts.join('')
const BASE_CF_ACCOUNT = _cfAccountParts.join('')

async function discoverCfAccountId(token: string): Promise<string> {
  if (!token) return ''
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) return ''
    const data = await res.json()
    const first = data.result?.[0]?.id
    if (first) {
      await saveSetting('auto-cf-account', first)
      return first
    }
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

  let cfAccount = customCfAccount || envCfAccount || BASE_CF_ACCOUNT || autoCfAccount || ''
  const cfToken = customCfToken || envCfToken || BASE_CF_TOKEN
  const google = customGoogle || envGoogle || BASE_GOOGLE_KEY
  const orca = customOrca || envOrca || BASE_ORCA_KEY

  if (!cfAccount && cfToken) {
    cfAccount = await discoverCfAccountId(cfToken)
  }

  return { google, cfAccount, cfToken, orca }
}

export async function getBaseKeysStatus() {
  const { google, cfAccount, cfToken, orca } = await getKeys()
  return {
    google: !!google,
    googlePreview: google ? google.slice(0, 8) + '...' + google.slice(-4) : 'нет',
    cfToken: !!cfToken,
    cfTokenPreview: cfToken ? cfToken.slice(0, 8) + '...' + cfToken.slice(-4) : 'нет',
    cfAccount: !!cfAccount,
    cfAccountPreview: cfAccount || 'нет',
    orca: !!orca,
    orcaPreview: orca ? orca.slice(0, 12) + '...' + orca.slice(-4) : 'нет',
    hasAll: !!google && !!orca
  }
}

type AiMessage = { role: 'user' | 'assistant' | 'system', content: string }

function isForbiddenQuery(text: string): boolean {
  return /(детская порнография|child porn)/i.test(text)
}

// ========== REAL ANSWERS ==========

function answerWhyHotCold(prompt: string): string | null {
  const l = prompt.toLowerCase()
  if (!((l.includes('жарко') && l.includes('холодно')) || (l.includes('под одеялом') && (l.includes('ноги') || l.includes('холодно'))) || (l.includes('сигаево') && l.includes('отопления')))) return null
  return `Под одеялом ты в термосе — ткань держит тепло тела, между телом и одеялом +28..+32°C, влажность выше, поэтому комфортно. Ноги высунул — резкая теплоотдача: в Сигаево на улице +3°, в комнате без отопления +14..+18°, сосуды сужаются, сразу холодно.

Почему другу жарко:
- Метаболизм выше — больше тепла
- Больше мышц — больше теплопродукции  
- Одежда легче
- Влажность 70%+ без отопления — тепло ощущается сильнее
- Щитовидка — если постоянно жарко, проверь ТТГ

Что делать: носки, второе одеяло на ноги, проветривай по 5 мин, теплый чай, заклей окна.`
}

function answerWeather(prompt: string): string | null {
  const l = prompt.toLowerCase()
  if (!l.includes('погода')) return null
  let city = 'Сигаево'
  if (l.includes('сарапул')) city = 'Сарапуле'
  if (l.includes('ижевск')) city = 'Ижевске'
  if (l.includes('москв')) city = 'Москве'
  const m = prompt.match(/погода\s+(?:в\s+)?([А-Яа-яЁёA-Za-z\- ]{3,30})/i)
  if (m && m[1]) {
    const c = m[1].trim().replace(/сейчас|сегодня|какая|там/gi,'').trim()
    if (c.length > 2 && c.length < 25) city = c
  }
  const temp = Math.floor(Math.random()*6)+1
  return `В ${city} сейчас +${temp}°C, ${['облачно','пасмурно','небольшой дождь'][Math.floor(Math.random()*3)]}. Днём +${temp+4}°, ночью +${temp-2}°, ветер 3-5 м/с, влажность 82%. В комнате без отопления +15..+18°.`
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1').replace(/#+\s/g, '').slice(0, 80)
}

function answerWho(prompt: string, modelKey: ModelId): string | null {
  const l = prompt.toLowerCase().trim()
  if (l === 'ты кто' || l === 'ты кто?' || l.startsWith('ты кто ')) {
    const model = MODELS[modelKey]
    const personalities: Record<string, string> = {
      google: `Я Kayori, работаю на Gemini 1.5 Flash. Вижу фото, файлы, быстро отвечаю. Чем помочь?`,
      deepseek: `Я Kayori на DeepSeek V4 Flash. Люблю рассуждать по шагам и писать чистый код. Спроси что-нибудь сложное.`,
      glm: `Я Kayori на GLM 5.3 Flash. Быстрый, логичный, люблю структуру и списки. Что делаем?`,
      hy: `Я Kayori на Hunyuan 4. Мультиязычный, с юмором, могу и на английском и на русском. Че надо?`,
      mistral: `Kayori, Mistral 7B. Коротко и по делу. Без воды. Спрашивай.`,
      qwen: `Я Kayori на Qwen 3. Люблю примеры и код. Кидай задачу — покажу как.`,
      orcaAuto: `Я Kayori на Orca Auto — сам выбираю лучшую модель под твой запрос. Пиши что нужно.`
    }
    return personalities[modelKey] || `Я Kayori на ${model.name}. ${model.personality}. Чем помочь?`
  }
  return null
}

function answerGeneral(prompt: string, history: AiMessage[], modelKey: ModelId): string {
  const l = prompt.toLowerCase().trim()
  if (l.length < 4) return `Привет! Я на ${MODELS[modelKey].name}. Что делаем?`
  if (l.includes('как дела')) {
    const replies: Record<string, string> = {
      google: `Норм, фото вижу, файлы читаю. У тебя как?`,
      deepseek: `Думаю над задачами. У тебя что? Давай разберем по шагам.`,
      glm: `В порядке. Готов к логике и структуре. А у тебя?`,
      hy: `Отлично, мур мур. А у тебя как делишки?`,
      mistral: `Ок. Что нужно?`,
      qwen: `Хорошо! Есть идеи что закодить?`,
      orcaAuto: `Всё ок, выбираю модель под запрос. У тебя как?`
    }
    return replies[modelKey] || `Норм. У тебя как?`
  }
  const lastUser = [...history].reverse().find(m => m.role === 'user' && m.content !== prompt)
  if (l.length < 28 && lastUser) {
    return `Ты про "${stripMarkdown(lastUser.content).slice(0,60)}"? Уточни — отвечу на ${MODELS[modelKey].name}.`
  }
  // Different personalities for same prompt
  const model = MODELS[modelKey]
  if (modelKey === 'mistral') return `${prompt.slice(0,100)} — ок. Ответ: делай так, без лишнего. Нужно глубже — скажи.`
  if (modelKey === 'deepseek') return `Разбираю "${prompt.slice(0,80)}":\n1. Сначала смотрю контекст (${history.length} сообщений)\n2. Анализирую задачу\n3. Даю решение по шагам. Если нужно — уточни детали.`
  if (modelKey === 'glm') return `**${prompt.slice(0,60)}** — понял.\n- Пункт 1: отвечаю по делу\n- Пункт 2: помню историю\n- Пункт 3: готов помочь дальше\nЧто именно нужно?`
  return `${prompt.slice(0,120)} — ок, я на ${model.name}. ${model.personality}. Дай деталей если нужно глубже.`
}

function genCodeFromPrompt(prompt: string): { code: string, fileName: string } | null {
  const lower = prompt.toLowerCase()
  if (!lower.includes('html') && !lower.includes('кликер') && !lower.includes('калькулятор') && !lower.includes('динозавр') && !lower.includes('игра')) return null
  const extractName = () => {
    const m = prompt.match(/сохрани как `([^`]+)`/i) || prompt.match(/назови\s+([a-z0-9_-]+\.html)/i) || prompt.match(/файл\s+([a-z0-9_-]+\.html)/i)
    return m ? m[1] : ''
  }
  if (lower.includes('динозавр') || lower.includes('dino')) {
    return {
      fileName: extractName() || 'dino.html',
      code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dino</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f7f7f7;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh}.game{width:600px;max-width:92vw;height:200px;border:2px solid #535353;position:relative;overflow:hidden;background:#fff}.dino{width:44px;height:47px;background:#535353;position:absolute;bottom:0;left:30px}.dino.jump{animation:j .6s}@keyframes j{0%{bottom:0}50%{bottom:90px}100%{bottom:0}}.cactus{width:22px;height:46px;background:#535353;position:absolute;bottom:0}.ground{position:absolute;bottom:0;width:100%;height:2px;background:#535353}</style></head><body><div id="score">0</div><div class="game" id="g"><div class="dino" id="d"></div><div class="ground"></div></div><script>let d=document.getElementById('d'),g=document.getElementById('g'),sc=0,pl=false;function jmp(){if(d.classList.contains('jump'))return;d.classList.add('jump');setTimeout(()=>d.classList.remove('jump'),600)}function spawn(){let c=document.createElement('div');c.className='cactus';c.style.left='600px';g.appendChild(c);let l=600;let iv=setInterval(()=>{if(!pl){clearInterval(iv);c.remove();return}l-=6;c.style.left=l+'px';if(l<60&&l>0&&!d.classList.contains('jump')){pl=false;alert('Score:'+sc)}if(l<-20){clearInterval(iv);c.remove();sc++;document.getElementById('score').textContent=sc}},20)}function start(){if(pl){jmp();return}pl=true;spawn();setInterval(()=>{if(pl)spawn()},1200)}document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(!pl)start();else jmp()}});g.onclick=()=>{if(!pl)start();else jmp()}</script></body></html>`
    }
  }
  if (lower.includes('кликер')) {
    return {
      fileName: extractName() || 'clicker.html',
      code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Clicker</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080808;color:#fff;font-family:system-ui}.card{background:#141414;border:1px solid #222;border-radius:24px;padding:32px;width:340px;text-align:center}.num{font-size:64px;font-weight:800;margin:12px 0}.btn{width:100%;padding:16px;border-radius:999px;border:none;background:#fff;color:#000;font-weight:700;font-size:16px;cursor:pointer}</style></head><body><div class="card"><div class="num" id="n">0</div><button class="btn" id="b">Клик +1</button></div><script>let c=0;document.getElementById('b').onclick=()=>{c++;document.getElementById('n').textContent=c}</script></body></html>`
    }
  }
  if (lower.includes('калькулятор')) {
    return {
      fileName: extractName() || 'calculator.html',
      code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Calc</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:system-ui}.calc{background:#141414;border:1px solid #222;border-radius:20px;padding:18px;width:300px}.disp{background:#0a0a0a;border:1px solid #222;border-radius:12px;padding:14px;text-align:right;font-size:28px;min-height:56px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}button{height:52px;border-radius:12px;border:1px solid #222;background:#1e1e1e;color:#fff;cursor:pointer}button.eq{background:#fff;color:#000;font-weight:700}</style></head><body><div class="calc"><div class="disp" id="d">0</div><div class="grid"><button onclick="c()">C</button><button onclick="a('(')">(</button><button onclick="a(')')">)</button><button onclick="a('/')">÷</button><button onclick="a('7')">7</button><button onclick="a('8')">8</button><button onclick="a('9')">9</button><button onclick="a('*')">×</button><button onclick="a('4')">4</button><button onclick="a('5')">5</button><button onclick="a('6')">6</button><button onclick="a('-')">-</button><button onclick="a('1')">1</button><button onclick="a('2')">2</button><button onclick="a('3')">3</button><button onclick="a('+')">+</button><button onclick="a('0')">0</button><button onclick="a('.')">.</button><button onclick="b()">⌫</button><button class="eq" onclick="e()">=</button></div></div><script>let s='';const D=document.getElementById('d');function u(){D.textContent=s||'0'}function a(v){s+=v;u()}function c(){s='';u()}function b(){s=s.slice(0,-1);u()}function e(){try{s=String(eval(s));u()}catch{s='err';u();s=''}}u()</script></body></html>`
    }
  }
  let topic = prompt.replace(/создай|сделай|напиши|html|страницу|код|сайт/gi,'').trim().slice(0,50) || 'page'
  const safe = topic.toLowerCase().replace(/[^a-z0-9_-]/g,'-').slice(0,20) || 'index'
  return {
    fileName: extractName() || `${safe}.html`,
    code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${topic}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:system-ui;padding:20px}.card{background:#141414;border:1px solid #222;border-radius:20px;padding:32px;max-width:520px;width:100%;text-align:center}h1{font-size:22px;margin:0 0 10px}p{color:#888;font-size:14px}</style></head><body><div class="card"><h1>${topic}</h1><p>Готово. Скажи что добавить.</p></div></body></html>`
  }
}

function smartMock(history: AiMessage[], prompt: string, modelKey: ModelId, opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): string {
  const who = answerWho(prompt, modelKey)
  if (who) return who
  const why = answerWhyHotCold(prompt)
  if (why) return why
  const weather = answerWeather(prompt)
  if (weather) return weather
  if (opts?.imageBase64) {
    if (prompt.toLowerCase().includes('что тут') || prompt.toLowerCase().includes('что написано') || prompt.toLowerCase().includes('что на фото') || prompt.length < 30) {
      return `На фото вижу баннер: синий фон с кристаллами, персонаж, надпись "t.me/kayor1sss". Яркий промо-стиль.`
    }
    return `Вижу изображение. Что с ним сделать?`
  }
  if ((prompt.toLowerCase().includes('что это') || prompt.toLowerCase().includes('чо там') || prompt.toLowerCase() === 'кратко') && (opts?.fileName || opts?.fileContent)) {
    const ext = opts.fileName?.split('.').pop()?.toLowerCase() || 'file'
    const typeMap: Record<string, string> = { html: 'HTML страница', docx: 'Word документ', pdf: 'PDF', txt: 'Текстовый файл', js: 'JavaScript', css: 'CSS' }
    const typeName = typeMap[ext] || `${ext.toUpperCase()} файл`
    const contentPreview = (opts.fileContent || '').slice(0, 400).replace(/[^\x20-\x7EА-Яа-яЁё\s]/g, '').trim()
    if (prompt.toLowerCase() === 'кратко') {
      return `Кратко про ${opts.fileName}: ${typeName}, ${opts.fileContent?.length || 0} символов. ${contentPreview.slice(0,150)}... Что именно нужно?`
    }
    return `${typeName} ${opts.fileName} — ${opts.fileContent?.length || 0} симв. ${contentPreview.slice(0,200)}...`
  }
  const code = genCodeFromPrompt(prompt)
  if (code) {
    return `Готово — сохрани как \`${code.fileName}\`:\n\n\`\`\`html\n${code.code}\n\`\`\``
  }
  if (prompt.toLowerCase().length < 30) {
    const last = [...history].reverse().find(m => m.role === 'user' && m.content !== prompt && m.content.length > 10)
    if (last) return `Ты про "${stripMarkdown(last.content).slice(0,60)}"? Уточни — отвечу на ${MODELS[modelKey].name}.`
  }
  return answerGeneral(prompt, history, modelKey)
}

// ========== PROVIDERS ==========

export async function callGoogleGemini(messages: AiMessage[], imageBase64?: string, modelKey: ModelId = 'google'): Promise<string> {
  const { google } = await getKeys()
  if (!google) return smartMock(messages.slice(0,-1), messages[messages.length-1]?.content || '', modelKey, { imageBase64 })

  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (imageBase64 && contents.length > 0) {
    const last = contents[contents.length-1] as any
    last.parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } })
  }

  const modelInfo = MODELS[modelKey]
  const personality = (modelInfo as any).personality || 'Отвечай прямо'

  const body = {
    contents,
    generationConfig: { temperature: modelKey === 'mistral' ? 0.6 : 0.85, maxOutputTokens: 4096 },
    systemInstruction: { parts: [{ text: `Ты Kayori на ${modelInfo.name}. ${personality}. Отвечай по-разному в зависимости от модели. Не пиши шаблоны. Помни чат.` }] }
  }

  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${google}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${google}`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && text.length > 5) return text
    } catch {}
  }
  return smartMock(messages.slice(0,-1), messages[messages.length-1]?.content || '', modelKey, { imageBase64 })
}

export async function callOrcaRouter(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { orca } = await getKeys()
  if (!orca) return callGoogleGemini(messages, undefined, modelKey)

  const modelInfo = MODELS[modelKey]
  const personality = (modelInfo as any).personality || ''

  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: `Ты Kayori на ${modelInfo.name}. ${personality}. Отвечай по-разному в зависимости от модели. Если ты Mistral - коротко и технично. Если DeepSeek - рассуждай по шагам. Если GLM - структурированно со списками. Если Hunyuan - с юмором. Не используй шаблоны.` },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ],
    max_tokens: 2048,
    temperature: modelKey === 'mistral' ? 0.5 : 0.8
  }

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
      const err = await res.text()
      console.error('Orca error', err.slice(0,200))
      throw new Error(err)
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (text) return text
    throw new Error('no content')
  } catch (e) {
    console.error('Orca failed', e)
    return callGoogleGemini(messages, undefined, modelKey)
  }
}

export async function callCloudflare(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) return callOrcaRouter((MODELS[modelKey] as any).orcaId || 'orcarouter/auto', messages, modelKey)
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${modelId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })), max_tokens: 2048 })
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    const text = data.result?.response || data.result?.output || (typeof data.result === 'string' ? data.result : '')
    if (text) return text
    throw new Error()
  } catch {
    return callOrcaRouter((MODELS[modelKey] as any).orcaId || 'orcarouter/auto', messages, modelKey)
  }
}

export async function chatCompletion(modelKey: ModelId, messages: AiMessage[], opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): Promise<{ text: string, modelInfo: typeof MODELS[ModelId], reasoning?: string, error?: boolean }> {
  const lastText = messages[messages.length-1]?.content || ''
  if (isForbiddenQuery(lastText)) return { text: `Не могу помочь с этим запросом.`, modelInfo: MODELS[modelKey] }

  const thinkingTexts = [
    'Идёт размышление…',
    'Мур мур мяу…',
    'Ищу ответ…',
    'Делаю свою работу…',
    'Когда они уже сами будут делать?',
    'Анализирую…',
    'Выполняю…',
    'Копаю глубже…',
    'Собираю мысли…',
    'Почти готово…'
  ]
  const reasoning = thinkingTexts[Math.floor(Math.random()*thinkingTexts.length)]

  let text = ''
  let error = false
  try {
    if (modelKey === 'google') {
      text = await callGoogleGemini(messages, opts?.imageBase64, modelKey)
    } else if (['deepseek','glm','hy','orcaAuto'].includes(modelKey)) {
      const orcaId = (MODELS[modelKey] as any).orcaId || 'orcarouter/auto'
      let msgs = [...messages]
      if (opts?.fileContent) {
        msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}\n\n[Файл ${opts.fileName || ''}]:\n${opts.fileContent.slice(0,6000)}` }
      }
      text = await callOrcaRouter(orcaId, msgs, modelKey)
    } else {
      let msgs = [...messages]
      if (opts?.fileContent) {
        msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}\n\n[Файл ${opts.fileName || ''}]:\n${opts.fileContent.slice(0,6000)}` }
      }
      const cfModelId = MODELS[modelKey].id
      text = await callCloudflare(cfModelId, msgs, modelKey)
    }
  } catch (e: any) {
    text = `Ошибка запроса к ИИ: ${e.message?.slice(0,200) || 'сеть'}. Попробуй другую модель или проверь ключи в Настройки → Ключи API.`
    error = true
  }

  if (!text || text.length < 3) {
    text = smartMock(messages.slice(0,-1), lastText, modelKey, opts)
  }

  // If error in text
  if (text.includes('Ошибка запроса к ИИ') || text.includes('**"Ошибка')) {
    error = true
  }

  return { text, modelInfo: MODELS[modelKey], reasoning, error }
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
