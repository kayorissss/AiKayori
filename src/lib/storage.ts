import { openDB, DBSchema } from 'idb'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  modelId?: string
  modelName?: string
  attachments?: { type: 'image' | 'file', url: string, name?: string, content?: string }[]
  isGenerating?: boolean
}

export interface Chat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  modelId: string
  draft?: string // сохранённый черновик если перешёл в другой чат
}

interface KayoriDB extends DBSchema {
  chats: {
    key: string
    value: Chat
    indexes: { 'by-updated': number }
  }
  settings: {
    key: string
    value: any
  }
}

let dbPromise: any = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<KayoriDB>('kayori-db', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' })
          chatStore.createIndex('by-updated', 'updatedAt')
          db.createObjectStore('settings')
        }
        if (oldVersion < 2) {
          // ensure settings store exists
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings')
          }
        }
      }
    })
  }
  return dbPromise
}

export async function saveChat(chat: Chat) {
  const db = await getDB()
  await db.put('chats', chat)
}

export async function getAllChats(): Promise<Chat[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('chats', 'by-updated')
  return all.reverse() // newest first
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const db = await getDB()
  return db.get('chats', id)
}

export async function deleteChat(id: string) {
  const db = await getDB()
  await db.delete('chats', id)
}

export async function saveSetting(key: string, value: any) {
  const db = await getDB()
  await db.put('settings', value, key)
}

export async function getSetting<T>(key: string, def?: T): Promise<T | undefined> {
  const db = await getDB()
  const v = await db.get('settings', key)
  return v ?? def
}

// Draft persistence for input memory
export async function saveDraft(chatId: string, draft: string) {
  const chat = await getChat(chatId)
  if (chat) {
    chat.draft = draft
    await saveChat(chat)
  }
  // also global draft for new chat
  if (chatId === 'new') {
    await saveSetting('global-draft', draft)
  }
}
