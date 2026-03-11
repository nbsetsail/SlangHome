'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslation } from '@/hooks'
import Navbar from './Navbar'
import { useTheme } from '@/contexts/ThemeContext'

interface HeaderProps {
  showLoginModal?: () => void
  showAddSlangModal?: () => void
}

export default function Header({ showLoginModal, showAddSlangModal }: HeaderProps) {
  const { cn } = useTheme()
  const locale = useLocale()
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const navLinks = [
    { href: `/${locale}/activities`, label: t('nav.activities'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <circle cx="12" cy="15" r="1"/>
      </svg>
    )},
    { href: `/${locale}/subscribe`, label: t('nav.subscribe'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        <path d="M8 7h8M8 11h8M8 15h4"/>
      </svg>
    )},
    { href: `/${locale}/discover`, label: t('nav.discover'), icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
        <path d="M11 8v6M8 11h6"/>
      </svg>
    )}
  ]
  
  return (
    <header className={`${cn.colors.bg.card} shadow-sm sticky top-0 z-50 border-b ${cn.colors.border.default}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center h-14 px-4 sm:px-6 lg:px-8">
          <a href={`/${locale}`} className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="12" cy="12" r="10" className="stroke-blue-400"/>
                <ellipse cx="12" cy="12" rx="10" ry="4" className="stroke-orange-300"/>
                <path d="M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10" className="stroke-green-400"/>
                <path d="M12 2c-2.5 2.5-4 6-4 10s1.5 7.5 4 10" className="stroke-purple-400"/>
                <path d="M2 12h20" className="stroke-gray-400"/>
                <circle cx="12" cy="12" r="2" className="fill-orange-400 stroke-orange-500"/>
              </svg>
            </div>
            <span className={`text-lg sm:text-xl font-bold ${cn.title} ${cn.colors.text.primaryHover} leading-tight hidden sm:block`}>
              SlangHome
            </span>
          </a>
          
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
              >
                {link.icon}
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden ml-4 p-2 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          <div className="flex-1 flex justify-end">
            <Navbar showLoginModal={showLoginModal} showAddSlangModal={showAddSlangModal} />
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${cn.colors.border.default} ${cn.colors.bg.card}`}>
            <nav className="flex flex-col py-2 px-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
                >
                  {link.icon}
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
