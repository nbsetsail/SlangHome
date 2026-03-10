'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import SlangCard from '@/components/SlangCard'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import AddSlangModal from '@/components/AddSlangModal'
import AvatarUploadModal from '@/components/AvatarUploadModal'
import UsernameChangeModal from '@/components/UsernameChangeModal'
import { services } from '@/services'
import { ContentLoader, ErrorMessage } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'
import { cryptoUtils } from '@/lib/utils'
import { locales, localeNames, localeColors } from '@/i18n/config'
import { formatDateTime } from '@/lib/date-utils'

type ContentTab = 'slang' | 'favorites' | 'views' | 'likes' | 'comments'

interface DataCache {
  slang: { [locale: string]: any[] }
  favorites: { [locale: string]: any[] }
  views: any[]
  likes: any[]
  comments: any[]
}

interface LoadingState {
  slang: { [locale: string]: boolean }
  favorites: { [locale: string]: boolean }
  views: boolean
  likes: boolean
  comments: boolean
}

interface LoadedState {
  slang: { [locale: string]: boolean }
  favorites: { [locale: string]: boolean }
  views: boolean
  likes: boolean
  comments: boolean
}

export default function UserProfilePage() {
  const params = useParams()
  const urlLocale = params?.locale ? (params.locale as string) : 'en'
  const { data: session, status, update } = useSession()
  const { t } = useTranslation()
  const { cn, currentTheme } = useTheme()

  const [contentLocale, setContentLocale] = useState(urlLocale)
  const [activeTab, setActiveTab] = useState<ContentTab>('slang')
  
  const [dataCache, setDataCache] = useState<DataCache>({
    slang: {},
    favorites: {},
    views: [],
    likes: [],
    comments: []
  })
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    slang: {},
    favorites: {},
    views: false,
    likes: false,
    comments: false
  })
  
  const [loadedState, setLoadedState] = useState<LoadedState>({
    slang: {},
    favorites: {},
    views: false,
    likes: false,
    comments: false
  })
  
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    comments: 0,
    commentLikes: 0,
    slangByLocale: {} as Record<string, number>,
    favoritesByLocale: {} as Record<string, number>
  })
  
  const slangTotal = Object.values(stats.slangByLocale).reduce((a, b) => a + b, 0)
  const favoritesTotal = Object.values(stats.favoritesByLocale).reduce((a, b) => a + b, 0)
  
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'default' | 'success' | 'error' | 'warning'>('default')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    gender: '',
    bio: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const fetchSlangData = useCallback(async (locale: string, forceRefresh = false) => {
    if (!session?.user) return
    
    const userId = (session.user as any).id
    if (!forceRefresh && loadedState.slang[locale]) return
    
    setLoadingState(prev => ({
      ...prev,
      slang: { ...prev.slang, [locale]: true }
    }))
    
    try {
      const response = await services.user.getUserSlang(userId, 1, 100, locale)
      setDataCache(prev => ({
        ...prev,
        slang: { ...prev.slang, [locale]: response.slang || [] }
      }))
      setLoadedState(prev => ({
        ...prev,
        slang: { ...prev.slang, [locale]: true }
      }))
    } catch (err) {
      console.error('Error fetching slang:', err)
    } finally {
      setLoadingState(prev => ({
        ...prev,
        slang: { ...prev.slang, [locale]: false }
      }))
    }
  }, [session, loadedState.slang])

  const fetchFavoritesData = useCallback(async (locale: string, forceRefresh = false) => {
    if (!session?.user) return
    
    const userId = (session.user as any).id
    if (!forceRefresh && loadedState.favorites[locale]) return
    
    setLoadingState(prev => ({
      ...prev,
      favorites: { ...prev.favorites, [locale]: true }
    }))
    
    try {
      const response = await services.user.getUserFavorites(userId, 1, 100, locale)
      setDataCache(prev => ({
        ...prev,
        favorites: { ...prev.favorites, [locale]: response.slang || [] }
      }))
      setLoadedState(prev => ({
        ...prev,
        favorites: { ...prev.favorites, [locale]: true }
      }))
    } catch (err) {
      console.error('Error fetching favorites:', err)
    } finally {
      setLoadingState(prev => ({
        ...prev,
        favorites: { ...prev.favorites, [locale]: false }
      }))
    }
  }, [session, loadedState.favorites])

  const fetchViewsData = useCallback(async (forceRefresh = false) => {
    if (!session?.user) return
    
    const userId = (session.user as any).id
    if (!forceRefresh && loadedState.views) return
    
    setLoadingState(prev => ({ ...prev, views: true }))
    
    try {
      const response = await services.user.getUserViews(userId, 1, 100)
      setDataCache(prev => ({ ...prev, views: response.views || [] }))
      setLoadedState(prev => ({ ...prev, views: true }))
    } catch (err) {
      console.error('Error fetching views:', err)
    } finally {
      setLoadingState(prev => ({ ...prev, views: false }))
    }
  }, [session, loadedState.views])

  const fetchLikesData = useCallback(async (forceRefresh = false) => {
    if (!session?.user) return
    
    const userId = (session.user as any).id
    if (!forceRefresh && loadedState.likes) return
    
    setLoadingState(prev => ({ ...prev, likes: true }))
    
    try {
      const response = await services.user.getUserLikes(userId, 1, 100)
      setDataCache(prev => ({ ...prev, likes: response.likes || [] }))
      setLoadedState(prev => ({ ...prev, likes: true }))
    } catch (err) {
      console.error('Error fetching likes:', err)
    } finally {
      setLoadingState(prev => ({ ...prev, likes: false }))
    }
  }, [session, loadedState.likes])

  const fetchCommentsData = useCallback(async (forceRefresh = false) => {
    if (!session?.user) return
    
    const userId = (session.user as any).id
    if (!forceRefresh && loadedState.comments) return
    
    setLoadingState(prev => ({ ...prev, comments: true }))
    
    try {
      const response = await services.user.getUserComments(userId, 1, 100)
      setDataCache(prev => ({ ...prev, comments: response.comments || [] }))
      setLoadedState(prev => ({ ...prev, comments: true }))
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoadingState(prev => ({ ...prev, comments: false }))
    }
  }, [session, loadedState.comments])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any
      setEditForm({
        displayName: user.name || user.username || '',
        gender: '',
        bio: ''
      })
      
      const initPage = async () => {
        setPageLoading(true)
        try {
          const statsResponse = await services.user.getUserStats((session.user as any).id)
          if (statsResponse) {
            setStats({
              views: statsResponse.views || 0,
              likes: statsResponse.likes || 0,
              comments: statsResponse.comments || 0,
              commentLikes: statsResponse.commentLikes || 0,
              slangByLocale: statsResponse.slangByLocale || {},
              favoritesByLocale: statsResponse.favoritesByLocale || {}
            })
          }
          await fetchSlangData(contentLocale)
        } catch (err) {
          console.error('Error initializing page:', err)
          setError(t('errors.generic'))
        } finally {
          setPageLoading(false)
        }
      }
      
      initPage()
    }
  }, [status, session])

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !pageLoading) {
      if (activeTab === 'slang') {
        fetchSlangData(contentLocale)
      } else if (activeTab === 'favorites') {
        fetchFavoritesData(contentLocale)
      }
    }
  }, [contentLocale, activeTab, status, session, pageLoading])

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !pageLoading) {
      switch (activeTab) {
        case 'slang':
          fetchSlangData(contentLocale)
          break
        case 'favorites':
          fetchFavoritesData(contentLocale)
          break
        case 'views':
          fetchViewsData()
          break
        case 'likes':
          fetchLikesData()
          break
        case 'comments':
          fetchCommentsData()
          break
      }
    }
  }, [activeTab])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const getGradientClass = () => {
    switch (currentTheme) {
      case 'blue': return 'from-blue-500 via-blue-600 to-indigo-600'
      case 'green': return 'from-green-500 via-emerald-600 to-teal-600'
      case 'purple': return 'from-purple-500 via-violet-600 to-indigo-600'
      case 'orange': return 'from-orange-500 via-amber-600 to-red-600'
      case 'teal': return 'from-teal-500 via-cyan-600 to-blue-600'
      case 'rose': return 'from-rose-500 via-pink-600 to-purple-600'
      default: return 'from-gray-500 via-gray-600 to-gray-700'
    }
  }

  const handleAvatarClick = () => {
    setShowAvatarModal(true)
  }

  const handleAvatarUpload = async (normalFile: File, smallFile: File) => {
    if (!(session?.user as any)?.id) return

    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', normalFile)
      formData.append('avatarSmall', smallFile)
      formData.append('userId', String((session?.user as any)?.id))

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        await update({ avatar: data.data.avatarUrl })
        setToastType('success')
        setToastMessage(t('profile.profileUpdated'))
        setShowToast(true)
      } else {
        throw new Error(data.error || t('profile.uploadFailed'))
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      throw error
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleEditProfile = async () => {
    if (!(session?.user as any)?.id) return

    setEditLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          displayName: editForm.displayName,
          gender: editForm.gender || null,
          bio: editForm.bio || null
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowEditModal(false)
        setToastType('success')
        setToastMessage(t('profile.profileUpdated'))
        setShowToast(true)
      } else {
        setToastType('error')
        setToastMessage(data.error || t('profile.profileUpdateFailed'))
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setToastType('error')
      setToastMessage(t('profile.profileUpdateFailed'))
      setShowToast(true)
    } finally {
      setEditLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('auth.allFieldsRequired'))
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('auth.passwordMinLengthError'))
      return
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(passwordForm.newPassword)) {
      setPasswordError(t('auth.passwordFormatError'))
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordMismatch'))
      return
    }
    
    setPasswordLoading(true)
    try {
      const hashedCurrentPassword = await cryptoUtils.sha256(passwordForm.currentPassword)
      const hashedNewPassword = await cryptoUtils.sha256(passwordForm.newPassword)
      
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          currentPassword: hashedCurrentPassword,
          newPassword: hashedNewPassword
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setShowPasswordModal(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setToastType('success')
        setToastMessage(t('profile.passwordChanged'))
        setShowToast(true)
      } else {
        setPasswordError(data.error || t('profile.passwordChangeFailed'))
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError(t('profile.passwordChangeFailed'))
    } finally {
      setPasswordLoading(false)
    }
  }

  const getGenderDisplay = (gender: string) => {
    switch (gender) {
      case 'male': return t('profile.male')
      case 'female': return t('profile.female')
      case 'other': return t('profile.other')
      default: return t('profile.notSet')
    }
  }

  const getAvatarUrl = () => {
    const avatar = (session?.user as any)?.avatar
    if (avatar) {
      return avatar.startsWith('/') ? avatar : `/${avatar}`
    }
    return null
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'slang':
        return dataCache.slang[contentLocale] || []
      case 'favorites':
        return dataCache.favorites[contentLocale] || []
      case 'views':
        return dataCache.views
      case 'likes':
        return dataCache.likes
      case 'comments':
        return dataCache.comments
      default:
        return []
    }
  }

  const isCurrentLoading = () => {
    switch (activeTab) {
      case 'slang':
        return loadingState.slang[contentLocale] || false
      case 'favorites':
        return loadingState.favorites[contentLocale] || false
      case 'views':
        return loadingState.views
      case 'likes':
        return loadingState.likes
      case 'comments':
        return loadingState.comments
      default:
        return false
    }
  }

  const tabs: { id: ContentTab; label: string; icon: JSX.Element; getCount: () => number }[] = [
    { 
      id: 'slang', 
      label: t('profile.created'), 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      getCount: () => (dataCache.slang[contentLocale] || []).length
    },
    { 
      id: 'favorites', 
      label: t('profile.favorites'), 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      getCount: () => (dataCache.favorites[contentLocale] || []).length
    },
    { 
      id: 'views', 
      label: t('profile.views'), 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      getCount: () => dataCache.views.length
    },
    { 
      id: 'likes', 
      label: t('profile.likes'), 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      getCount: () => dataCache.likes.length
    },
    { 
      id: 'comments', 
      label: t('profile.comments'), 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      getCount: () => dataCache.comments.length
    }
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className={cn.loader}></div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center">
        <Header showLoginModal={() => setShowLoginModal(true)} showAddSlangModal={() => setIsAddModalOpen(true)} />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('profile.loginRequired')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('profile.loginRequiredDesc')}</p>
          <button 
            onClick={() => setShowLoginModal(true)}
            className={`px-6 py-3 ${cn.primaryButton} rounded-lg transition-colors`}
          >
            {t('nav.login')}
          </button>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header showLoginModal={() => setShowLoginModal(true)} showAddSlangModal={() => setIsAddModalOpen(true)} />

      {pageLoading ? (
        <ContentLoader text={t('profile.loadingProfile')} minHeight="py-12" />
      ) : error ? (
        <main className="max-w-6xl mx-auto px-4 py-8">
          <ErrorMessage message={error} type="error" className="rounded-lg" />
        </main>
      ) : (
        <>
          <div className={`bg-gradient-to-r ${getGradientClass()} text-white`}>
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative group flex-shrink-0">
                  <div 
                    className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden cursor-pointer ring-4 ring-white/30 hover:ring-white/50 transition-all"
                    onClick={handleAvatarClick}
                  >
                    {getAvatarUrl() ? (
                      <Image 
                        src={getAvatarUrl()!} 
                        alt="Avatar" 
                        width={112}
                        height={112}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {avatarLoading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                    <div>
                      <h1 className="text-2xl font-bold">
                        {session?.user?.name || session?.user?.username || session?.user?.email?.split('@')[0]}
                      </h1>
                      {session?.user?.username && (
                        <p className="text-white/60 text-sm">@{session.user.username}</p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-white/80 mb-3">{session?.user?.email}</p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {getGenderDisplay('')}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="capitalize">{(session?.user as any)?.role || 'user'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('profile.joinedAt')} N/A
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex-shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('profile.edit')}
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 -mt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { value: slangTotal, label: t('profile.created') },
                { value: favoritesTotal, label: t('profile.favorites') },
                { value: stats.views || 0, label: t('profile.views') },
                { value: stats.likes || 0, label: t('profile.likes') },
                { value: stats.comments || 0, label: t('profile.comments') }
              ].map((stat, index) => (
                <div key={index} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-shadow ${index === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
                  <div className={`text-3xl font-bold ${cn.colors.text.primary}`}>{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
                <nav className="flex">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 min-w-[100px] py-4 px-4 text-center font-medium text-sm transition-colors relative flex items-center justify-center gap-1 ${
                        activeTab === tab.id 
                          ? cn.colors.text.primary
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id ? `${cn.colors.bg.light} ${cn.colors.text.primary}` : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {tab.getCount()}
                      </span>
                      {activeTab === tab.id && (
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${cn.colors.bg.primary}`}></div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              
              {(activeTab === 'slang' || activeTab === 'favorites') && (
                <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-2 overflow-x-auto">
                  <div className="flex gap-1">
                    {locales.filter(loc => {
                      const count = activeTab === 'slang' 
                        ? (stats.slangByLocale[loc] || 0)
                        : (stats.favoritesByLocale[loc] || 0)
                      return count > 0
                    }).map(loc => {
                      const count = activeTab === 'slang' 
                        ? (stats.slangByLocale[loc] || 0)
                        : (stats.favoritesByLocale[loc] || 0)
                      const isActive = contentLocale === loc
                      return (
                        <button
                          key={loc}
                          onClick={() => setContentLocale(loc)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            isActive 
                              ? cn.primaryButton
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span 
                            className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: localeColors[loc] || '#3B82F6' }}
                          >
                            {loc.toUpperCase()}
                          </span>
                          <span>{localeNames[loc] || loc}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="p-6">
                {isCurrentLoading() ? (
                  <div className="flex justify-center py-12">
                    <div className={cn.loader}></div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'slang' && (
                      <div>
                        <div className="mb-4">
                          <a 
                            href={`/${urlLocale}/contribute`}
                            className={`inline-flex px-4 py-2 ${cn.primaryButton} rounded-lg transition-colors items-center gap-2`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('nav.addSlang')}
                          </a>
                        </div>
                        {(dataCache.slang[contentLocale] || []).length === 0 ? (
                          <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('profile.noSlang')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('profile.noSlangDesc')}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(dataCache.slang[contentLocale] || []).map(slang => (
                              <SlangCard key={slang.id} {...slang} evolution={slang.evolution || []} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'favorites' && (
                      <div>
                        {(dataCache.favorites[contentLocale] || []).length === 0 ? (
                          <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('profile.noFavorites')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('profile.noFavoritesDesc')}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(dataCache.favorites[contentLocale] || []).map(slang => (
                              <SlangCard key={slang.id} {...slang} evolution={slang.evolution || []} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'views' && (
                      <div>
                        {dataCache.views.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('profile.noViews')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('profile.noViewsDesc')}</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {dataCache.views.map(view => (
                              <a 
                                key={view.slang_id} 
                                href={`/${urlLocale}/slang/${view.slang_id}`}
                                className="block bg-gray-50 dark:bg-gray-700 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                              >
                                <div className={`font-medium text-gray-900 dark:text-gray-100 group-hover:${cn.colors.text.primary}`}>{view.phrase}</div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{view.explanation}</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">{formatDateTime(view.viewed_at, urlLocale)}</p>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'likes' && (
                      <div>
                        {dataCache.likes.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('profile.noLikes')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('profile.noLikesDesc')}</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {dataCache.likes.map(like => (
                              <a 
                                key={like.slang_id} 
                                href={`/${urlLocale}/slang/${like.slang_id}`}
                                className="block bg-gray-50 dark:bg-gray-700 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                              >
                                <div className={`font-medium text-gray-900 dark:text-gray-100 group-hover:${cn.colors.text.primary}`}>{like.phrase}</div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{like.explanation}</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">{formatDateTime(like.created_at, urlLocale)}</p>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'comments' && (
                      <div>
                        {dataCache.comments.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('profile.noComments')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('profile.noCommentsDesc')}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {dataCache.comments.map(comment => (
                              <a 
                                key={comment.id} 
                                href={`/${urlLocale}/slang/${comment.slang_id}`}
                                className="block bg-gray-50 dark:bg-gray-700 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`font-medium text-gray-900 dark:text-gray-100 group-hover:${cn.colors.text.primary}`}>{comment.slang_phrase}</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {comment.likes}
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">{formatDateTime(comment.created_at, urlLocale)}</p>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="h-8"></div>
        </>
      )}

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={() => {}} />

      <AddSlangModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (data) => {
          setAddLoading(true)
          try {
            const response = await fetch('/mgr/api/slang', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, locale: urlLocale })
            })
            const result = await response.json()
            if (result.success) {
              fetchSlangData(contentLocale, true)
              setTimeout(() => setIsAddModalOpen(false), 1500)
            }
          } catch (error) {
            console.error('Error adding slang:', error)
          } finally {
            setAddLoading(false)
          }
        }}
        loading={addLoading}
        session={session}
      />

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('profile.editProfile')}</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.displayName')}</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  maxLength={25}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={t('profile.enterDisplayName')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.gender')}</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">{t('profile.selectGender')}</option>
                  <option value="male">{t('profile.male')}</option>
                  <option value="female">{t('profile.female')}</option>
                  <option value="other">{t('profile.other')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.bio')}</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder={t('common.tellUsAboutYourself')}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between gap-3 rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowEditModal(false); setShowPasswordModal(true) }}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {t('profile.changePassword')}
                </button>
                <button
                  onClick={() => { setShowEditModal(false); setShowUsernameModal(true) }}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {t('profile.changeUsername')}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleEditProfile}
                  disabled={editLoading}
                  className={`px-5 py-2.5 ${cn.primaryButton} rounded-lg disabled:opacity-50 font-medium transition-colors flex items-center gap-2`}
                >
                  {editLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {editLoading ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onUpload={handleAvatarUpload}
      />

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('profile.changePassword')}</h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {passwordError && (
                <div className={`${cn.errorMessage} p-3 rounded-md text-sm`}>{passwordError}</div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.currentPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${cn.input}`}
                  placeholder={t('profile.enterCurrentPassword')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.newPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${cn.input}`}
                  placeholder={t('profile.enterNewPassword')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.confirmNewPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${cn.input}`}
                  placeholder={t('profile.confirmNewPassword')}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className={`px-5 py-2.5 ${cn.primaryButton} rounded-lg disabled:opacity-50 font-medium transition-colors flex items-center gap-2`}
              >
                {passwordLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {t('profile.changePassword')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`${toastType === 'success' ? 'bg-green-500' : toastType === 'error' ? 'bg-red-500' : toastType === 'warning' ? 'bg-orange-500' : 'bg-blue-500'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2`}>
            {toastType === 'success' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toastType === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toastType === 'warning' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toastType === 'default' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <UsernameChangeModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        currentUsername={(session?.user as any)?.username || ''}
        usernameUpdatedAt={null}
        onSuccess={async (newUsername) => {
          await update({ username: newUsername })
        }}
      />
    </div>
  )
}
