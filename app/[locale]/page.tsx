'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoginModal from '@/components/LoginModal'
import JsonLd, { websiteJsonLd, organizationJsonLd } from '@/components/JsonLd'
import ParticleGlobe from '@/components/ParticleGlobe'
import WorldMap from '@/components/WorldMap'
import { useLocale, useTranslation } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { localeNames, localeColors } from '@/i18n/config'
import { formatShortDate } from '@/lib/date-utils'

interface HotSlang {
  id: number
  phrase: string
  explanation: string
  locale: string
  views: number
  likes: number
}

interface Activity {
  id: number
  title: string
  description: string
  image_url: string
  status: string
  start_date: string
  end_date: string
  participants_count: number
}

interface Series {
  id: number
  title: string
  description: string
  type: string
  issue_date: string
  cover_image: string
  price: number
  currency: string
  priority: number
}

const CACHE_KEY_HOT_SLANGS = 'slanghome_hot_slangs_cache'
const CACHE_KEY_ACTIVITIES = 'slanghome_activities_cache'
const CACHE_KEY_FLOATING_WORDS = 'slanghome_floating_words_cache'
const CACHE_KEY_SERIES = 'slanghome_series_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000
const CACHE_DURATION_WEEK = 7 * 24 * 60 * 60 * 1000
const CACHE_DURATION_MONTH = 30 * 24 * 60 * 60 * 1000

const STATIC_STATS = {
  slangCount: 10000,
  languageCount: 20,
  userCount: 500
}

function getCachedData<T>(key: string, locale: string, duration: number = CACHE_DURATION): { data: T | null; expired: boolean; isEmpty: boolean } {
  try {
    const cached = localStorage.getItem(`${key}_${locale}`)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      const expired = Date.now() - timestamp > duration
      const isEmpty = Array.isArray(data) ? data.length === 0 : !data
      return { data, expired, isEmpty }
    }
  } catch (e) {
    console.error('Cache read error:', e)
  }
  return { data: null, expired: true, isEmpty: true }
}

function setCachedData<T>(key: string, locale: string, data: T) {
  try {
    localStorage.setItem(`${key}_${locale}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.error('Cache write error:', e)
  }
}

export default function HomePage() {
  const locale = useLocale()
  const { t } = useTranslation()
  const { cn } = useTheme()
  const { data: session } = useSession({ required: false })
  
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [hotSlangs, setHotSlangs] = useState<HotSlang[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [floatingWords, setFloatingWords] = useState<{ word: string; locale: string; delay: number }[]>([
    { word: 'YOLO', locale: 'en', delay: 0 },
    { word: '绝绝子', locale: 'zh', delay: 2 },
    { word: 'Guay', locale: 'es', delay: 4 },
    { word: 'ヤバい', locale: 'ja', delay: 1 },
    { word: '대박', locale: 'ko', delay: 3 },
    { word: 'LOL', locale: 'en', delay: 5 },
    { word: '躺平', locale: 'zh', delay: 2.5 },
    { word: 'Tío', locale: 'es', delay: 4.5 },
    { word: 'FOMO', locale: 'en', delay: 1.5 },
    { word: '内卷', locale: 'zh', delay: 3.5 },
    { word: 'Chido', locale: 'es', delay: 0.5 },
    { word: 'GOAT', locale: 'en', delay: 6 },
    { word: 'Mec', locale: 'fr', delay: 0.8 },
    { word: 'Geil', locale: 'de', delay: 2.2 },
    { word: 'Legal', locale: 'pt', delay: 4.2 },
    { word: 'Круто', locale: 'ru', delay: 1.2 },
    { word: 'يا سلام', locale: 'ar', delay: 3.8 },
    { word: 'Cool', locale: 'fr', delay: 5.5 },
    { word: 'Krass', locale: 'de', delay: 0.3 },
    { word: 'Beleza', locale: 'pt', delay: 2.8 },
    { word: 'Нормально', locale: 'ru', delay: 4.8 },
    { word: 'حلو', locale: 'ar', delay: 1.8 },
    { word: 'Bouffe', locale: 'fr', delay: 3.2 },
    { word: 'Alter', locale: 'de', delay: 5.2 },
    { word: 'Valeu', locale: 'pt', delay: 0.6 },
    { word: 'Классно', locale: 'ru', delay: 2.6 },
    { word: 'تمام', locale: 'ar', delay: 4.6 },
    { word: 'Slay', locale: 'en', delay: 1.4 },
    { word: '破防', locale: 'zh', delay: 3.4 },
    { word: 'Padre', locale: 'es', delay: 5.4 },
    { word: 'やばい', locale: 'ja', delay: 0.9 },
    { word: '헐', locale: 'ko', delay: 2.4 },
    { word: 'Peça', locale: 'hi', delay: 4.4 },
    { word: 'Kral', locale: 'tr', delay: 1.6 },
    { word: 'Figata', locale: 'it', delay: 3.6 },
    { word: 'Đỉnh', locale: 'vi', delay: 5.6 },
    { word: 'Jeng', locale: 'th', delay: 0.4 },
    { word: 'Asik', locale: 'id', delay: 2.4 },
    { word: 'Syabas', locale: 'ms', delay: 4.4 },
    { word: 'Spoko', locale: 'pl', delay: 1.4 },
    { word: 'Lekker', locale: 'nl', delay: 3.4 },
    { word: 'Fett', locale: 'sv', delay: 5.4 },
  ])
  const [loading, setLoading] = useState(true)

  const seriesDescriptions: Record<string, { annual: string; internet_culture: string; dialect: string }> = {
    en: { annual: 'Annual slang highlights collection', internet_culture: 'Deep dive into internet memes', dialect: 'Dialect travel phrase guides' },
    zh: { annual: '年度流行语精选合集', internet_culture: '网络热梗深度解析', dialect: '方言旅游口语指南' },
    es: { annual: 'Colección de jerga anual', internet_culture: 'Análisis profundo de memes', dialect: 'Guías de frases de dialectos' },
    ar: { annual: 'مجموعة العامية السنوية', internet_culture: 'تحليل متعمق للميمات', dialect: 'أدلة عبارات اللهجات' },
    ja: { annual: '年間スラングハイライト', internet_culture: 'インターネットミーム深掘り', dialect: '方言旅行フレーズガイド' },
    ru: { annual: 'Ежегодная подборка сленга', internet_culture: 'Глубокий анализ мемов', dialect: 'Путеводитель по диалектам' },
    fr: { annual: 'Collection annuelle de slang', internet_culture: 'Analyse approfondie des mèmes', dialect: 'Guides de phrases dialectales' },
    de: { annual: 'Jährliche Slang-Sammlung', internet_culture: 'Tiefenanalyse von Internet-Memes', dialect: 'Dialekt-Reiseführer' },
    ko: { annual: '연간 슬랭 하이라이트', internet_culture: '인터넷 밈 심층 분석', dialect: '방언 여행 회화 가이드' },
    hi: { annual: 'वार्षिक स्लैंग संग्रह', internet_culture: 'इंटरनेट मीम्स विश्लेषण', dialect: 'बोली यात्रा वाक्यांश गाइड' },
    pt: { annual: 'Coleção anual de gírias', internet_culture: 'Análise profunda de memes', dialect: 'Guias de frases dialetais' },
    tr: { annual: 'Yıllık argan koleksiyonu', internet_culture: 'İnternet memeleri derinlemesine', dialect: 'Lehçe seyahat rehberi' },
    it: { annual: 'Collezione annuale di slang', internet_culture: 'Analisi approfondita dei meme', dialect: 'Guide dialettali di viaggio' },
    vi: { annual: 'Bộ sưu tập tiếng lóng hàng năm', internet_culture: 'Phân tích sâu về meme', dialect: 'Hướng dẫn cụm từ phương ngữ' },
    th: { annual: 'คอลเลกชันภาษาปากประจำปี', internet_culture: 'วิเคราะห์มีมอินเทอร์เน็ต', dialect: 'คู่มือภาษาถิ่น' },
    id: { annual: 'Koleksi slang tahunan', internet_culture: 'Analisis mendalam meme', dialect: 'Panduan frasa dialek' },
    ms: { annual: 'Koleksi slang tahunan', internet_culture: 'Analisis mendalam meme', dialect: 'Panduan frasa dialek' },
    pl: { annual: 'Roczna kolekcja slangu', internet_culture: 'Głęboka analiza memów', dialect: 'Przewodnik po dialektach' },
    nl: { annual: 'Jaarlijkse slang-collectie', internet_culture: 'Diepgaande analyse van memes', dialect: 'Dialect reisgidsen' },
    sv: { annual: 'Årlig slang-samling', internet_culture: 'Djupgående analys av memes', dialect: 'Dialekt reseguider' }
  }

  const seriesTypes = [
    {
      type: 'annual' as const,
      title: t('subscribe.annual'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <path d="M12 14l2 2 4-4"/>
        </svg>
      ),
      description: seriesDescriptions[locale]?.annual || seriesDescriptions.en.annual
    },
    {
      type: 'internet_culture' as const,
      title: t('subscribe.internetCulture'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      description: seriesDescriptions[locale]?.internet_culture || seriesDescriptions.en.internet_culture
    },
    {
      type: 'dialect' as const,
      title: t('subscribe.dialect'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      description: seriesDescriptions[locale]?.dialect || seriesDescriptions.en.dialect
    }
  ]

  useEffect(() => {
    const fetchHotSlangs = async () => {
      const { data: cached, expired, isEmpty } = getCachedData<HotSlang[]>(CACHE_KEY_HOT_SLANGS, 'all')
      if (cached && !isEmpty) {
        setHotSlangs(cached)
        if (!expired) return
      }

      try {
        const response = await fetch(`/api/slang?limit=4&sort=heat&allLocales=true`)
        if (response.ok) {
          const data = await response.json()
          const slangs = data.slang || []
          if (slangs.length > 0) {
            setHotSlangs(slangs)
            setCachedData(CACHE_KEY_HOT_SLANGS, 'all', slangs)
          } else if (cached && isEmpty) {
            setHotSlangs(cached)
          }
        } else if (cached) {
          setHotSlangs(cached)
        }
      } catch (err) {
        console.error('Error fetching hot slangs:', err)
        if (cached) {
          console.warn('Using stale cache for hot slangs')
        }
      }
    }

    const fetchActivities = async () => {
      const { data: cached, expired, isEmpty } = getCachedData<Activity[]>(CACHE_KEY_ACTIVITIES, locale)
      if (cached && !isEmpty) {
        setActivities(cached)
        if (!expired) return
      }

      try {
        const response = await fetch(`/api/activities?locale=${locale}&limit=3`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const acts = data.data.activities || []
            setActivities(acts)
            setCachedData(CACHE_KEY_ACTIVITIES, locale, acts)
          } else if (cached) {
            setActivities(cached)
          }
        } else if (cached) {
          setActivities(cached)
        }
      } catch (err) {
        console.error('Error fetching activities:', err)
        if (cached) {
          console.warn('Using stale cache for activities')
        }
      }
    }

    const fetchFloatingWords = async () => {
      const { data: cached, expired, isEmpty } = getCachedData<{ word: string; locale: string; delay: number }[]>(CACHE_KEY_FLOATING_WORDS, 'global', CACHE_DURATION_WEEK)
      if (cached && !isEmpty) {
        setFloatingWords(cached)
        if (!expired) return
      }

      try {
        const response = await fetch('/api/slang?limit=42&sortBy=heat')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const slangs = data.data.slangs || []
            if (slangs.length > 0) {
              const words = slangs.map((s: { phrase: string; locale: string }, index: number) => ({
                word: s.phrase,
                locale: s.locale,
                delay: (index % 7) * 0.8
              }))
              setFloatingWords(words)
              setCachedData(CACHE_KEY_FLOATING_WORDS, 'global', words)
            } else if (cached && !isEmpty) {
              setFloatingWords(cached)
            }
          } else if (cached && !isEmpty) {
            setFloatingWords(cached)
          }
        } else if (cached && !isEmpty) {
          setFloatingWords(cached)
        }
      } catch (err) {
        console.error('Error fetching floating words:', err)
        if (cached && !isEmpty) {
          console.warn('Using stale cache for floating words')
        }
      }
    }

    const fetchSeries = async () => {
      const { data: cached, expired, isEmpty } = getCachedData<Series[]>(CACHE_KEY_SERIES, locale, CACHE_DURATION_MONTH)
      if (cached && !isEmpty) {
        setSeriesList(cached)
        if (!expired) return
      }

      try {
        const response = await fetch(`/api/series?locale=${locale}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const series = data.data.series || []
            if (series.length > 0) {
              setSeriesList(series)
              setCachedData(CACHE_KEY_SERIES, locale, series)
            } else if (cached) {
              setSeriesList(cached)
            }
          } else if (cached) {
            setSeriesList(cached)
          }
        } else if (cached) {
          setSeriesList(cached)
        }
      } catch (err) {
        console.error('Error fetching series:', err)
        if (cached) {
          console.warn('Using stale cache for series')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchHotSlangs()
    fetchActivities()
    fetchFloatingWords()
    fetchSeries()
  }, [locale])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return formatShortDate(dateStr, locale)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'upcoming': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'ended': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing': return t('activities.ongoing')
      case 'upcoming': return t('activities.upcoming')
      case 'ended': return t('activities.past')
      default: return status
    }
  }

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={organizationJsonLd} />
      
      <div className="min-h-screen bg-gray-100">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
          
          {floatingWords.map((item, index) => {
            const row = Math.floor(index / 6)
            const col = index % 6
            const leftPercent = 5 + col * 16 + (row % 2) * 8
            const topPercent = 8 + row * 18
            return (
              <div
                key={index}
                className="absolute text-white/15 font-bold text-sm md:text-xl pointer-events-none animate-float whitespace-nowrap"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  animationDelay: `${item.delay}s`,
                  animationDuration: `${10 + (index % 5)}s`
                }}
              >
                {item.word}
              </div>
            )
          })}
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                  {t('home.hero.title')}
                </h1>
                <p className="text-lg text-white/90 mb-8 max-w-xl drop-shadow">
                  {t('home.hero.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link
                    href={`/${locale}/discover`}
                    prefetch="intent"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-purple-600 hover:bg-gray-100 text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                      <path d="M11 8v6M8 11h6"/>
                    </svg>
                    {t('home.hero.explore')}
                  </Link>
                  <Link
                    href={`/${locale}/subscribe`}
                    prefetch="intent"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 text-lg font-medium transition-all duration-200 border border-white/30"
                  >
                    {t('home.hero.learnMore')}
                  </Link>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <ParticleGlobe />
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" className="w-full h-16 md:h-24">
              <path fill="currentColor" className="text-gray-100 dark:text-gray-900" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        <section className="py-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className={`text-3xl md:text-4xl font-bold ${cn.colors.text.primary}`}>
                  {STATIC_STATS.slangCount > 0 ? `${formatNumber(STATIC_STATS.slangCount)}+` : '-'}
                </div>
                <div className={`text-sm ${cn.colors.text.secondary}`}>
                  {t('home.stats.slangs')}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 12h8M8 8h8M8 16h4"/>
                    <path d="M7 2v4M17 2v4"/>
                  </svg>
                </div>
                <div className={`text-3xl md:text-4xl font-bold ${cn.colors.text.primary}`}>
                  {STATIC_STATS.languageCount > 0 ? `${STATIC_STATS.languageCount}+` : '-'}
                </div>
                <div className={`text-sm ${cn.colors.text.secondary}`}>
                  {t('home.stats.languages')}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div className={`text-3xl md:text-4xl font-bold ${cn.colors.text.primary}`}>
                  {STATIC_STATS.userCount > 0 ? `${formatNumber(STATIC_STATS.userCount)}+` : '-'}
                </div>
                <div className={`text-sm ${cn.colors.text.secondary}`}>
                  {t('home.stats.contributors')}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-2xl font-bold ${cn.colors.text.primary} flex items-center gap-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2c0 4-4 6-4 10a4 4 0 008 0c0-4-4-6-4-10z"/>
                  <path d="M12 12v4"/>
                </svg>
                {t('home.hotSlang.title')}
              </h2>
              <Link
                href={`/${locale}/discover`}
                prefetch="intent"
                className={`text-sm ${cn.colors.text.primary} ${cn.colors.text.primaryHover} flex items-center gap-1`}
              >
                {t('home.hero.explore')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`${cn.colors.bg.card} rounded-lg p-4 animate-pulse`}>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : hotSlangs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {hotSlangs.map(slang => (
                  <Link
                    key={slang.id}
                    href={`/${locale}/slang/${slang.id}`}
                    prefetch="intent"
                    className={`${cn.colors.bg.card} rounded-lg p-4 border ${cn.colors.border.default} hover:shadow-md transition-shadow duration-200`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold ${cn.colors.text.primary} truncate`}>
                        {slang.phrase}
                      </h3>
                      <span 
                        className="text-xs px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: localeColors[slang.locale] || '#6B7280' }}
                      >
                        {slang.locale.toUpperCase()}
                      </span>
                    </div>
                    <p className={`text-sm ${cn.colors.text.secondary} line-clamp-2 mb-2`}>
                      {slang.explanation}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {formatNumber(slang.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {formatNumber(slang.likes)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={`${cn.colors.bg.card} rounded-lg p-8 text-center border ${cn.colors.border.default}`}>
                <p className={cn.colors.text.secondary}>No trending slang available</p>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-2xl font-bold ${cn.colors.text.primary} flex items-center gap-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {t('activities.title')}
              </h2>
              <Link
                href={`/${locale}/activities`}
                prefetch="intent"
                className={`text-sm ${cn.colors.text.primary} ${cn.colors.text.primaryHover} flex items-center gap-1`}
              >
                {t('activities.viewAll') || 'View All'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            {activities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activities.map(activity => (
                  <Link
                    key={activity.id}
                    href={`/${locale}/activities?id=${activity.id}`}
                    prefetch="intent"
                    className={`${cn.colors.bg.card} rounded-lg overflow-hidden border ${cn.colors.border.default} hover:shadow-lg transition-shadow duration-200`}
                  >
                    {activity.image_url ? (
                      <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
                        <img 
                          src={activity.image_url} 
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}>
                          {getStatusText(activity.status)}
                        </span>
                        {activity.participants_count > 0 && (
                          <span className="text-xs text-gray-500">
                            {activity.participants_count} {t('activities.participants')}
                          </span>
                        )}
                      </div>
                      <h3 className={`font-semibold ${cn.colors.text.primary} mb-1 line-clamp-1`}>
                        {activity.title}
                      </h3>
                      <p className={`text-sm ${cn.colors.text.secondary} line-clamp-2`}>
                        {activity.description}
                      </p>
                      <div className="mt-2 text-xs text-gray-400">
                        {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={`${cn.colors.bg.card} rounded-lg p-8 text-center border ${cn.colors.border.default}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className={cn.colors.text.secondary}>{t('activities.noOngoing')}</p>
                <Link
                  href={`/${locale}/activities`}
                  prefetch="intent"
                  className={`inline-flex items-center gap-1 mt-4 text-sm ${cn.colors.text.primary} ${cn.colors.text.primaryHover}`}
                >
                  {t('activities.viewAll') || 'View All Activities'}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-2xl font-bold ${cn.colors.text.primary} flex items-center gap-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  <path d="M8 7h8M8 11h8M8 15h4"/>
                </svg>
                {t('subscribe.title')}
              </h2>
              <Link
                href={`/${locale}/subscribe`}
                prefetch="intent"
                className={`text-sm ${cn.colors.text.primary} ${cn.colors.text.primaryHover} flex items-center gap-1`}
              >
                {t('subscribe.latestIssue')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {seriesTypes.map(seriesType => {
                const typeSeries = seriesList.filter(s => s.type === seriesType.type)
                return (
                  <div 
                    key={seriesType.type}
                    className={`${cn.colors.bg.card} rounded-xl border ${cn.colors.border.default} p-6 hover:shadow-lg transition-shadow duration-200`}
                  >
                    <div className="flex items-center justify-center mb-4 text-orange-500">
                      {seriesType.icon}
                    </div>
                    <h3 className={`text-xl font-semibold ${cn.colors.text.primary} text-center mb-2`}>
                      {seriesType.title}
                    </h3>
                    <p className={`text-sm ${cn.colors.text.secondary} text-center mb-4`}>
                      {seriesType.description}
                    </p>
                    
                    {typeSeries.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {typeSeries.slice(0, 3).map(s => (
                          <div key={s.id} className={`p-3 rounded-lg ${cn.colors.bg.light} border ${cn.colors.border.default}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">{formatDate(s.issue_date)}</span>
                            </div>
                            <h4 className={`text-sm font-medium ${cn.colors.text.primary} line-clamp-1`}>{s.title}</h4>
                            <p className={`text-xs ${cn.colors.text.secondary} line-clamp-2 mt-1`}>{s.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-sm ${cn.colors.text.secondary} text-center mb-4`}>
                        {locale === 'zh' ? '暂无内容' : 'No content available'}
                      </p>
                    )}
                    
                    <Link
                      href={`/${locale}/subscribe?type=${seriesType.type}`}
                      prefetch="intent"
                      className={`w-full py-2 rounded-lg text-sm font-medium ${cn.primaryButton} flex items-center justify-center gap-2`}
                    >
                      {t('subscribe.viewDetails') || 'View Details'}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className={`text-2xl font-bold ${cn.colors.text.primary} mb-8 flex items-center gap-2`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {t('home.languageCommunity.title')}
            </h2>
            
            <WorldMap />
          </div>
        </section>

        <Footer />

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={() => {}}
        />
      </div>
    </>
  )
}
