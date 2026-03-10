'use client'
import React from 'react'
import { EvolutionItem } from '../types'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

interface EvolutionTimelineProps {
  evolution: EvolutionItem[]
  onClose?: () => void
}

export default function EvolutionTimeline({ evolution, onClose }: EvolutionTimelineProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  return (
    <div className="mt-6 ml-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-md font-medium ${cn.colors.text.muted}`}>{t('slang.evolutionTimeline')}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className={`text-sm ${cn.link} flex items-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('slang.hideEvolution')}
          </button>
        )}
      </div>
      <div className="relative">
        {/* Timeline line */}
        <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${cn.timelineLine}`}></div>
        
        {/* Timeline items */}
        <div className="space-y-4 relative">
          {evolution.map((item, index) => (
            <div key={item.id} className="flex">
              {/* Timeline dot */}
              <div className="relative">
                <div className={`w-6 h-6 rounded-full ${cn.timelineDot} flex items-center justify-center text-white text-xs font-bold`}>
                  {index + 1}
                </div>
              </div>
              
              {/* Timeline content */}
              <div className={`ml-3 ${cn.timelineContent} p-3 rounded-md border flex-1`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-medium ${cn.title} text-sm`}>{item.phase}</h4>
                  <span className={`${cn.colors.bg.medium} ${cn.colors.text.muted} text-xs font-medium px-2 py-0.5 rounded-full`}>
                    {item.period}
                  </span>
                </div>
                
                <p className={`${cn.colors.text.muted} text-sm mb-2`}>{item.explanation}</p>
                
                {item.example && (
                  <p className={`${cn.colors.text.muted} text-xs mb-1`}><strong>{t('slang.example')}:</strong> {item.example}</p>
                )}
                
                {item.origin && (
                  <p className={`${cn.colors.text.muted} text-xs mb-1`}><strong>{t('slang.origin')}:</strong> {item.origin}</p>
                )}
                
                {item.story && (
                  <div className={`mt-2 p-2 ${cn.storyBox}`}>
                    <h5 className={`font-medium ${cn.storyTitle} text-xs mb-1`}>{t('slang.interestingFact')}</h5>
                    <p className={`${cn.storyTitle} text-xs`}>{item.story}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}