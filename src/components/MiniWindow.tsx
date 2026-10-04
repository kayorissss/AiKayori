import { useEffect, useState } from 'react'

// Мини-окно через Document PiP API если доступно, иначе просто floating
export default function MiniWindow({ children }: { children?: React.ReactNode }) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null)

  const openMini = async () => {
    // @ts-ignore - Document PiP API
    if (window.documentPictureInPicture) {
      try {
        // @ts-ignore
        const win = await window.documentPictureInPicture.requestWindow({ width: 400, height: 600 })
        // copy styles
        ;[...document.styleSheets].forEach((sheet) => {
          try {
            const css = [...sheet.cssRules].map(r => r.cssText).join('')
            const style = win.document.createElement('style')
            style.textContent = css
            win.document.head.appendChild(style)
          } catch {}
        })
        win.document.body.style.background = '#0A0A0A'
        win.document.body.style.margin = '0'
        const container = win.document.createElement('div')
        container.innerHTML = `<div style="padding:16px;color:white;font-family:Inter,sans-serif">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <img src="/logo-kayori.png" style="width:24px;height:24px;border-radius:6px"/>
            <b>AI-Kayori Mini</b> <span style="font-size:10px;opacity:0.6">v1.0.0</span>
          </div>
          <div style="background:#1A1A1A;border:1px solid #333;border-radius:12px;padding:12px;font-size:13px">Мини-окно Kayori — всегда поверх. Перетаскивай, меняй размер.</div>
        </div>`
        win.document.body.appendChild(container)
        setPipWindow(win)
        win.addEventListener('pagehide', () => setPipWindow(null))
      } catch (e) {
        console.error(e)
        alert('PiP не поддерживается в этом браузере. Используй Chrome 111+')
      }
    } else {
      alert('Мини-окно поддерживается в Chrome/Edge с Document PiP API. В Electron — отдельное окно.')
    }
  }

  return (
    <button onClick={openMini} className="text-[11px] px-2.5 py-1 rounded-full bg-kayori-gray border border-kayori-border hover:bg-kayori-lightgray">
      {pipWindow ? 'Мини-окно открыто' : 'Мини-окно'}
    </button>
  )
}
