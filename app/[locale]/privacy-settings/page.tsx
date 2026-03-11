'use client';

import { useState, useEffect } from 'react';
import { useTranslation, useLocale } from '@/hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { cryptoUtils } from '@/lib/utils';

export default function PrivacySettingsPage() {
  const locale = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmationError, setConfirmationError] = useState('');

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/user/export-data');
      
      if (response.status === 401) {
        showToastMessage(t('auth.pleaseLoginGeneral'), 'error');
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 1500);
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToastMessage(t('gdpr.exportSuccess'), 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToastMessage(t('gdpr.exportFailed'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const validateDeleteForm = (): boolean => {
    let isValid = true;
    
    if (!password) {
      setPasswordError(t('gdpr.delete.passwordRequired'));
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    if (confirmation !== 'DELETE MY ACCOUNT') {
      setConfirmationError(t('gdpr.delete.confirmationMismatch'));
      isValid = false;
    } else {
      setConfirmationError('');
    }
    
    return isValid;
  };

  const handleDeleteAccount = async () => {
    if (!validateDeleteForm()) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const hashedPassword = await cryptoUtils.sha256(password);
      
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: hashedPassword,
          confirmation: confirmation,
        }),
      });

      if (response.status === 401) {
        showToastMessage(t('auth.pleaseLoginGeneral'), 'error');
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 1500);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      showToastMessage(t('gdpr.deleteSuccess'), 'success');
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 1500);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : t('gdpr.deleteFailed');
      showToastMessage(errorMessage, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPassword('');
    setConfirmation('');
    setPasswordError('');
    setConfirmationError('');
  };

  const getToastBgColor = () => {
    switch (toastType) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-end mb-4">
          <Link 
            href={`/${locale}`}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title={t('common.backToHome')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('gdpr.title')}
        </h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('gdpr.export.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('gdpr.export.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4 mb-6">
              <li>{t('gdpr.export.items.personal')}</li>
              <li>{t('gdpr.export.items.content')}</li>
              <li>{t('gdpr.export.items.interactions')}</li>
              <li>{t('gdpr.export.items.activity')}</li>
            </ul>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isExporting ? t('gdpr.export.exporting') : t('gdpr.export.button')}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('gdpr.delete.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('gdpr.delete.description')}
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">
                {t('gdpr.delete.warning.title')}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-500 ml-4">
                <li>{t('gdpr.delete.warning.permanent')}</li>
                <li>{t('gdpr.delete.warning.irreversible')}</li>
                <li>{t('gdpr.delete.warning.allData')}</li>
              </ul>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {t('gdpr.delete.button')}
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('gdpr.delete.confirmMessage')}
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('gdpr.delete.passwordLabel')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white ${
                      passwordError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2`}
                    placeholder={t('gdpr.delete.passwordPlaceholder')}
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-500">{passwordError}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('gdpr.delete.confirmationLabel')}
                  </label>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => {
                      setConfirmation(e.target.value);
                      setConfirmationError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white font-mono ${
                      confirmationError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2`}
                    placeholder="DELETE MY ACCOUNT"
                  />
                  {confirmationError && (
                    <p className="mt-1 text-sm text-red-500">{confirmationError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('gdpr.delete.confirmationHint')}
                  </p>
                </div>
                
                <div className="flex space-x-4 pt-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isDeleting ? t('gdpr.delete.deleting') : t('gdpr.delete.confirmButton')}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('gdpr.cookies.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {t('gdpr.cookies.description')}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('cookie-consent');
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t('gdpr.cookies.button')}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href={`/${locale}`} className="text-blue-600 hover:underline">
            ← {t('common.backToHome')}
          </Link>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`${getToastBgColor()} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2`}>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
