/**
 * Generic error display component
 * Resolves duplicate error display patterns in the project
 */

import React, { useContext } from 'react'
import { ThemeContext } from '@/contexts/ThemeContext'
import { getThemeClassNames } from '@/lib/theme'

const useThemeSafe = () => {
  const context = useContext(ThemeContext)
  return context?.cn ?? getThemeClassNames()
}

interface ErrorMessageProps {
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
  className?: string
  onRetry?: () => void
  retryText?: string
  dismissible?: boolean
  onDismiss?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message,
  type = 'error',
  className = '',
  onRetry,
  retryText = 'Try again',
  dismissible = false,
  onDismiss
}) => {
  const cn = useThemeSafe()
  
  const typeClasses = {
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: `${cn.colors.info.bg} ${cn.colors.info.border} ${cn.colors.info.text}`,
    success: 'bg-green-100 border-green-400 text-green-700'
  }

  const iconClasses = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: cn.colors.text.primary,
    success: 'text-green-500'
  }

  const icons = {
    error: (
      <svg className={`h-5 w-5 ${iconClasses[type]}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className={`h-5 w-5 ${iconClasses[type]}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className={`h-5 w-5 ${iconClasses[type]}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className={`h-5 w-5 ${iconClasses[type]}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className={`border px-4 py-3 rounded relative ${typeClasses[type]} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          <span className="block sm:inline">{message}</span>
          
          {(onRetry || dismissible) && (
            <div className="mt-2 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none"
                >
                  {retryText}
                </button>
              )}
              
              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 text-current hover:opacity-75 focus:outline-none"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void
  retryText?: string
  className?: string
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ 
  onRetry,
  retryText = 'Retry connection',
  className = ''
}) => {
  return (
    <ErrorMessage
      message="Network connection failed. Please check your internet connection and try again."
      type="error"
      onRetry={onRetry}
      retryText={retryText}
      className={className}
    />
  )
}

// Form error component
interface FormErrorProps {
  errors: Record<string, string>
  className?: string
}

export const FormError: React.FC<FormErrorProps> = ({ 
  errors,
  className = ''
}) => {
  const errorEntries = Object.entries(errors)
  
  if (errorEntries.length === 0) return null

  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            There were {errorEntries.length} error{errorEntries.length > 1 ? 's' : ''} with your submission
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pl-5 space-y-1">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <strong>{field}:</strong> {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// API error component
interface ApiErrorProps {
  error: string
  statusCode?: number
  onRetry?: () => void
  className?: string
}

export const ApiError: React.FC<ApiErrorProps> = ({ 
  error,
  statusCode,
  onRetry,
  className = ''
}) => {
  const getErrorMessage = () => {
    if (statusCode === 401) {
      return 'Authentication required. Please log in and try again.'
    } else if (statusCode === 403) {
      return 'Access denied. You don\'t have permission to perform this action.'
    } else if (statusCode === 404) {
      return 'Resource not found.'
    } else if (statusCode === 500) {
      return 'Server error. Please try again later.'
    }
    return error || 'An unexpected error occurred.'
  }

  return (
    <ErrorMessage
      message={getErrorMessage()}
      type="error"
      onRetry={onRetry}
      className={className}
    />
  )
}

export default {
  ErrorMessage,
  NetworkError,
  FormError,
  ApiError
}