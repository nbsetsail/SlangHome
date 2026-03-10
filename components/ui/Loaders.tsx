/**
 * 通用加载指示器组件
 * 解决项目中重复的加载动画模式
 */

import React from 'react'
import { useTranslation } from '@/hooks'

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const colorClasses = {
  blue: 'border-blue-500',
  gray: 'border-gray-500',
  white: 'border-white',
  primary: 'border-blue-500'
}

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'gray' | 'white' | 'primary'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  className = ''
}) => {
  return (
    <div 
      className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

// 带文本的加载指示器
interface LoadingIndicatorProps {
  text?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'gray' | 'white' | 'primary'
  className?: string
  textClassName?: string
  showText?: boolean
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  text,
  size = 'md',
  color = 'blue',
  className = '',
  textClassName = '',
  showText = true
}) => {
  const { t } = useTranslation()
  const displayText = text || t('common.loading')
  
  return (
    <div className={`flex items-center ${className}`}>
      <Spinner size={size} color={color} />
      {showText && (
        <span className={`ml-2 ${textClassName}`}>
          {displayText}
        </span>
      )}
    </div>
  )
}

// 页面级加载容器
interface PageLoaderProps {
  text?: string
  fullScreen?: boolean
  className?: string
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  text,
  fullScreen = true,
  className = ''
}) => {
  const { t } = useTranslation()
  const displayText = text || t('common.loading')
  const containerClasses = fullScreen 
    ? 'min-h-screen bg-gray-100 flex items-center justify-center'
    : 'flex justify-center items-center py-12'

  return (
    <div className={`${containerClasses} ${className}`}>
      <LoadingIndicator 
        text={displayText}
        size="lg"
        color="blue"
        textClassName="text-gray-600"
      />
    </div>
  )
}

// 内容区域加载器
interface ContentLoaderProps {
  text?: string
  minHeight?: string
  className?: string
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({ 
  text,
  minHeight = 'py-8',
  className = ''
}) => {
  const { t } = useTranslation()
  const displayText = text || t('common.loadingContent')
  
  return (
    <div className={`flex justify-center items-center ${minHeight} ${className}`}>
      <LoadingIndicator 
        text={displayText}
        size="md"
        color="blue"
        textClassName="text-gray-600 text-sm"
      />
    </div>
  )
}

// 按钮加载状态
interface ButtonLoaderProps {
  children: React.ReactNode
  loading: boolean
  loaderText?: string
  size?: 'sm' | 'md' | 'lg'
  color?: 'white' | 'blue'
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({ 
  children,
  loading,
  loaderText,
  size = 'md',
  color = 'white'
}) => {
  const { t } = useTranslation()
  const spinnerSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'
  const displayText = loaderText || t('common.loading')
  
  if (loading) {
    return (
      <div className="flex items-center">
        <Spinner 
          size={spinnerSize} 
          color={color}
          className="mr-2"
        />
        {displayText}
      </div>
    )
  }

  return <>{children}</>
}

// 表格加载器
interface TableLoaderProps {
  rows?: number
  columns?: number
  className?: string
}

export const TableLoader: React.FC<TableLoaderProps> = ({ 
  rows = 5,
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* 表头骨架屏 */}
      <div className="h-12 bg-gray-200 rounded-t-lg"></div>
      
      {/* 表格行骨架屏 */}
      {Array.from({ length: rows }).map((_, index) => (
        <div 
          key={index} 
          className="h-16 bg-gray-100 border-b border-gray-200"
          style={{ width: '100%' }}
        ></div>
      ))}
      
      {/* 表尾骨架屏 */}
      <div className="h-12 bg-gray-200 rounded-b-lg"></div>
    </div>
  )
}

// 卡片加载器
interface CardLoaderProps {
  count?: number
  className?: string
}

export const CardLoader: React.FC<CardLoaderProps> = ({ 
  count = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* 标题骨架屏 */}
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            
            {/* 内容骨架屏 */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            
            {/* 底部按钮骨架屏 */}
            <div className="flex justify-between items-center mt-6">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default {
  Spinner,
  LoadingIndicator,
  PageLoader,
  ContentLoader,
  ButtonLoader,
  TableLoader,
  CardLoader
}
