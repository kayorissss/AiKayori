import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function ImageViewer({ url, onClose }: { url: string | null, onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  if (!url) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-[12px] flex flex-col items-center justify-center p-4" onClick={onClose}>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={e => { e.stopPropagation(); setZoom(z => Math.min(3, z+0.3)) }} className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] text-white flex items-center justify-center hover:bg-white/[0.12]">+</button>
          <button onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.5, z-0.3)) }} className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] text-white flex items-center justify-center hover:bg-white/[0.12]">-</button>
          <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(url) }} className="h-9 px-3 rounded-full bg-white/[0.08] border border-white/[0.1] text-[12px] text-white">Копировать</button>
          <a href={url} download="image.jpg" onClick={e => e.stopPropagation()} className="h-9 px-3 rounded-full bg-white text-black text-[12px] font-bold flex items-center">Скачать</a>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center">×</button>
        </div>
        <motion.img initial={{ scale: 0.9 }} animate={{ scale: zoom }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} src={url} alt="viewer" className="max-w-[90vw] max-h-[85vh] rounded-[12px] object-contain" onClick={e => e.stopPropagation()} />
      </motion.div>
    </AnimatePresence>
  )
}
