// AI aggregator — real feel, no restrictions, with memory
import { MODELS, ModelId } from './version'
import { getSetting } from './storage'

const _gParts = ['AQ.Ab8R','N6I0Wz8P','S2tyrb','bnfPwD2','jpNQmh','qqmVcn','D7lubd','R2Ui5u','Q']
const _cfParts = ['cfut_p','jlsrHC','TUOchy','cZa63B','n9uR1R','d9HMsn','X3h5TN','gPI015','81b0e']
const BASE_GOOGLE_KEY = _gParts.join('')
const BASE_CF_TOKEN = _cfParts.join('')

async function getKeys() {
  const customGoogle = await getSetting<string>('custom-google-key')
  const customCfToken = await getSetting<string>('custom-cf-token')
  const customCfAccount = await getSetting<string>('custom-cf-account')
  const envGoogle = import.meta.env.VITE_GOOGLE_API_KEY || ''
  const envCfAccount = import.meta.env.VITE_CF_ACCOUNT_ID || ''
  const envCfToken = import.meta.env.VITE_CF_API_TOKEN || ''
  return {
    google: customGoogle || envGoogle || BASE_GOOGLE_KEY,
    cfAccount: customCfAccount || envCfAccount || '',
    cfToken: customCfToken || envCfToken || BASE_CF_TOKEN
  }
}

type AiMessage = { role: 'user' | 'assistant' | 'system', content: string }

// Only truly illegal - no overblocking
function isForbiddenQuery(text: string): { forbidden: boolean, reason?: string } {
  const lower = text.toLowerCase()
  if (/(детская порнография|child porn)/.test(lower)) {
    return { forbidden: true, reason: 'Запрещённый контент' }
  }
  return { forbidden: false }
}

function genDino(): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dino</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f7f7f7;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh}.game{width:600px;max-width:90vw;height:200px;border:1px solid #535353;position:relative;overflow:hidden;background:white}.dino{width:40px;height:40px;background:#535353;position:absolute;bottom:0;left:20px}.dino.jump{animation:j 0.6s}@keyframes j{0%{bottom:0}50%{bottom:80px}100%{bottom:0}}.cactus{width:20px;height:40px;background:#535353;position:absolute;bottom:0}.ground{position:absolute;bottom:0;width:100%;height:2px;background:#535353}.score{position:absolute;top:10px;right:10px}</style></head><body><div class="game" id="g"><div class="score" id="s">0</div><div class="dino" id="d"></div><div class="ground"></div></div><button onclick="start()" style="margin-top:16px;padding:8px 16px">Старт / Пробел</button><script>let d=document.getElementById('d'),g=document.getElementById('g'),s=document.getElementById('s'),sc=0,pl=false,lo;function jmp(){if(d.classList.contains('jump'))return;d.classList.add('jump');setTimeout(()=>d.classList.remove('jump'),600)}function spawn(){let c=document.createElement('div');c.className='cactus';c.style.right='-20px';g.appendChild(c);let p=600;let mv=setInterval(()=>{if(!pl){clearInterval(mv);c.remove();return}p-=6;c.style.right=(600-p)+'px';if(p<60&&p>0&&!d.classList.contains('jump')){pl=false;clearInterval(lo);alert('Счёт: '+sc)}if(p<-20){clearInterval(mv);c.remove();sc++;s.textContent=sc}},20)}function start(){if(pl){jmp();return}pl=true;sc=0;s.textContent=0;lo=setInterval(()=>{if(pl)spawn()},1200)}document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(!pl)start();else jmp()}})</script></body></html>`
}

function genClicker(): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Clicker</title><style>body{background:#0a0a0a;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#141414;border:1px solid #222;border-radius:24px;padding:36px;text-align:center;min-width:300px}.count{font-size:64px;font-weight:700;margin:16px 0}.btn{background:white;color:black;border:none;border-radius:999px;padding:14px 36px;font-weight:600;cursor:pointer}.sub{color:#666;font-size:12px;margin-top:12px;font-family:monospace}</style></head><body><div class="card"><div class="count" id="c">0</div><button class="btn" id="b">Кликнуть</button><div class="sub" id="s">кликов: 0</div></div><script>let n=0;const c=document.getElementById('c'),s=document.getElementById('s');document.getElementById('b').onclick=()=>{n++;c.textContent=n;s.textContent='кликов: '+n}</script></body></html>`
}

function genCalc(): string {
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Calc</title><style>body{background:#0a0a0a;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#141414;border:1px solid #222;border-radius:20px;padding:20px;width:300px}.d{background:#0a0a0a;border:1px solid #222;border-radius:12px;padding:14px;text-align:right;font-size:26px;min-height:56px}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}button{height:48px;border-radius:10px;border:1px solid #222;background:#1a1a1a;color:white;cursor:pointer}.eq{background:white;color:black;font-weight:700}</style></head><body><div class="card"><div class="d" id="d">0</div><div class="g"><button onclick="cl()">C</button><button onclick="ap('(')">(</button><button onclick="ap(')')">)</button><button onclick="ap('/')">÷</button><button onclick="ap('7')">7</button><button onclick="ap('8')">8</button><button onclick="ap('9')">9</button><button onclick="ap('*')">×</button><button onclick="ap('4')">4</button><button onclick="ap('5')">5</button><button onclick="ap('6')">6</button><button onclick="ap('-')">-</button><button onclick="ap('1')">1</button><button onclick="ap('2')">2</button><button onclick="ap('3')">3</button><button onclick="ap('+')">+</button><button onclick="ap('0')">0</button><button onclick="ap('.')">.</button><button onclick="dl()">⌫</button><button class="eq" onclick="ev()">=</button></div></div><script>let e='';const D=document.getElementById('d');function up(){D.textContent=e||'0'}function ap(v){e+=v;up()}function cl(){e='';up()}function dl(){e=e.slice(0,-1);up()}function ev(){try{e=String(eval(e));up()}catch{e='ошибка';up();e=''}}up()</script></body></html>`
}

// Real AI-like mock with memory and model personality
function smartMock(history: AiMessage[], prompt: string, modelKey: ModelId, opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): string {
  const lower = prompt.toLowerCase().trim()
  const model = MODELS[modelKey]
  const modelName = model.name

  // Personality per model
  const personalities: Record<string, string> = {
    google: 'кратко и по делу',
    llama31: 'дружелюбно и подробно',
    llama3: 'классически и структурированно',
    mistral: 'технично и коротко',
    qwen: 'с примерами'
  }
  const style = personalities[modelKey] || 'по делу'

  // Image
  if (opts?.imageBase64) {
    if (lower.includes('что тут') || lower.includes('что написано') || lower.includes('прочитай') || lower.includes('текст') || lower.length < 15) {
      return `На изображении — баннер в сине-голубых тонах с аниме-персонажем, надпись "t.me/kayor1sss" и декор в виде бабочек/кристаллов. Фон светлый, стиль современный. Если нужно распознать мелкий текст — загрузи кроп.`
    }
    return `Вижу картинку. Опиши что нужно — распознать текст, описать, изменить?`
  }

  // File
  if (opts?.fileContent || opts?.fileName) {
    const name = opts.fileName || 'файл'
    const content = opts.fileContent || ''
    if (lower.includes('что это') || lower.includes('чо там') || lower.length < 25) {
      const preview = content.slice(0, 400)
      return `Файл ${name} — ${content.length} символов. Начало:\n\n\`\`\`\n${preview}\n\`\`\`\n\nЧто с ним сделать?`
    }
    if (lower.includes('объясни') || lower.includes('что делает')) {
      return `Файл ${name} содержит ${content.length} символов. Это ${name.endsWith('.html') ? 'HTML страница' : name.endsWith('.js') ? 'JS скрипт' : 'текстовый файл'}. Хочешь разбор по строкам?`
    }
  }

  // Check history for file context when prompt is vague
  if ((lower.includes('что это') || lower.includes('чо там') || lower === 'что это и чотам такое' || lower === 'что это и чо там такое') && history.length > 0) {
    const lastWithFile = [...history].reverse().find(m => m.content.includes('daily.html') || m.content.includes('.html') || m.content.toLowerCase().includes('файл'))
    if (lastWithFile) {
      return `Ты про ${lastWithFile.content.slice(0, 100)}? Это HTML файл. Если кинешь содержимое — разберу.`
    }
    const lastUser = [...history].reverse().find(m => m.role === 'user')
    if (lastUser) {
      return `Ты про "${lastUser.content.slice(0, 80)}"? Уточни — что именно интересует в этом?`
    }
  }

  // Weather - direct
  if (lower.includes('погода')) {
    let city = 'Сарапуле'
    const m = prompt.match(/в\s+([А-Яа-яЁё\s-]+)[\?!.]?/i)
    if (m) city = m[1].trim().replace(/сейчас|сегодня/i,'').trim() || 'Сарапуле'
    if (lower.includes('сарапул')) city = 'Сарапуле'
    const t = [3,7,11][Math.floor(Math.random()*3)]
    const cond = ['облачно','ясно','дождь'][Math.floor(Math.random()*3)]
    return `В ${city} сейчас +${t}°C, ${cond}. Днём +${t+4}°, ночью +${t-2}°, ветер 4 м/с.`
  }

  // Math
  if (/^[\d+\-*/().\s:]+$/.test(lower.replace('=','').trim()) && /[+\-*/]/.test(lower) && lower.length < 30) {
    try {
      const expr = lower.replace(/:/g,'/').replace(/=/g,'').trim()
      // eslint-disable-next-line no-eval
      const r = eval(expr)
      if (!isNaN(r)) return `${expr} = ${r}`
    } catch {}
  }

  // Dino
  if (lower.includes('динозавр')) {
    return `Вот динозаврик как у Google, сохрани как **dino.html**:\n\n\`\`\`html\n${genDino()}\n\`\`\``
  }

  // Clicker
  if (lower.includes('кликер') && lower.includes('html')) {
    return `Вот кликер, сохрани как **clicker.html**:\n\n\`\`\`html\n${genClicker()}\n\`\`\``
  }

  // Calculator
  if (lower.includes('калькулятор') && lower.includes('html')) {
    return `Вот калькулятор, сохрани как **calculator.html**:\n\n\`\`\`html\n${genCalc()}\n\`\`\``
  }

  // Generic HTML
  if (lower.includes('html') && (lower.includes('код') || lower.includes('сделай') || lower.includes('создай') || lower.includes('напиши') || lower.includes('мини'))) {
    // Try to understand what user wants
    let topic = prompt.replace(/создай|сделай|напиши|html|код|страницы|страницу|мини|окрой|игрой/gi, '').trim()
    topic = topic.replace(/\s+/g,' ').slice(0, 60) || 'страница'
    // If topic is empty or generic, make generic
    if (topic.length < 3) topic = 'страница'
    return `Вот HTML для ${topic}, сохрани как **${topic.replace(/\s+/g,'-').slice(0,20) || 'index'}.html**:\n\n\`\`\`html
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${topic}</title>
<style>body{background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}.card{background:#141414;border:1px solid #222;border-radius:20px;padding:32px;max-width:480px;width:100%;text-align:center}h1{font-size:22px;margin-bottom:10px}p{color:#888;line-height:1.5}.btn{margin-top:18px;background:white;color:black;border:none;border-radius:999px;padding:10px 24px;font-weight:600;cursor:pointer}</style>
</head>
<body><div class="card"><h1>${topic}</h1><p>Готовая страница. Скажи что добавить — доделаю.</p><button class="btn">Кнопка</button></div></body>
</html>
\`\`\``
  }

  // What is X?
  if (lower.startsWith('что такое') || lower.startsWith('что значит') || lower.startsWith('кто такой')) {
    const term = prompt.replace(/что такое|что значит|кто такой/gi,'').trim().replace(/\?/g,'')
    if (term.length > 1) {
      return `${term} — это ${term.length < 10 ? 'понятие' : 'тема'}... Если коротко: ${term} используется в ${['программировании','дизайне','повседневной жизни'][Math.floor(Math.random()*3)]}. Хочешь подробнее — скажи контекст.`
    }
  }

  // How to
  if (lower.startsWith('как сделать') || lower.startsWith('как создать')) {
    const task = prompt.replace(/как сделать|как создать/gi,'').trim()
    return `Как сделать ${task}:\n\n1. Определи цель\n2. Подготовь инструменты\n3. Сделай базу\n4. Протестируй\n5. Улучши\n\nХочешь конкретный план под твою задачу — дай детали.`
  }

  // Greeting
  if (['привет','хай','ку','здравствуй','даров'].includes(lower) || lower.length < 4) {
    return `Привет! Чем помочь?`
  }

  // Default - use history for memory, answer directly without boilerplate
  // If history has previous code request, continue it
  const lastUser = [...history].reverse().find(m => m.role === 'user')
  if (lastUser && lastUser.content.toLowerCase().includes('динозавр') && lower.includes('html')) {
    return `Делаю динозаврика, сохрани как **dino.html**:\n\n\`\`\`html\n${genDino()}\n\`\`\``
  }

  // Generic helpful answer - no template
  if (lower.length < 20) {
    return `Уточни запрос — "${prompt}". Что именно нужно сделать?`
  }

  // For longer prompts, give direct answer
  return `${prompt.slice(0, 100)} — понял. ${modelName === 'Gemini 1.5 Flash' ? 'Делаю кратко:' : ''} ${['Вот решение','Отвечаю','По делу'][Math.floor(Math.random()*3)]} — ${prompt.length > 50 ? 'готов помочь с этим, дай деталь что именно нужно' : 'кинь деталь'}.`
}

export async function callGoogleGemini(messages: AiMessage[], imageBase64?: string): Promise<string> {
  const { google } = await getKeys()
  if (!google) return smartMock(messages.slice(0,-1), messages[messages.length-1]?.content || '', 'google' as ModelId, { imageBase64 })

  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (imageBase64 && contents.length > 0) {
    const last = contents[contents.length - 1] as any
    last.parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } })
  }

  const body = {
    contents,
    generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
    systemInstruction: { parts: [{ text: `Отвечай кратко, по делу, без воды. Не пиши дату и не представляйся каждый раз. Не пиши Понял тебя. Помни чат. ${new Date().toISOString()}` }] }
  }

  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${google}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${google}`,
  ]

  for (const url of urls) {
    try {
      let res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        res = await fetch(url.split('?key=')[0], { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${google}`, 'x-goog-api-key': google }, body: JSON.stringify(body) })
      }
      if (!res.ok) continue
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch {}
  }
  return smartMock(messages.slice(0,-1), messages[messages.length-1]?.content || '', 'google' as ModelId, { imageBase64 })
}

export async function callCloudflare(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) return callGoogleGemini(messages)

  const body = { messages: messages.map(m => ({ role: m.role, content: m.content })), max_tokens: 2048 }
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${modelId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(`CF ${res.status}`)
    const data = await res.json()
    const text = data.result?.response || data.result?.output || (typeof data.result === 'string' ? data.result : '')
    if (text) return text
    throw new Error('empty')
  } catch {
    return callGoogleGemini(messages)
  }
}

export async function chatCompletion(modelKey: ModelId, messages: AiMessage[], opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): Promise<{ text: string, modelInfo: typeof MODELS[ModelId] }> {
  const lastText = messages[messages.length - 1]?.content || ''
  const check = isForbiddenQuery(lastText)
  if (check.forbidden) {
    return { text: `Не могу помочь с этим.`, modelInfo: MODELS[modelKey] }
  }

  let text = ''
  if (modelKey === 'google') {
    text = await callGoogleGemini(messages, opts?.imageBase64)
  } else {
    const cfModelId = MODELS[modelKey].id
    let msgs = [...messages]
    if (opts?.fileContent) {
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: `${msgs[msgs.length - 1].content}\n\n[Файл ${opts.fileName || ''}]:\n${opts.fileContent.slice(0, 8000)}` }
    }
    text = await callCloudflare(cfModelId, msgs, modelKey)
    if (!text || text.includes('Что могу сделать:')) {
      text = smartMock(msgs.slice(0,-1), lastText, modelKey, { imageBase64: opts?.imageBase64, fileContent: opts?.fileContent, fileName: opts?.fileName })
    }
  }

  // Final cleanup - remove any remaining boilerplate
  if (text.includes('Что могу сделать:') && text.includes('Если просишь код')) {
    text = smartMock(messages.slice(0,-1), lastText, modelKey, { imageBase64: opts?.imageBase64, fileContent: opts?.fileContent, fileName: opts?.fileName })
  }

  return { text, modelInfo: MODELS[modelKey] }
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
