'use client'

import React, { useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { themes } from '@/lib/theme'
import { useTranslation } from '@/hooks/useTranslation'

interface ColorThemeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ColorThemeModal({ isOpen, onClose }: ColorThemeModalProps) {
  const { currentTheme, setTheme, themeList, cn } = useTheme()
  const { t } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center ${cn.modalOverlay}`}>
      <div 
        ref={modalRef}
        className={`${cn.modalBg} rounded-lg shadow-xl p-6 w-full max-w-md mx-4`}
      >
        <h2 className={`text-lg font-semibold ${cn.title} mb-2`}>{t('colorTheme.title')}</h2>
        <p className={`${cn.colors.text.muted} text-sm mb-4`}>{t('colorTheme.description')}</p>
        <div className="grid grid-cols-3 gap-4">
          {themeList.map((themeName) => {
            const theme = themes[themeName]
            return (
              <button
                key={theme.name}
                onClick={() => {
                  setTheme(theme.name)
                }}
                className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  currentTheme === theme.name 
                    ? `${cn.colors.border.ring} border-2 ${cn.colors.bg.medium}` 
                    : `border-gray-200 ${cn.colors.bg.lightHover} ${cn.colors.text.primaryHover}`
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-full mb-2 shadow-sm"
                  style={{ backgroundColor: theme.previewColor }}
                />
                <span className={`text-sm font-medium ${cn.colors.text.muted}`}>{theme.label}</span>
                {currentTheme === theme.name && (
                  <div className="absolute top-1 right-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${cn.colors.text.primary}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
