import { create } from 'zustand'
import { Chat, ChatMessage, saveChat, getAllChats, deleteChat as deleteChatDB, getSetting, saveSetting } from '@/lib/storage'
import { ModelId } from '@/lib/version'

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  isGenerating: boolean
  currentModel: ModelId
  draft: string
  searchQuery: string
  setSearchQuery: (q: string) => void
  setDraft: (d: string) => void
  setModel: (m: ModelId) => void
  loadChats: () => Promise<void>
  createNewChat: () => string
  setActiveChat: (id: string | null) => void
  addMessage: (chatId: string, msg: ChatMessage) => Promise<void>
  updateLastMessage: (chatId: string, content: string) => Promise<void>
  finalizeLastMessage: (chatId: string, content: string) => Promise<void>
  deleteChat: (id: string) => Promise<void>
  renameChat: (id: string, title: string) => Promise<void>
  clearAll: () => Promise<void>
}

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  isGenerating: false,
  currentModel: 'google' as ModelId, // default Gemini for best UX
  draft: '',
  searchQuery: '',

  setSearchQuery: (q) => set({ searchQuery: q }),
  setDraft: (d) => set({ draft: d }),
  setModel: async (m) => {
    set({ currentModel: m })
    await saveSetting('current-model', m)
  },

  loadChats: async () => {
    let chats = await getAllChats()
    // Fix: clear stale isGenerating flags that cause "печатает" forever
    chats = chats.map(c => ({
      ...c,
      messages: c.messages.map(m => m.isGenerating ? { ...m, isGenerating: false, content: m.content || 'Ответ прерван — попробуй ещё раз.' } : m)
    }))
    // Save cleaned chats
    for (const c of chats) {
      if (c.messages.some(m => (m as any).wasGenerating)) await saveChat(c)
    }
    const model = await getSetting<ModelId>('current-model', 'google' as ModelId)
    const draft = await getSetting<string>('global-draft', '')
    set({ chats, currentModel: model || 'google', draft: draft || '' })
  },

  createNewChat: () => {
    const id = genId()
    const newChat: Chat = {
      id,
      title: 'Новый чат',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: get().currentModel,
      draft: get().draft
    }
    saveChat(newChat)
    set(state => ({ chats: [newChat, ...state.chats], activeChatId: id }))
    return id
  },

  setActiveChat: (id) => set({ activeChatId: id }),

  addMessage: async (chatId, msg) => {
    const { chats } = get()
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    const updated: Chat = {
      ...chat,
      messages: [...chat.messages, msg],
      updatedAt: Date.now(),
      title: chat.messages.length === 0 && msg.role === 'user' ? msg.content.slice(0, 48) : chat.title
    }
    await saveChat(updated)
    set({ chats: chats.map(c => c.id === chatId ? updated : c) })
  },

  updateLastMessage: async (chatId, content) => {
    const { chats } = get()
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    const msgs = [...chat.messages]
    if (msgs.length === 0) return
    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
    const updated = { ...chat, messages: msgs, updatedAt: Date.now() }
    await saveChat(updated)
    set({ chats: chats.map(c => c.id === chatId ? updated : c) })
  },

  finalizeLastMessage: async (chatId, content) => {
    const { chats } = get()
    const chat = chats.find(c => c.id === chatId)
    if (!chat) return
    const msgs = [...chat.messages]
    if (msgs.length === 0) return
    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content, isGenerating: false }
    const updated = { ...chat, messages: msgs, updatedAt: Date.now() }
    await saveChat(updated)
    set({ chats: chats.map(c => c.id === chatId ? updated : c) })
  },

  deleteChat: async (id) => {
    await deleteChatDB(id)
    set(state => ({
      chats: state.chats.filter(c => c.id !== id),
      activeChatId: state.activeChatId === id ? null : state.activeChatId
    }))
  },

  renameChat: async (id, title) => {
    const { chats } = get()
    const chat = chats.find(c => c.id === id)
    if (!chat) return
    const updated = { ...chat, title }
    await saveChat(updated)
    set({ chats: chats.map(c => c.id === id ? updated : c) })
  },

  clearAll: async () => {
    const { chats } = get()
    for (const c of chats) await deleteChatDB(c.id)
    set({ chats: [], activeChatId: null })
  }
}))
