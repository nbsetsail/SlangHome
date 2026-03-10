'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale, useTranslation } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'

export default function Footer() {
  const locale = useLocale()
  const { t } = useTranslation()
  const { cn } = useTheme()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className={`${cn.colors.bg.card} py-12 border-t ${cn.colors.border.default}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className={`font-semibold ${cn.colors.text.primary} mb-4`}>{t('footer.links.quick')}</h3>
            <ul className="space-y-2">
              <li><a href={`/${locale}`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.home')}</a></li>
              <li><a href={`/${locale}/discover`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('nav.discover')}</a></li>
              <li><a href={`/${locale}/activities`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('nav.activities')}</a></li>
              <li><a href={`/${locale}/subscribe`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('nav.subscribe')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className={`font-semibold ${cn.colors.text.primary} mb-4`}>{t('footer.links.community')}</h3>
            <ul className="space-y-2">
              <li><a href={`/${locale}/about`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.about')}</a></li>
              <li><a href={`/${locale}/community-guidelines`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.communityGuidelines')}</a></li>
              <li><a href={`/${locale}/contribute`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('nav.addSlang')}</a></li>
              <li><a href={`/${locale}/feedback`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.feedback')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className={`font-semibold ${cn.colors.text.primary} mb-4`}>{t('footer.links.support')}</h3>
            <ul className="space-y-2">
              <li><a href={`/${locale}/help`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.help')}</a></li>
              <li><a href={`/${locale}/feedback`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.contact')}</a></li>
            </ul>
          </div>
          <div>
            <h3 className={`font-semibold ${cn.colors.text.primary} mb-4`}>{t('footer.links.legal')}</h3>
            <ul className="space-y-2">
              <li><a href={`/${locale}/privacy-policy`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.privacy')}</a></li>
              <li><a href={`/${locale}/terms-of-service`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.terms')}</a></li>
              <li><a href={`/${locale}/cookie-policy`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.cookies')}</a></li>
              <li><a href={`/${locale}/privacy-settings`} className={`text-sm ${cn.colors.text.secondary} hover:text-blue-500 transition-colors`}>{t('footer.links.gdpr')}</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="12" cy="12" r="10" className="stroke-blue-400"/>
                <ellipse cx="12" cy="12" rx="10" ry="4" className="stroke-orange-300"/>
                <path d="M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10" className="stroke-green-400"/>
                <path d="M12 2c-2.5 2.5-4 6-4 10s1.5 7.5 4 10" className="stroke-purple-400"/>
                <path d="M2 12h20" className="stroke-gray-400"/>
                <circle cx="12" cy="12" r="2" className="fill-orange-400 stroke-orange-500"/>
              </svg>
              <span className={`font-semibold ${cn.colors.text.primary}`}>SlangHome</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/nbsetsail/SlangHome" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-full ${cn.colors.text.secondary} hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
              title="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
              </svg>
            </a>
          </div>
          
          <button
            onClick={scrollToTop}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${cn.colors.text.secondary} hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {t('footer.backToTop') || 'Top'}
          </button>
        </div>
      </div>
    </footer>
  )
}
