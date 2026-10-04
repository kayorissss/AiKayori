import { MODELS } from '@/lib/version'

type Props = {
  modelKey: string
  size?: number
  className?: string
}

export default function ModelIcon({ modelKey, size = 20, className = '' }: Props) {
  const m = (MODELS as any)[modelKey]
  const iconType = m?.icon || modelKey
  const color = m?.color || '#888'

  if (iconType === 'gemini') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <defs>
          <linearGradient id={`g-gem-${size}-${modelKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor="#8AB4F8" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path d="M12 0C12 0 13.5 5.5 18 7C13.5 8.5 12 14 12 14C12 14 10.5 8.5 6 7C10.5 5.5 12 0 12 0Z" fill={`url(#g-gem-${size}-${modelKey})`} />
        <path d="M19 11C19 11 19.8 13.2 22 14C19.8 14.8 19 17 19 17C19 17 18.2 14.8 16 14C18.2 13.2 19 11 19 11Z" fill="#8AB4F8" opacity="0.9" />
        <path d="M5 13C5 13 5.6 14.6 7.5 15.2C5.6 15.8 5 17.5 5 17.5C5 17.5 4.4 15.8 2.5 15.2C4.4 14.6 5 13 5 13Z" fill="#8AB4F8" opacity="0.7" />
      </svg>
    )
  }

  if (iconType === 'openai') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="11" fill="#10A37F" opacity="0.15" />
        <path
          d="M19.7 13.5a4.3 4.3 0 0 0-.4-3.5 4.4 4.4 0 0 0-3.3-2.1V7a4.4 4.4 0 0 0-3.8-4.4 4.4 4.4 0 0 0-4.3 2.5 4.4 4.4 0 0 0-3 1.8 4.3 4.3 0 0 0-.3 3.6 4.4 4.4 0 0 0 .4 3.5 4.4 4.4 0 0 0 3.3 2.1V17a4.4 4.4 0 0 0 3.8 4.4 4.4 4.4 0 0 0 4.3-2.5 4.4 4.4 0 0 0 3-1.8 4.3 4.3 0 0 0 .3-3.6z"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2" fill={color} />
      </svg>
    )
  }

  if (iconType === 'llama') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <defs>
          <linearGradient id={`g-ll-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill={`url(#g-ll-${size})`} opacity="0.15" />
        <path d="M8 9C8 7.5 9.5 6 12 6C14.5 6 16 7.5 16 9C16 10 15.5 11 14.5 11.5V14C14.5 15 13.5 16 12 16C10.5 16 9.5 15 9.5 14V11.5C8.5 11 8 10 8 9Z" fill={color} />
        <circle cx="10" cy="9.5" r="1" fill="white" />
        <circle cx="14" cy="9.5" r="1" fill="white" />
        <path d="M7 8C6 6 7 4 8.5 5M17 8C18 6 17 4 15.5 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }

  if (iconType === 'mistral') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="11" fill="#FF6B35" opacity="0.15" />
        <path d="M6 16L8.5 8L12 13L15.5 8L18 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="16" r="1.5" fill={color} />
      </svg>
    )
  }

  if (iconType === 'qwen') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="11" fill="#7C3AED" opacity="0.15" />
        <path d="M12 6C8.5 6 6 8.5 6 12C6 15.5 8.5 18 12 18C13.5 18 14.8 17.6 15.8 16.9L17.5 18.5L19 17L17.2 15.2C18 14.2 18.5 13 18.5 12C18.5 8.5 16 6 12 6Z" fill={color} />
        <path d="M12 8C9.5 8 8 9.8 8 12C8 14.2 9.5 16 12 16C12.8 16 13.5 15.8 14 15.5L14 12L12 12L12 8Z" fill="white" opacity="0.9" />
      </svg>
    )
  }

  return (
    <div style={{ width: size, height: size, background: color + '20', border: `1px solid ${color}40`, color }} className={`rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${className}`}>
      {m?.short || '?'}
    </div>
  )
}
