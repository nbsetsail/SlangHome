'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Advertisement {
  id: number
  title: string
  content: string
  image_url: string
  link_url: string
  slot_id: number
}

interface AdvertisementSlotProps {
  position: string
  className?: string
  wrapperClassName?: string
}

const CACHE_PREFIX = 'slanghome_ad_'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天

interface CachedAd {
  data: Advertisement
  timestamp: number
}

function getCachedAd(position: string): Advertisement | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${position}`)
    if (!cached) return null
    
    const entry: CachedAd = JSON.parse(cached)
    const now = Date.now()
    
    if (now - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_PREFIX}${position}`)
      return null
    }
    
    return entry.data
  } catch {
    return null
  }
}

function setCachedAd(position: string, ad: Advertisement): void {
  try {
    const entry: CachedAd = {
      data: ad,
      timestamp: Date.now()
    }
    localStorage.setItem(`${CACHE_PREFIX}${position}`, JSON.stringify(entry))
  } catch {
    // Storage full or unavailable
  }
}

export default function AdvertisementSlot({ position, className = '', wrapperClassName = '' }: AdvertisementSlotProps) {
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAd = async () => {
      const cachedAd = getCachedAd(position)
      
      if (cachedAd) {
        setAdvertisement(cachedAd)
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch(`/api/advertisements?position=${position}`)
        const data = await response.json()

        if (data.success && data.data?.advertisements?.length > 0) {
          const ads = data.data.advertisements
          const randomAd = ads[Math.floor(Math.random() * ads.length)]
          setAdvertisement(randomAd)
          setCachedAd(position, randomAd)

          try {
            const today = new Date().toDateString()
            const viewedKey = `ad_viewed_${randomAd.id}_${today}`
            
            if (typeof window !== 'undefined' && !localStorage.getItem(viewedKey)) {
              await fetch(`/api/advertisements?action=view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ advertisementId: randomAd.id })
              })
              
              localStorage.setItem(viewedKey, 'true')
            }
          } catch (err) {
            console.error('Error tracking view:', err)
          }
        }
      } catch (err) {
        console.error('Error fetching advertisement:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAd()
  }, [position])

  const handleClick = async () => {
    if (!advertisement) return

    try {
      await fetch('/api/advertisements?action=click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertisementId: advertisement.id })
      })
    } catch (err) {
      console.error('Error tracking click:', err)
    }
  }

  if (loading) {
    return null
  }

  if (!advertisement || !advertisement.link_url) {
    return null
  }

  return (
    <div className={`advertisement-slot ${wrapperClassName} ${className}`}>
      <Link
        href={advertisement.link_url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block"
      >
        {advertisement.image_url ? (
          <div className="relative w-full" style={{ minHeight: 60 }}>
            <Image
              src={advertisement.image_url}
              alt={advertisement.title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded text-center">
            <div className="font-semibold text-gray-800">{advertisement.title}</div>
            {advertisement.content && (
              <div className="text-sm text-gray-600 mt-1">{advertisement.content}</div>
            )}
          </div>
        )}
      </Link>
    </div>
  )
}
