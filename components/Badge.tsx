'use client'
import React from 'react'
import Image from 'next/image'

const RANK_COLORS: Record<string, { bg: string; text: string; border: string; gradient?: string }> = {
  Bronze: { bg: '#CD7F32', text: '#fff', border: '#8B4513' },
  Silver: { bg: '#C0C0C0', text: '#333', border: '#808080' },
  Gold: { bg: '#FFD700', text: '#333', border: '#B8860B' },
  Platinum: { bg: '#E5E4E2', text: '#333', border: '#A0A0A0' },
  Diamond: { bg: '#B9F2FF', text: '#333', border: '#00CED1' },
  Master: { bg: '#9370DB', text: '#fff', border: '#6A5ACD' },
  Grandmaster: { bg: '#FF4500', text: '#fff', border: '#CC3700' },
  Legend: { bg: '#FFD700', text: '#333', border: '#FF8C00', gradient: 'linear-gradient(135deg, #FFD700, #FF8C00, #FFD700)' }
}

interface RankBadgeProps {
  rank: string
  level: number
  size?: 'sm' | 'md' | 'lg'
}

export function RankBadge({ rank, level, size = 'md' }: RankBadgeProps) {
  const colors = RANK_COLORS[rank] || RANK_COLORS.Bronze
  const sizeMap = {
    sm: { height: 24, fontSize: 10 },
    md: { height: 28, fontSize: 11 },
    lg: { height: 32, fontSize: 12 }
  }
  const s = sizeMap[size]

  return (
    <div 
      className="inline-flex items-center rounded-full overflow-hidden"
      style={{ 
        height: s.height,
        background: colors.gradient || colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 1px 3px ${colors.border}40`
      }}
    >
      <div 
        className="flex items-center justify-center px-2"
        style={{ 
          fontSize: s.fontSize, 
          fontWeight: 600, 
          color: colors.text,
          borderRight: `1px solid ${colors.border}50`
        }}
      >
        Lv{level}
      </div>
      <div 
        className="flex items-center justify-center px-2"
        style={{ fontSize: s.fontSize, fontWeight: 500, color: colors.text }}
      >
        {rank}
      </div>
    </div>
  )
}

const ACHIEVEMENT_CONFIG: Record<string, {
  name: string
  icon: (size: number) => React.ReactNode
  color: { bg: string; text: string; border: string }
}> = {
  streak: {
    name: 'Win Streak',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FF6B35" stroke="#E85A2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: { bg: '#FFF4E6', text: '#FF6B35', border: '#FF6B35' }
  },
  perfect: {
    name: 'Perfect Score',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#10B981" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: { bg: '#ECFDF5', text: '#10B981', border: '#10B981' }
  },
  all_correct: {
    name: 'All Correct',
    icon: (size: number) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: { bg: '#EFF6FF', text: '#3B82F6', border: '#3B82F6' }
  }
}

interface AchievementBadgeProps {
  type: string
  value: number
  size?: 'sm' | 'md' | 'lg'
}

export function AchievementBadge({ type, value, size = 'md' }: AchievementBadgeProps) {
  const config = ACHIEVEMENT_CONFIG[type] || ACHIEVEMENT_CONFIG.streak
  const sizeMap = {
    sm: { height: 22, iconSize: 14, fontSize: 10, padding: '4px 8px' },
    md: { height: 26, iconSize: 16, fontSize: 11, padding: '4px 10px' },
    lg: { height: 30, iconSize: 18, fontSize: 12, padding: '5px 12px' }
  }
  const s = sizeMap[size]

  return (
    <div 
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{ 
        height: s.height,
        padding: s.padding,
        background: config.color.bg,
        border: `1px solid ${config.color.border}`,
        color: config.color.text
      }}
    >
      {config.icon(s.iconSize)}
      <span style={{ fontSize: s.fontSize, fontWeight: 500 }}>{config.name}</span>
      <span 
        className="rounded-full flex items-center justify-center"
        style={{ 
          fontSize: s.fontSize - 1, 
          fontWeight: 600,
          background: config.color.text,
          color: config.color.bg,
          width: s.iconSize + 4,
          height: s.iconSize + 4
        }}
      >
        {value}
      </span>
    </div>
  )
}

interface UserDisplayProps {
  username: string
  avatar?: string
  rank?: string
  level?: number
  showRank?: boolean
  achievement?: { type: string; value: number } | null
  showAchievement?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function UserDisplay({ 
  username, 
  avatar, 
  rank, 
  level, 
  showRank = true,
  achievement,
  showAchievement = true,
  size = 'md' 
}: UserDisplayProps) {
  const sizeMap = {
    sm: { avatarSize: 24, fontSize: 12, gap: 6 },
    md: { avatarSize: 32, fontSize: 14, gap: 8 },
    lg: { avatarSize: 40, fontSize: 16, gap: 10 }
  }
  const s = sizeMap[size]

  const getAvatarUrl = () => {
    if (avatar) {
      return avatar.startsWith('/') ? avatar : `/${avatar}`
    }
    return null
  }

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <div className="flex items-center" style={{ gap: s.gap }}>
        <div 
          className="rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0"
          style={{ width: s.avatarSize, height: s.avatarSize }}
        >
          {getAvatarUrl() ? (
            <Image src={getAvatarUrl()!} alt={username} width={s.avatarSize} height={s.avatarSize} className="w-full h-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="text-gray-500" style={{ width: s.avatarSize * 0.6, height: s.avatarSize * 0.6 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
        <span style={{ fontSize: s.fontSize, fontWeight: 500 }} className="text-gray-800">{username}</span>
      </div>
      {showRank && rank && level && (
        <RankBadge rank={rank} level={level} size={size === 'lg' ? 'md' : 'sm'} />
      )}
      {showAchievement && achievement && (
        <AchievementBadge type={achievement.type} value={achievement.value} size={size === 'lg' ? 'md' : 'sm'} />
      )}
    </div>
  )
}
