'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { localeNames, localeColors } from '@/i18n/config'

interface LanguageMarker {
  locale: string
  name: string
  x: number
  y: number
}

const languageMarkers: LanguageMarker[] = [
  { locale: 'en', name: 'English', x: 20, y: 20 },
  { locale: 'zh', name: '中文', x: 75, y: 22 },
  { locale: 'es', name: 'Español', x: 22, y: 34 },
  { locale: 'ar', name: 'العربية', x: 55, y: 26 },
  { locale: 'ja', name: '日本語', x: 85, y: 22 },
  { locale: 'ru', name: 'Русский', x: 62, y: 10 },
  { locale: 'fr', name: 'Français', x: 43, y: 22 },
  { locale: 'de', name: 'Deutsch', x: 50, y: 16 },
  { locale: 'ko', name: '한국어', x: 80, y: 22 },
  { locale: 'hi', name: 'हिन्दी', x: 68, y: 24 },
  { locale: 'pt', name: 'Português', x: 30, y: 36 },
  { locale: 'tr', name: 'Türkçe', x: 56, y: 24 },
  { locale: 'it', name: 'Italiano', x: 48, y: 24 },
  { locale: 'vi', name: 'Tiếng Việt', x: 75, y: 30 },
  { locale: 'th', name: 'ไทย', x: 72, y: 28 },
  { locale: 'id', name: 'Bahasa', x: 78, y: 34 },
  { locale: 'ms', name: 'Melayu', x: 76, y: 36 },
  { locale: 'pl', name: 'Polski', x: 52, y: 12 },
  { locale: 'nl', name: 'Nederlands', x: 44, y: 16 },
  { locale: 'sv', name: 'Svenska', x: 48, y: 8 },
]

const adjacentPairs: [number, number][] = [
  [0, 6], [0, 7], [0, 17], [0, 18],
  [1, 4], [1, 8], [1, 9], [1, 13], [1, 14],
  [2, 10],
  [3, 9], [3, 11], [3, 12],
  [4, 8],
  [5, 7], [5, 17], [5, 18], [5, 19],
  [6, 7], [6, 12], [6, 17], [6, 18],
  [7, 17], [7, 18], [7, 19],
  [8, 4], [8, 1],
  [9, 3], [9, 11], [9, 14],
  [11, 12], [11, 3], [11, 9],
  [12, 6], [12, 7], [12, 11],
  [13, 14], [13, 15], [13, 16], [13, 1],
  [14, 13], [14, 15], [14, 9],
  [15, 13], [15, 14], [15, 16],
  [16, 13], [16, 15],
  [17, 5], [17, 6], [17, 7],
  [18, 5], [18, 6], [18, 7],
  [19, 5], [19, 7],
]

function areAdjacent(a: number, b: number): boolean {
  return adjacentPairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

function generateRandomGroup(usedIndices: Set<number>): number[] {
  const available = languageMarkers.map((_, i) => i).filter(i => !usedIndices.has(i))
  const group: number[] = []
  
  while (available.length > 0 && group.length < 4) {
    const randomIndex = Math.floor(Math.random() * available.length)
    const candidate = available[randomIndex]
    
    const isCompatible = group.every(member => !areAdjacent(member, candidate))
    
    if (isCompatible) {
      group.push(candidate)
      usedIndices.add(candidate)
    }
    
    available.splice(randomIndex, 1)
  }
  
  return group
}

function generateRandomGroups(): number[][] {
  const usedIndices = new Set<number>()
  const groups: number[][] = []
  
  while (usedIndices.size < languageMarkers.length) {
    const group = generateRandomGroup(usedIndices)
    if (group.length > 0) {
      groups.push(group)
    } else {
      break
    }
  }
  
  return groups
}

const bottomLocales = ['en', 'zh', 'es', 'ar', 'ja', 'ru', 'fr', 'de', 'ko', 'hi', 'pt', 'tr']

export default function WorldMap() {
  const locale = useLocale()
  const { cn } = useTheme()
  const [activeIndices, setActiveIndices] = useState<number[]>([])
  const [groups, setGroups] = useState<number[][]>([])

  useEffect(() => {
    setGroups(generateRandomGroups())
  }, [])

  useEffect(() => {
    if (groups.length === 0) return
    
    let groupIndex = 0
    setActiveIndices(groups[0] || [])
    
    const interval = setInterval(() => {
      groupIndex = (groupIndex + 1) % groups.length
      if (groupIndex === 0) {
        setGroups(generateRandomGroups())
      }
      setActiveIndices(groups[groupIndex] || [])
    }, 3000)
    
    return () => clearInterval(interval)
  }, [groups.length])

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 100 50"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
      >
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <rect x="0" y="0" width="100" height="50" fill="url(#oceanGradient)" rx="4" />
        
        <g className="land-masses" fill="url(#landGradient)" stroke="#86efac" strokeWidth="0.2">
          <path d="M15,12 Q20,10 25,12 L28,17 Q25,22 20,20 L15,17 Q12,14 15,12 Z" />
          <path d="M18,24 Q25,21 30,24 L32,39 Q28,44 22,41 L18,34 Q15,29 18,24 Z" />
          <path d="M35,6 Q50,3 55,6 L58,16 Q55,21 45,19 L38,13 Q32,9 35,6 Z" />
          <path d="M42,20 Q55,18 60,22 L62,35 Q58,40 48,38 L42,30 Q38,25 42,20 Z" />
          <path d="M65,9 Q80,6 88,11 L90,26 Q88,33 78,31 L68,21 Q62,13 65,9 Z" />
          <path d="M70,34 Q78,32 82,37 L83,44 Q80,47 75,45 L70,41 Q68,37 70,34 Z" />
          <path d="M8,17 Q12,15 14,18 L13,22 Q10,24 8,22 L7,19 Q6,17 8,17 Z" />
          <path d="M92,20 Q96,18 98,22 L97,27 Q94,30 92,27 L91,23 Q90,20 92,20 Z" />
        </g>
        
        {languageMarkers.map((marker, index) => {
          const isActive = activeIndices.includes(index)
          const color = localeColors[marker.locale] || '#6B7280'
          
          return (
            <Link
              key={marker.locale}
              href={`/${marker.locale}/discover`}
              prefetch={false}
            >
              <g className="cursor-pointer">
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r="2"
                  fill={color}
                  stroke="white"
                  strokeWidth="0.4"
                  filter="url(#glow)"
                />
                {isActive && (
                  <>
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r="1.5"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="0.25"
                      className="animate-map-pulse"
                    />
                    <text
                      x={marker.x}
                      y={marker.y - 4}
                      textAnchor="middle"
                      fontSize="2.5"
                      fontWeight="600"
                      fill={color}
                      className="pointer-events-none animate-fade-in"
                    >
                      {localeNames[marker.locale] || marker.locale}
                    </text>
                  </>
                )}
              </g>
            </Link>
          )
        })}
      </svg>
      
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {bottomLocales.map((loc) => {
          const marker = languageMarkers.find(m => m.locale === loc)
          if (!marker) return null
          return (
            <Link
              key={loc}
              href={`/${loc}/discover`}
              prefetch={false}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${cn.colors.bg.card} border ${cn.colors.border.default} hover:shadow-md transition-all duration-200`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: localeColors[loc] || '#6B7280' }}
              />
              <span className={cn.colors.text.primary}>{localeNames[loc] || loc}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
