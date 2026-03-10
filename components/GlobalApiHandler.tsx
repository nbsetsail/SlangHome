'use client'

import { useEffect } from 'react'
import { useToast } from '@/components/ui/Notifications'
import { useTranslations } from 'next-intl'

export default function GlobalApiHandler({ children }: { children: React.ReactNode }) {
  const { showError } = useToast()
  const t = useTranslations('rateLimit')

  useEffect(() => {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      
      if (response.status === 429) {
        let rateLimitType = response.headers.get('X-RateLimit-Type') || 'default'
        
        try {
          const clonedResponse = response.clone()
          const data = await clonedResponse.json().catch(() => ({}))
          
          if (data.messageKey) {
            const key = data.messageKey.replace('rateLimit.', '') as any
            showError(t(key))
            return response
          }
        } catch {
          // ignore parse errors
        }
        
        const typeKey = rateLimitType.replace(/-/g, '') as any
        const message = t(typeKey) || t('default')
        
        showError(message)
      }
      
      return response
    }
    
    return () => {
      window.fetch = originalFetch
    }
  }, [showError, t])

  return <>{children}</>
}
