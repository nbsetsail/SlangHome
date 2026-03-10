'use client'

import React from 'react'
import SlangCard from '@/components/SlangCard'
import AdvertisementSlot from '@/components/AdvertisementSlot'
import { ContentLoader, ErrorMessage } from '@/components/ui'
import { SlangItem } from '@/types'
import { useTranslation } from '@/hooks'

interface SlangListProps {
  slangList: SlangItem[]
  loading: boolean
  isLoadingMore: boolean
  error: string
  hasMore: boolean
  loaderClassName: string
}

export function SlangList({
  slangList,
  loading,
  isLoadingMore,
  error,
  hasMore,
  loaderClassName
}: SlangListProps) {
  const { t } = useTranslation()

  if (loading) {
    return <ContentLoader text={t('common.loadingSlang')} minHeight="py-12" />
  }

  if (error) {
    return <ErrorMessage message={error} type="error" className="rounded-md" />
  }

  return (
    <>
      <div className="space-y-4">
        {slangList.map((slang, index) => (
          <React.Fragment key={slang.id}>
            <SlangCard
              {...slang}
              evolution={slang.evolution || []}
            />
            {(index === 4 || ((index + 1) % 15 === 0 && index !== 4)) && (
              <AdvertisementSlot position="content_middle" className="w-full" wrapperClassName="py-4" />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className={loaderClassName}></div>
        </div>
      )}
      
      {(!hasMore && slangList.length > 0) && (
        <div className="text-center py-4 text-gray-500">
          {t('slang.noMore')}
        </div>
      )}
      
      {slangList.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500">
          {t('slang.noResults')}
        </div>
      )}
    </>
  )
}
