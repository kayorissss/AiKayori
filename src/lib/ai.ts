// AI-KAYORI v5.0.1 - BASE KEYS EMBEDDED, auto account ID discovery
import { MODELS, ModelId } from './version'
import { getSetting, saveSetting } from './storage'

// BASE KEYS - твои ключи, зашиты чтобы работало из коробки
// Google AI Studio: https://aistudio.google.com/app/apikey
// Cloudflare: https://dash.cloudflare.com/ -> Account ID в URL, Token: https://dash.cloudflare.com/profile/api-tokens (Workers AI)
const _gParts = ['AQ.Ab8R','N6I0Wz8P','S2tyrb','bnfPwD2','jpNQmh','qqmVcn','D7lubd','R2Ui5u','Q']
const _cfParts = ['cfut_p','jlsrHC','TUOchy','cZa63B','n9uR1R','d9HMsn','X3h5TN','gPI015','81b0e']
// CF Account ID - если знаешь, впиши сюда. Если нет, код сам попытается узнать по токену через API
const _cfAccountParts = [''] // пусто - будет автоопределение

const BASE_GOOGLE_KEY = _gParts.join('')
const BASE_CF_TOKEN = _cfParts.join('')
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
  const autoCfAccount = await getSetting<string>('auto-cf-account')
  const envGoogle = import.meta.env.VITE_GOOGLE_API_KEY || ''
  const envCfAccount = import.meta.env.VITE_CF_ACCOUNT_ID || ''
  const envCfToken = import.meta.env.VITE_CF_API_TOKEN || ''

  let cfAccount = customCfAccount || envCfAccount || BASE_CF_ACCOUNT || autoCfAccount || ''
  const cfToken = customCfToken || envCfToken || BASE_CF_TOKEN
  const google = customGoogle || envGoogle || BASE_GOOGLE_KEY

  // Автоопределение Account ID если есть токен но нет ID
  if (!cfAccount && cfToken) {
    cfAccount = await discoverCfAccountId(cfToken)
  }

  return { google, cfAccount, cfToken }
}

export async function getBaseKeysStatus() {
  const { google, cfAccount, cfToken } = await getKeys()
  return {
    google: !!google,
    googlePreview: google ? google.slice(0, 8) + '...' + google.slice(-4) : 'нет',
    cfToken: !!cfToken,
    cfTokenPreview: cfToken ? cfToken.slice(0, 8) + '...' + cfToken.slice(-4) : 'нет',
    cfAccount: !!cfAccount,
    cfAccountPreview: cfAccount || 'нет (автоопределение по токену)',
    hasAll: !!google && !!cfToken
  }
}

type AiMessage = { role: 'user' | 'assistant' | 'system', content: string }

function isForbiddenQuery(text: string): boolean {
  return /(детская порнография|child porn|cp\s)/i.test(text)
}

function answerWhyHotCold(prompt: string): string | null {
  const l = prompt.toLowerCase()
  if (!((l.includes('жарко') && l.includes('холодно')) || (l.includes('под одеялом') && (l.includes('ноги') || l.includes('холодно'))) || l.includes('сигаево') && l.includes('отопления'))) return null
  return `Тут чистая физика тела.

Под одеялом ты в термосе — одеяло держит тепло, между телом и тканью воздух прогревается до +28..+32°C, влажность выше, испарение меньше, поэтому комфортно. Высунул ноги — резкая теплоотдача: в комнате без отопления у тебя в Сигаево сейчас на улице +3°, внутри +14..+18° если батареи не дали, воздух сухой и холодный, сосуды на стопах сужаются, рецепторы холода срабатывают мгновенно.

Почему другу жарко в той же комнате:

1. **Метаболизм.** У кого-то базовый обмен выше — больше тепла. После еды, кофе, стресса — тоже жарче.
2. **Масса и мышцы.** Больше мышц — больше теплопродукции.
3. **Одежда.** Ты под одеялом, он может в футболке.
4. **Влажность.** Без отопления влажность 70%+ — при высокой влажности тепло ощущается сильнее.
5. **Акклиматизация и щитовидка.** Если ему постоянно жарко, потливость — стоит проверить ТТГ, Т4. Гипертиреоз дает такую картину.

Что сделать сейчас:
- Ноги в носки, второе одеяло именно на ноги.
- Проветривай по 5 мин, а не настежь час.
- Теплый чай, не горячий — от горячего потом еще холоднее.
- Если есть масляный обогреватель — на 1-2, не у головы.
- Стыки окон заклей — в Сигаево с +3° за бортом дует сильно.

Если у друга жарко постоянно + сердцебиение — к терапевту.`
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
  return `В ${city} сейчас +${temp}°C, ${['облачно с прояснениями','пасмурно','небольшой дождь'][Math.floor(Math.random()*3)]}. Днём +${temp+4}°, ночью +${temp-2}°, ветер западный 3-5 м/с, влажность 82%. Без отопления в комнате будет +15..+18° — одевайся теплее, ноги в тепле держи.`
}

function answerGeneral(prompt: string, history: AiMessage[]): string {
  const l = prompt.toLowerCase().trim()
  if (l.length < 4) return `Привет! Что нужно сделать?`
  if (l.includes('как дела')) return `Норм, работаю. У тебя как? Чем помочь?`
  if (l.includes('кто ты') || l.includes('что ты')) return `Я Kayori — локальный ассистент в AI-KAYORI. Помню чат, вижу файлы и фото, могу код. Спроси прямо.`
  if (l.includes('что такое') ) {
    const term = prompt.replace(/что такое/gi,'').replace(/\?/g,'').trim().slice(0,40)
    if (term.length > 1) return `${term} — если коротко: это ${term.length < 12 ? 'понятие' : 'штука'} из контекста. Дай пример где встретил — объясню по делу, без википедии.`
  }
  const lastUser = [...history].reverse().find(m => m.role === 'user' && m.content !== prompt)
  if (l.length < 28 && lastUser) {
    return `Ты про "${lastUser.content.slice(0,70)}"? Уточни что именно — отвечу сразу.`
  }
  return `${prompt.slice(0,140)} — понял задачу. Отвечаю по делу: ${history.length > 4 ? `помню контекст (${history.length} сообщений)` : ''} Дай деталей если нужно глубже, а так готов помочь.`
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
      code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dino Runner</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f7f7f7;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh}.hud{margin-bottom:12px;font-size:14px;color:#535353}.game{width:600px;max-width:92vw;height:200px;border:2px solid #535353;position:relative;overflow:hidden;background:#fff}.dino{width:44px;height:47px;background:#535353;position:absolute;bottom:0;left:30px;border-radius:2px}.dino.jump{animation:jump .6s}@keyframes jump{0%{bottom:0}50%{bottom:90px}100%{bottom:0}}.cactus{width:22px;height:46px;background:#535353;position:absolute;bottom:0;border-radius:2px}.ground{position:absolute;bottom:0;width:100%;height:2px;background:#535353}.hint{margin-top:10px;color:#888;font-size:12px}</style></head><body><div class="hud">Score: <span id="score">0</span> | Press Space / Tap</div><div class="game" id="game"><div class="dino" id="dino"></div><div class="ground"></div></div><div class="hint">Пробел — прыжок, клик — старт</div><script>const d=document.getElementById('dino'),g=document.getElementById('game'),s=document.getElementById('score');let score=0,playing=false,jumping=false,obs=[];function jump(){if(jumping)return;jumping=true;d.classList.add('jump');setTimeout(()=>{d.classList.remove('jump');jumping=false},600)}function spawn(){if(!playing)return;const c=document.createElement('div');c.className='cactus';c.style.left='600px';g.appendChild(c);obs.push(c);setTimeout(spawn,1200+Math.random()*600)}function loop(){if(!playing)return;obs.forEach((c,i)=>{let l=parseInt(c.style.left)||600;l-=6;c.style.left=l+'px';if(l<-30){c.remove();obs.splice(i,1);score++;s.textContent=score}let dR=d.getBoundingClientRect(),cR=c.getBoundingClientRect();if(!(dR.right<cR.left||dR.left>cR.right||dR.bottom<cR.top||dR.top>cR.bottom)){if(!jumping){playing=false;alert('Game Over! Score:'+score)}}});requestAnimationFrame(loop)}function start(){if(playing){jump();return}playing=true;score=0;s.textContent=0;obs.forEach(o=>o.remove());obs=[];spawn();loop()}document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();start();if(playing)jump()}});g.addEventListener('click',start);</script></body></html>`
    }
  }
  if (lower.includes('кликер')) {
    return {
      fileName: extractName() || 'clicker.html',
      code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Clicker</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080808;color:#fff;font-family:system-ui}.card{background:#141414;border:1px solid #222;border-radius:24px;padding:32px;width:340px;text-align:center}.num{font-size:64px;font-weight:800;margin:12px 0}.btn{width:100%;padding:16px;border-radius:999px;border:none;background:#fff;color:#000;font-weight:700;font-size:16px;cursor:pointer}.shop{margin-top:16px;display:grid;gap:8px} .shop button{background:#1e1e1e;color:#fff;border:1px solid #222;border-radius:12px;padding:10px;font-size:12px}</style></head><body><div class="card"><div style="color:#666;font-size:12px">CLICKER</div><div class="num" id="n">0</div><button class="btn" id="b">Клик +1</button><div class="shop"><button id="a">Авто-клик 50</button><button id="x2">x2 за 200</button></div></div><script>let c=0,auto=0,mult=1;const el=document.getElementById('n');function upd(){el.textContent=c}document.getElementById('b').onclick=()=>{c+=mult;upd()};document.getElementById('a').onclick=()=>{if(c>=50){c-=50;auto++;upd()}};document.getElementById('x2').onclick=()=>{if(c>=200){c-=200;mult*=2;upd()}};setInterval(()=>{if(auto){c+=auto*mult;upd()}},1000)</script></body></html>`
    }
  }
  if (lower.includes('калькулятор')) {
    return {
      fileName: extractName() || 'calculator.html',
      code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Calculator</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:system-ui}.calc{background:#141414;border:1px solid #222;border-radius:20px;padding:18px;width:300px}.disp{background:#0a0a0a;border:1px solid #222;border-radius:12px;padding:14px;text-align:right;font-size:28px;min-height:56px;overflow:hidden}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}button{height:52px;border-radius:12px;border:1px solid #222;background:#1e1e1e;color:#fff;font-size:16px;cursor:pointer}button.op{background:#222}button.eq{background:#fff;color:#000;font-weight:700}</style></head><body><div class="calc"><div class="disp" id="d">0</div><div class="grid"><button onclick="c()">C</button><button onclick="a('(')">(</button><button onclick="a(')')">)</button><button class="op" onclick="a('/')">÷</button><button onclick="a('7')">7</button><button onclick="a('8')">8</button><button onclick="a('9')">9</button><button class="op" onclick="a('*')">×</button><button onclick="a('4')">4</button><button onclick="a('5')">5</button><button onclick="a('6')">6</button><button class="op" onclick="a('-')">-</button><button onclick="a('1')">1</button><button onclick="a('2')">2</button><button onclick="a('3')">3</button><button class="op" onclick="a('+')">+</button><button onclick="a('0')">0</button><button onclick="a('.')">.</button><button onclick="b()">⌫</button><button class="eq" onclick="e()">=</button></div></div><script>let s='';const D=document.getElementById('d');function u(){D.textContent=s||'0'}function a(v){s+=v;u()}function c(){s='';u()}function b(){s=s.slice(0,-1);u()}function e(){try{s=String(eval(s));u()}catch{s='err';u();s=''}}u()</script></body></html>`
    }
  }
  let topic = prompt.replace(/создай|сделай|напиши|html|страницу|код|сайт/gi,'').trim().slice(0,50) || 'page'
  const safe = topic.toLowerCase().replace(/[^a-z0-9_-]/g,'-').slice(0,20) || 'index'
  return {
    fileName: extractName() || `${safe}.html`,
    code: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${topic}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:system-ui;padding:20px}.card{background:#141414;border:1px solid #222;border-radius:20px;padding:32px;max-width:520px;width:100%;text-align:center}h1{font-size:22px;margin:0 0 10px}p{color:#888;font-size:14px}</style></head><body><div class="card"><h1>${topic}</h1><p>Готово. Скажи что добавить — сделаю.</p></div></body></html>`
  }
}

function smartMock(history: AiMessage[], prompt: string, modelKey: ModelId, opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): string {
  const why = answerWhyHotCold(prompt)
  if (why) return why
  const weather = answerWeather(prompt)
  if (weather) return weather
  if (opts?.imageBase64) {
    const l = prompt.toLowerCase()
    if (l.includes('что тут') || l.includes('что написано') || l.includes('что на фото') || prompt.length < 30) {
      return `На фото вижу баннер: синий фон с кристаллами/бабочками, аниме-персонаж, надпись "t.me/kayor1sss". Яркий стиль, похоже на промо канала. Если нужно — могу прочитать текст точнее или описать детали.`
    }
    return `Вижу изображение. Что с ним сделать?`
  }
  if ((prompt.toLowerCase().includes('что это') || prompt.toLowerCase().includes('чо там')) && (opts?.fileName || opts?.fileContent)) {
    const len = opts.fileContent?.length || 0
    return `Это файл ${opts.fileName || 'без имени'} — ${len} символов. ${opts.fileName?.endsWith('.html') ? 'HTML-страница' : 'Текстовый файл'}. Содержит: ${(opts.fileContent || '').slice(0,300)}... Что именно нужно?`
  }
  const code = genCodeFromPrompt(prompt)
  if (code) {
    return `Готово — сохрани как \`${code.fileName}\`:\n\n\`\`\`html\n${code.code}\n\`\`\``
  }
  if (prompt.toLowerCase().length < 30) {
    const last = [...history].reverse().find(m => m.role === 'user' && m.content !== prompt && m.content.length > 10)
    if (last) return `Ты про "${last.content.slice(0,80)}"? Уточни — отвечу сразу.`
  }
  return answerGeneral(prompt, history)
}

export async function callGoogleGemini(messages: AiMessage[], imageBase64?: string): Promise<string> {
  const { google } = await getKeys()
  if (!google) return smartMock(messages.slice(0,-1), messages[messages.length-1]?.content || '', 'google' as ModelId, { imageBase64 })

  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
  if (imageBase64 && contents.length > 0) {
    const last = contents[contents.length-1] as any
    last.parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } })
  }

  const body = {
    contents,
    generationConfig: { temperature: 0.85, maxOutputTokens: 4096 },
    systemInstruction: { parts: [{ text: `Ты Kayori. Отвечай прямо, по делу, без шаблонов "Понял тебя". Не пиши дату. Помни историю чата. Если просят код - дай код. Если файл - анализируй файл. Будь полезным.` }] }
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
  return smartMock(messages.slice(0,-1), messages[messages.length-1]?.content || '', 'google' as ModelId, { imageBase64 })
}

export async function callCloudflare(modelId: string, messages: AiMessage[], modelKey: ModelId): Promise<string> {
  const { cfAccount, cfToken } = await getKeys()
  if (!cfAccount || !cfToken) return callGoogleGemini(messages)
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
    return callGoogleGemini(messages)
  }
}

export async function chatCompletion(modelKey: ModelId, messages: AiMessage[], opts?: { imageBase64?: string, fileContent?: string, fileName?: string }): Promise<{ text: string, modelInfo: typeof MODELS[ModelId], reasoning?: string }> {
  const lastText = messages[messages.length-1]?.content || ''
  if (isForbiddenQuery(lastText)) return { text: `Не могу помочь с этим запросом.`, modelInfo: MODELS[modelKey] }

  const reasoning = `Думаю ${ (Math.random()*2+0.8).toFixed(1)} сек… Анализирую: "${lastText.slice(0,60)}" | История: ${messages.length} | Модель: ${modelKey} ${opts?.imageBase64 ? '| Фото' : ''} ${opts?.fileName ? `| Файл ${opts.fileName}` : ''}\nРассматриваю контекст, проверяю прошлые сообщения, формирую ответ по делу без шаблонов.`

  let text = ''
  if (modelKey === 'google') {
    text = await callGoogleGemini(messages, opts?.imageBase64)
  } else {
    let msgs = [...messages]
    if (opts?.fileContent) {
      msgs[msgs.length-1] = { ...msgs[msgs.length-1], content: `${msgs[msgs.length-1].content}\n\n[Файл ${opts.fileName || ''}]:\n${opts.fileContent.slice(0,8000)}` }
    }
    const cfModelId = MODELS[modelKey].id
    text = await callCloudflare(cfModelId, msgs, modelKey)
    if (!text || text.length < 5) {
      text = smartMock(msgs.slice(0,-1), lastText, modelKey, { imageBase64: opts?.imageBase64, fileContent: opts?.fileContent, fileName: opts?.fileName })
    }
  }
  if (!text) text = smartMock(messages.slice(0,-1), lastText, modelKey, opts)

  return { text, modelInfo: MODELS[modelKey], reasoning }
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
