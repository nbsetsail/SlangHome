'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslation, useLocale } from '@/hooks'
import AdvertisementSlot from '@/components/AdvertisementSlot'

export function SidebarFooter() {
  const locale = useLocale()
  const { t } = useTranslation()

  return (
    <>
      <AdvertisementSlot position="sidebar" className="w-full" wrapperClassName="mt-4" />
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          © {new Date().getFullYear()} SlangHome
        </p>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-3">
          <Link 
            href={`/${locale}/privacy-policy`}
            prefetch={false}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('footer.links.privacyShort')}
          </Link>
          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
          <Link 
            href={`/${locale}/terms-of-service`}
            prefetch={false}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('footer.links.termsShort')}
          </Link>
          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
          <Link 
            href={`/${locale}/cookie-policy`}
            prefetch={false}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('footer.links.cookiesShort')}
          </Link>
          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
          <Link 
            href={`/${locale}/privacy-settings`}
            prefetch={false}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('footer.links.gdprShort')}
          </Link>
          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
          <Link 
            href={`/${locale}/community-guidelines`}
            prefetch={false}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {t('footer.links.communityGuidelinesShort')}
          </Link>
        </div>
      </div>
    </>
  )
}
