'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { ThemeName, getThemeNames, getThemeClassNames, defaultTheme, themes } from '@/lib/theme'

interface ThemeContextType {
  currentTheme: ThemeName
  cn: ReturnType<typeof getThemeClassNames>
  setTheme: (themeName: ThemeName) => void
  themeList: ThemeName[]
  isThemeLoaded: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'slang-theme-preference'

const validThemes: ThemeName[] = getThemeNames()

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme)
  const [isThemeLoaded, setIsThemeLoaded] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null
    if (savedTheme && validThemes.includes(savedTheme)) {
      setCurrentTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      // Use neutral as default theme
      document.documentElement.setAttribute('data-theme', defaultTheme)
    }
    setIsThemeLoaded(true)
  }, [])

  const setTheme = useCallback((themeName: ThemeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem(THEME_STORAGE_KEY, themeName)
    document.documentElement.setAttribute('data-theme', themeName)
    
    // Optional: Add smooth transition class for theme change
    document.documentElement.classList.add('theme-transition')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 300) // Match CSS transition duration
  }, [])

  // Memoize theme class names to prevent unnecessary re-renders
  const cn = useMemo(() => {
    return getThemeClassNames(currentTheme)
  }, [currentTheme])

  const themeList = useMemo(() => {
    return getThemeNames()
  }, [])

  return (
    <ThemeContext.Provider value={{ currentTheme, cn, setTheme, themeList, isThemeLoaded }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export { ThemeContext }
