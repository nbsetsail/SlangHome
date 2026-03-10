'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

const EMOJI_CATEGORIES = {
  smileys: {
    icon: '😊',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  },
  gestures: {
    icon: '👋',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏']
  },
  hearts: {
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️']
  },
  animals: {
    icon: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊']
  },
  food: {
    icon: '🍕',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥖', '🥨', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🫔', '🥫', '🍖', '🍗', '🥩', '🍠', '🥔', '🍚', '🍜', '🍝', '🍣', '🍤', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹']
  },
  objects: {
    icon: '💡',
    emojis: ['💡', '🔦', '🏮', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💽', '💾', '💿', '📀', '🎥', '📷', '📸', '📹', '📼', '🔍', '🔎', '🔬', '🔭', '📡', '💈', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🧺', '🧻', '🚽', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌']
  },
  symbols: {
    icon: '💯',
    emojis: ['💯', '❤️‍🔥', '🔥', '✨', '🌟', '💫', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎖️', '🏅', '🥇', '🥈', '🥉', '👑', '👸', '🤴', '💍', '💎', '🎤', '🎧', '🎵', '🎶', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🪗']
  }
}

interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onEmojiSelect: (emoji: string) => void
  anchorEl?: HTMLElement | null
}

export default function EmojiPicker({ isOpen, onClose, onEmojiSelect, anchorEl }: EmojiPickerProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys')
  const [searchQuery, setSearchQuery] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      const pickerHeight = 350
      const pickerWidth = 320
      
      let top = rect.bottom + 8
      let left = rect.left
      
      if (top + pickerHeight > window.innerHeight) {
        top = rect.top - pickerHeight - 8
      }
      
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 16
      }
      
      setPosition({ top, left })
    }
  }, [isOpen, anchorEl])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) && 
          anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, anchorEl])

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    onClose()
  }

  const getFilteredEmojis = () => {
    const categoryEmojis = EMOJI_CATEGORIES[activeCategory].emojis
    if (!searchQuery) return categoryEmojis
    
    const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis)
    const uniqueEmojis = [...new Set(allEmojis)]
    return uniqueEmojis.filter(() => true)
  }

  if (!isOpen) return null

  return (
    <div
      ref={pickerRef}
      className={`fixed z-50 ${cn.colors.bg.card} rounded-lg shadow-xl border ${cn.colors.border.default} w-80`}
      style={{ top: position.top, left: position.left }}
    >
      <div className={`p-2 border-b ${cn.colors.border.default}`}>
        <div className="flex gap-1 overflow-x-auto">
          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as keyof typeof EMOJI_CATEGORIES)}
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded ${
                activeCategory === key 
                  ? cn.colors.bg.primary + ' text-white' 
                  : cn.colors.bg.light + ' ' + cn.colors.bg.lightHover
              }`}
              title={t(`comments.emojiCategories.${key}`)}
            >
              {category.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {getFilteredEmojis().map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className={`w-8 h-8 flex items-center justify-center text-xl rounded ${cn.colors.bg.lightHover} transition-transform hover:scale-125`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className={`p-2 border-t ${cn.colors.border.default}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${cn.colors.text.muted}`}>
            {t('comments.clickToAdd')}
          </span>
          <button
            onClick={onClose}
            className={`text-xs ${cn.colors.text.muted} hover:${cn.colors.text.primary}`}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export { EMOJI_CATEGORIES }
