'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import { useLocale, useTranslation } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { formatShortDate } from '@/lib/date-utils'

interface Series {
  id: number
  title: string
  type: 'annual' | 'internet_culture' | 'dialect'
  issue_date: string
  cover_image: string | null
  description: string
  gumroad_url: string | null
  amazon_url: string | null
  price: number
  currency: string
  priority: number
}

const CACHE_KEY_SERIES = 'slanghome_series_cache'
const CACHE_DURATION_MONTH = 30 * 24 * 60 * 60 * 1000

function getCachedData<T>(key: string, locale: string, duration: number): { data: T | null; expired: boolean } {
  try {
    const cached = localStorage.getItem(`${key}_${locale}`)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      const expired = Date.now() - timestamp > duration
      return { data, expired }
    }
  } catch (e) {
    console.error('Cache read error:', e)
  }
  return { data: null, expired: true }
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

export default function SubscribePage() {
  const locale = useLocale()
  const { t } = useTranslation()
  const { cn } = useTheme()
  
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeries = async () => {
      const { data: cached, expired } = getCachedData<Series[]>(CACHE_KEY_SERIES, locale, CACHE_DURATION_MONTH)
      if (cached && !expired && cached.length > 0) {
        setSeriesList(cached)
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch(`/api/series?locale=${locale}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const series = data.data.series || []
            setSeriesList(series)
            if (series.length > 0) {
              setCachedData(CACHE_KEY_SERIES, locale, series)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching series:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [locale])

  const latestSeries = seriesList[0]

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return formatShortDate(dateStr, locale)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

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

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className={`text-2xl md:text-3xl font-bold ${cn.colors.text.primary} flex items-center justify-center gap-2 mb-2`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                <path d="M8 7h8M8 11h8M8 15h4"/>
              </svg>
              {t('subscribe.title')}
            </h1>
            <p className={cn.colors.text.secondary}>
              {t('subscribe.subtitle')}
            </p>
          </div>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {seriesTypes.map(seriesType => (
                <div 
                  key={seriesType.type}
                  className={`${cn.colors.bg.card} rounded-xl border ${cn.colors.border.default} p-6 hover:shadow-lg transition-shadow duration-200`}
                >
                  <div className="flex items-center justify-center mb-4 text-orange-500">
                    {seriesType.icon}
                  </div>
                  <h2 className={`text-xl font-semibold ${cn.colors.text.primary} text-center mb-2`}>
                    {seriesType.title}
                  </h2>
                  <p className={`text-sm ${cn.colors.text.secondary} text-center mb-4`}>
                    {seriesType.description}
                  </p>
                  <div className="space-y-2">
                    <a 
                      href="https://gumroad.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-full py-2 rounded-lg text-sm font-medium ${cn.primaryButton} flex items-center justify-center gap-2`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Gumroad
                    </a>
                    <a 
                      href="https://amazon.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-full py-2 rounded-lg text-sm font-medium ${cn.colors.bg.light} ${cn.colors.text.primary} border ${cn.colors.border.default} flex items-center justify-center gap-2`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      </svg>
                      Amazon KDP
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className={`h-6 ${cn.colors.bg.card} rounded w-32 mb-4`}></div>
              <div className={`${cn.colors.bg.card} rounded-lg p-6`}>
                <div className="flex gap-6">
                  <div className="w-48 h-64 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {latestSeries && (
                <section className="mb-12">
                  <h2 className={`text-xl font-semibold ${cn.colors.text.primary} mb-4 flex items-center gap-2`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                    {t('subscribe.latestEdition')}
                  </h2>
                  <div className={`${cn.colors.bg.card} rounded-lg border ${cn.colors.border.default} overflow-hidden`}>
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                      <div className="w-full md:w-48 h-64 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
                        {latestSeries.cover_image ? (
                          <img 
                            src={latestSeries.cover_image} 
                            alt={latestSeries.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            {formatDate(latestSeries.issue_date)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {t(`subscribe.${latestSeries.type}`)}
                          </span>
                        </div>
                        <h3 className={`text-xl font-semibold ${cn.colors.text.primary} mb-2`}>
                          {latestSeries.title}
                        </h3>
                        <p className={`text-sm ${cn.colors.text.secondary} mb-4`}>
                          {latestSeries.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className={`text-lg font-bold ${cn.colors.text.primary}`}>
                            {formatPrice(latestSeries.price, latestSeries.currency)}
                          </span>
                          <div className="flex gap-2">
                            {latestSeries.gumroad_url && (
                              <a 
                                href={latestSeries.gumroad_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${cn.primaryButton}`}
                              >
                                {t('subscribe.preview')}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {seriesList.length > 1 && (
                <section>
                  <h2 className={`text-xl font-semibold ${cn.colors.text.primary} mb-4 flex items-center gap-2`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                    </svg>
                    {t('subscribe.pastEditions')}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {seriesList.slice(1).map(series => (
                      <div 
                        key={series.id}
                        className={`${cn.colors.bg.card} rounded-lg border ${cn.colors.border.default} overflow-hidden hover:shadow-md transition-shadow duration-200`}
                      >
                        <div className="h-40 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          {series.cover_image ? (
                            <img 
                              src={series.cover_image} 
                              alt={series.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                            </svg>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(series.issue_date)}
                            </span>
                          </div>
                          <h3 className={`font-medium ${cn.colors.text.primary} text-sm mb-1 truncate`}>
                            {series.title}
                          </h3>
                          <span className={`text-sm font-semibold ${cn.colors.text.primary}`}>
                            {formatPrice(series.price, series.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!latestSeries && seriesList.length <= 1 && (
                <div className={`${cn.colors.bg.card} rounded-lg p-8 text-center border ${cn.colors.border.default}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                  <p className={cn.colors.text.secondary}>
                    {locale === 'zh' ? '暂无系列数据' : 'No series available'}
                  </p>
                </div>
              )}
            </>
          )}
        </main>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={() => {}}
        />
      </div>
    </>
  )
}
