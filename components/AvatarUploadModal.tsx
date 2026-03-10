'use client'
import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (normalFile: File, smallFile: File) => Promise<void>
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      1,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function AvatarUploadModal({ isOpen, onClose, onUpload }: AvatarUploadModalProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const [imgSrc, setImgSrc] = useState<string>('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      if (file.size > 10 * 1024 * 1024) {
        setError(t('profile.avatarSizeLimit'))
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalidImageFormat'))
        return
      }
      
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
      })
      reader.readAsDataURL(file)
    }
  }
  
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const initialCrop = centerAspectCrop(width, height)
    setCrop(initialCrop)
    setCompletedCrop(initialCrop)
  }
  
  const getCroppedImgs = useCallback(async (): Promise<{ normal: File; small: File } | null> => {
    const image = imgRef.current
    if (!image || !completedCrop) return null
    
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY
    
    const createCanvas = (size: number): HTMLCanvasElement => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')
      
      canvas.width = size
      canvas.height = size
      
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        size,
        size,
      )
      
      return canvas
    }
    
    return new Promise((resolve) => {
      try {
        const normalCanvas = createCanvas(112)
        const smallCanvas = createCanvas(28)
        
        normalCanvas.toBlob(
          (normalBlob) => {
            if (!normalBlob) {
              resolve(null)
              return
            }
            smallCanvas.toBlob(
              (smallBlob) => {
                if (!smallBlob) {
                  resolve(null)
                  return
                }
                const normalFile = new File([normalBlob], 'avatar.png', { type: 'image/png' })
                const smallFile = new File([smallBlob], 'avatar_small.png', { type: 'image/png' })
                resolve({ normal: normalFile, small: smallFile })
              },
              'image/png',
              0.9,
            )
          },
          'image/png',
          0.9,
        )
      } catch {
        resolve(null)
      }
    })
  }, [completedCrop])
  
  const handleUpload = async () => {
    const files = await getCroppedImgs()
    if (!files) {
      setError(t('profile.pleaseSelectArea'))
      return
    }
    
    setLoading(true)
    try {
      await onUpload(files.normal, files.small)
      handleClose()
    } catch (err) {
      setError(t('profile.uploadFailed'))
    } finally {
      setLoading(false)
    }
  }
  
  const handleClose = () => {
    setImgSrc('')
    setCrop(undefined)
    setCompletedCrop(undefined)
    setError('')
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
      <div className={`relative ${cn.colors.bg.card} rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className={`p-4 border-b ${cn.colors.border.default}`}>
          <h3 className={`text-lg font-semibold ${cn.colors.text.primary}`}>{t('profile.uploadAvatar')}</h3>
        </div>
        
        <div className="p-4">
          {error && (
            <div className={`${cn.errorMessage} p-3 rounded-md mb-4 text-sm`}>{error}</div>
          )}
          
          {!imgSrc ? (
            <div>
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed ${cn.colors.border.default} rounded-lg cursor-pointer ${cn.colors.bg.lightHover}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className={`w-10 h-10 mb-3 ${cn.colors.text.muted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className={`mb-2 text-sm ${cn.colors.text.muted}`}>
                    <span className="font-semibold">{t('profile.clickToUpload')}</span>
                  </p>
                  <p className={`text-xs ${cn.colors.text.muted}`}>{t('profile.avatarRequirements')}</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={onSelectFile}
                />
              </label>
              
              <div className={`mt-4 p-3 ${cn.colors.bg.light} rounded-md`}>
                <p className={`text-sm ${cn.colors.text.muted}`}>
                  {t('profile.avatarTips')}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-center mb-4">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  circularCrop
                  aspect={1}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[300px]"
                  />
                </ReactCrop>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined) }}
                  className={`px-4 py-2 rounded-md ${cn.colors.bg.light} ${cn.colors.text.primary} ${cn.colors.bg.lightHover}`}
                >
                  {t('common.reselect')}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md ${loading ? cn.disabledButton : cn.primaryButton}`}
                >
                  {loading ? t('common.uploading') : t('common.upload')}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className={`p-4 border-t ${cn.colors.border.default} flex justify-end`}>
          <button
            onClick={handleClose}
            className={`px-4 py-2 rounded-md ${cn.colors.bg.light} ${cn.colors.text.primary} ${cn.colors.bg.lightHover}`}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
