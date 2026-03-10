'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslation } from '@/hooks'
import NotificationsModal from './NotificationsModal'
import ColorThemeModal from './ColorThemeModal'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTheme } from '@/contexts/ThemeContext'

const DEFAULT_NOTIFICATION_POLL_INTERVAL = 300000

interface NavBarProps {
  showLoginModal?: () => void
  showAddSlangModal?: () => void
}

export default function NavBar({ showLoginModal }: NavBarProps) {
  const { data: session, status } = useSession({ required: false })
  const { cn } = useTheme()
  const locale = useLocale()
  const { t } = useTranslation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showColorTheme, setShowColorTheme] = useState(false)
  const [notificationPollInterval, setNotificationPollInterval] = useState(DEFAULT_NOTIFICATION_POLL_INTERVAL)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
    
    const fetchNotificationConfig = async () => {
      try {
        const response = await fetch('/api/config/notification')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.config?.pollIntervalMs) {
            setNotificationPollInterval(data.data.config.pollIntervalMs)
          }
        }
      } catch (err) {
        console.error('Error fetching notification config:', err)
      }
    }

    fetchNotificationConfig()
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      const fetchNotifications = async () => {
        try {
          const params = new URLSearchParams()
          params.append('userId', session.user.id)
          params.append('isRead', 'false')
          
          const response = await fetch(`/api/notifications?${params.toString()}`)
          const data = await response.json()
          
          if (data.success) {
            setUnreadNotifications(data.data.unreadCount || 0)
          }
        } catch (err) {
          console.error('Error fetching notification count:', err)
        }
      }
      
      // 立即执行一次
      fetchNotifications()

      // 每小时轮询一次（首次查询后1小时开始）
      const ONE_HOUR = 60 * 60 * 1000 // 1小时 = 3600000ms
      const interval = setInterval(fetchNotifications, ONE_HOUR)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const userMenu = document.querySelector('.absolute.right-0.top-full')
      const userMenuButton = document.getElementById('user-menu-button')
      
      if (userMenu && userMenuButton && !userMenu.contains(event.target as Node) && !userMenuButton.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (isClient) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isClient, showUserMenu])

  const handleSignOut = async () => {
    const currentUrl = window.location.href
    const currentPath = window.location.pathname
    const isPhraseDetailPage = currentPath.startsWith('/slang/phrase/')
    const redirectUrl = isPhraseDetailPage ? currentUrl : `/${locale}`
    
    await signOut({ redirectTo: redirectUrl })
  }

  return (
    <div ref={navRef} className="flex items-center gap-1 min-[1000px]:gap-2">
      <nav className="flex items-center gap-1 shrink-0">
        <Link
          href={`/${locale}/search`}
          className={`flex items-center gap-1.5 p-2 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
          title={t('nav.advancedSearch')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 7h.01M13 7h.01M10 10h.01M13 10h.01" />
          </svg>
          <span className="text-sm font-medium hidden min-[1000px]:inline">{t('nav.advancedSearch')}</span>
        </Link>
        
        <Link
          href={`/${locale}/contribute`}
          className={`flex items-center gap-1.5 p-2 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
          title={t('nav.addSlang')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium hidden min-[1000px]:inline">{t('nav.addSlang')}</span>
        </Link>
        
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden md:block"></div>
        
        <Link
          href={`/${locale}/feedback`}
          className={`flex items-center gap-1.5 p-2 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
          title={t('nav.feedback')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-sm font-medium hidden min-[1000px]:inline">{t('nav.feedback')}</span>
        </Link>
        
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden min-[1000px]:block"></div>
        
        <LanguageSwitcher />
        
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden min-[1000px]:block"></div>
        
        <div className="relative flex items-center">
          {session?.user ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
                title={t('nav.notifications')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
              
              <div 
                className="relative"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button 
                  id="user-menu-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg ${cn.colors.text.primary} ${cn.colors.text.primaryHover} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200`}
                >
                  {(session.user as any)?.avatar ? (
                    <Image 
                      src={(session.user as any).avatar.split('?')[0]}
                      alt="Avatar" 
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full pt-2 z-50">
                    <div className={`w-48 ${cn.colors.bg.card} rounded-lg shadow-lg py-1 border ${cn.colors.border.default} overflow-hidden`}>
                    <div className={`px-4 py-2 border-b ${cn.colors.border.default}`}>
                      <p className={`text-sm font-medium ${cn.colors.text.primary}`}>{session.user.name || session.user.email?.split('@')[0]}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    </div>
                    <a 
                      href={`/${locale}/profile`} 
                      className="flex items-center gap-2 px-4 py-2 text-sm w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('nav.profile')}
                    </a>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        setShowUserMenu(false)
                        setShowColorTheme(true)
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      {t('nav.colorTheme')}
                    </button>
                    <div className={`border-t ${cn.colors.border.default} mt-1 pt-1`}>
                    {(session.user?.role === 'moderator' || session.user?.role === 'admin') && (
                      <a 
                        href="/mgr" 
                        className="flex items-center gap-2 px-4 py-2 text-sm w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={(e) => {
                          e.preventDefault()
                          setShowUserMenu(false)
                          window.location.href = '/mgr'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {session.user.role === 'admin' ? t('nav.adminPanel') : t('nav.moderatorPanel')}
                      </a>
                    )}
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          setShowUserMenu(false)
                          handleSignOut()
                        }}
                        className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={showLoginModal} 
              className={`flex items-center gap-1.5 p-2 min-[1000px]:px-3 min-[1000px]:py-1.5 rounded-lg ${cn.primaryButton} transition-all duration-200`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium hidden min-[1000px]:inline">{t('nav.signIn')}</span>
            </button>
          )}
        </div>
      </nav>

      <NotificationsModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      <ColorThemeModal
        isOpen={showColorTheme}
        onClose={() => setShowColorTheme(false)}
      />
    </div>
  )
}
