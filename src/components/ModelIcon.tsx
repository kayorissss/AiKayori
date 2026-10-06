import { MODELS } from '@/lib/version'

type Props = { modelKey: string; size?: number; className?: string }

export default function ModelIcon({ modelKey, size = 20, className = '' }: Props) {
  const m = (MODELS as any)[modelKey]
  const iconType = m?.icon || modelKey
  const color = m?.color || '#888'

  if (iconType === 'gemini') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <defs><linearGradient id={`g-gem-${size}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4285F4"/><stop offset="100%" stopColor="#8AB4F8"/></linearGradient></defs>
        <path d="M12 0C12 0 13.5 5.5 18 7C13.5 8.5 12 14 12 14C12 14 10.5 8.5 6 7C10.5 5.5 12 0 12 0Z" fill={`url(#g-gem-${size})`}/>
        <path d="M19 11C19 11 19.8 13.2 22 14C19.8 14.8 19 17 19 17C19 17 18.2 14.8 16 14C18.2 13.2 19 11 19 11Z" fill="#8AB4F8" opacity="0.9"/>
      </svg>
    )
  }
  if (iconType === 'deepseek') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill="#0A84FF" opacity="0.15"/><path d="M7 12L12 7L17 12L12 17L7 12Z" fill="#0A84FF"/><circle cx="12" cy="12" r="2.5" fill="white"/>
      </svg>
    )
  }
  if (iconType === 'glm') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill="#7C3AED" opacity="0.15"/><rect x="7" y="7" width="10" height="10" rx="2" fill="#7C3AED"/><path d="M9 12H15M12 9V15" stroke="white" strokeWidth="1.5"/>
      </svg>
    )
  }
  if (iconType === 'tencent') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill="#00D492" opacity="0.15"/><path d="M12 6C12 6 16 8 16 12C16 16 12 18 12 18C12 18 8 16 8 12C8 8 12 6 12 6Z" fill="#00D492"/><circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    )
  }
  if (iconType === 'mistral') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill="#FF6B35" opacity="0.15"/><path d="M6 16L8.5 8L12 13L15.5 8L18 16" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (iconType === 'qwen') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill="#A78BFA" opacity="0.15"/><path d="M12 6C8.5 6 6 8.5 6 12C6 15.5 8.5 18 12 18C13.5 18 14.8 17.6 15.8 16.9L17.5 18.5L19 17L17.2 15.2C18 14.2 18.5 13 18.5 12C18.5 8.5 16 6 12 6Z" fill="#A78BFA"/>
      </svg>
    )
  }
  if (iconType === 'orca') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" fill="white" opacity="0.1"/><path d="M12 4L18 8V16L12 20L6 16V8L12 4Z" stroke="white" strokeWidth="1.5" fill="white" opacity="0.2"/><circle cx="12" cy="12" r="2" fill="white"/>
      </svg>
    )
  }
  return <div style={{ width: size, height: size, background: color + '20', border: `1px solid ${color}30`, color }} className={`rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${className}`}>{m?.short || '?'}</div>
}
