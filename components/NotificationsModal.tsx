'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ContentLoader, ErrorMessage } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'
import { parseUTCDate } from '@/lib/date-utils'

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const { data: session } = useSession()
  const { cn } = useTheme()
  const router = useRouter()
  const { t } = useTranslation()
  
  const notificationIcons: Record<string, { icon: string; color: string }> = {
    comment: { icon: '💬', color: cn.colors.bg.light },
    like: { icon: '❤️', color: 'bg-red-100' },
    favorite: { icon: '⭐', color: 'bg-yellow-100' },
    reply: { icon: '↩️', color: 'bg-blue-100' },
    system: { icon: '🔔', color: 'bg-gray-100' },
    report_result: { icon: '✅', color: 'bg-green-100' }
  }
  
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchNotifications()
    }
  }, [isOpen, session, filter])

  const fetchNotifications = async () => {
    if (!session?.user?.id) return
    
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      params.append('userId', session.user.id)
      if (filter === 'unread') params.append('isRead', 'false')
      
      const response = await fetch(`/api/notifications?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      } else {
        throw new Error(data.error || 'Failed to fetch notifications')
      }
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const params = new URLSearchParams()
      params.append('id', notificationId.toString())
      params.append('userId', session!.user!.id)
      
      await fetch(`/api/notifications?${params.toString()}`, {
        method: 'PUT'
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const params = new URLSearchParams()
      params.append('markAllRead', 'true')
      params.append('userId', session!.user!.id)
      
      await fetch(`/api/notifications?${params.toString()}`, {
        method: 'PUT'
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    if (notification.link) {
      onClose()
      router.push(notification.link)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div className="fixed z-[70] top-0 right-0 flex items-start justify-end pt-16 pr-2 sm:pr-4">
        <div 
          ref={modalRef}
          className={`${cn.colors.bg.card} rounded-lg shadow-xl w-80 sm:w-96 max-h-[60vh] flex flex-col`}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className={`text-lg font-bold ${cn.title}`}>{t('notifications.title')}</h2>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`text-sm ${cn.link}`}
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
              <button
                onClick={onClose}
                className={`p-1.5 rounded-full ${cn.colors.text.muted} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex border-b">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 text-center text-sm font-medium ${
                filter === 'all' 
                  ? `${cn.colors.text.primary} border-b-2 ${cn.colors.border.primary}` 
                  : `${cn.colors.text.muted} ${cn.colors.text.mutedHover}`
              }`}
            >
              {t('notifications.all')}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-2 text-center text-sm font-medium ${
                filter === 'unread' 
                  ? `${cn.colors.text.primary} border-b-2 ${cn.colors.border.primary}` 
                  : `${cn.colors.text.muted} ${cn.colors.text.mutedHover}`
              }`}
            >
              {t('notifications.unread')} {unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4">
                <ErrorMessage message={error} type="error" />
              </div>
            )}

            {loading ? (
              <div className="p-8">
                <ContentLoader text={t('notifications.loading')} />
              </div>
            ) : notifications.length === 0 ? (
              <div className={`p-8 text-center ${cn.colors.text.muted} text-sm`}>
                {filter === 'unread' ? t('notifications.noUnread') : t('notifications.noNotifications')}
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const iconInfo = notificationIcons[notification.type] || notificationIcons.system
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 ${cn.colors.bg.cardHover} cursor-pointer ${
                        !notification.is_read ? cn.colors.bg.light : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconInfo.color}`}>
                          <span className="text-sm">{iconInfo.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.is_read ? `font-medium ${cn.colors.text.secondary}` : cn.colors.text.muted}`}>
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className={`text-xs ${cn.colors.text.muted} mt-1 truncate`}>
                              {notification.content}
                            </p>
                          )}
                          <p className={`text-xs ${cn.colors.text.muted} mt-1`}>
                            {parseUTCDate(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className={`w-2 h-2 ${cn.colors.bg.primary} rounded-full mt-1 shrink-0`}></div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
