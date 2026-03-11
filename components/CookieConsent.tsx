'use client';

import { useEffect, useState } from 'react';
import { useTranslation, useLocale } from '@/hooks'
import Link from 'next/link'

export default function CookieConsent() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [showConsent, setShowConsent] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查用户是否已经同意
    const hasConsent = localStorage.getItem('cookie-consent');
    
    if (!hasConsent) {
      // 延迟显示，避免页面加载时立即弹出
      const timer = setTimeout(() => {
        setShowConsent(true);
        // 添加淡入效果
        setTimeout(() => setIsVisible(true), 100);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    setTimeout(() => setShowConsent(false), 300);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    setTimeout(() => setShowConsent(false), 300);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Content */}
          <div className="md:col-span-8">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('cookies.consent.message')}{' '}
              <Link href={`/${locale}/privacy-policy`} prefetch={false} className="text-blue-600 hover:underline font-medium">
                {t('cookies.consent.privacyPolicy')}
              </Link>{' '}
              {t('cookies.consent.and')}{' '}
              <Link href={`/${locale}/cookie-policy`} prefetch={false} className="text-blue-600 hover:underline font-medium">
                {t('cookies.consent.cookiePolicy')}
              </Link>
              {t('cookies.consent.period')}
            </p>
          </div>

          {/* Buttons */}
          <div className="md:col-span-4 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('cookies.consent.decline')}
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('cookies.consent.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
