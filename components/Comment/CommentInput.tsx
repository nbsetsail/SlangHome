'use client'
import React, { useState, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'
import EmojiPicker from './EmojiPicker'
import { compressImage, uploadImage, isGif, getImagePreview } from '@/lib/image-utils'
import { FEATURES } from '@/lib/env'

interface CommentImage {
  url: string
  preview?: string
  file?: File
}

interface CommentInputProps {
  onSubmit: (content: string, images?: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  isUploading?: boolean
  uploadError?: string | null
  setUploadError?: (error: string | null) => void
  compact?: boolean
}

export default function CommentInput({
  onSubmit,
  placeholder,
  disabled = false,
  isUploading = false,
  uploadError: externalUploadError,
  setUploadError: setExternalUploadError,
  compact = false
}: CommentInputProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const [text, setText] = useState('')
  const [images, setImages] = useState<CommentImage[]>([])
  const [internalUploadError, setInternalUploadError] = useState<string | null>(null)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const uploadError = externalUploadError ?? internalUploadError
  const setUploadError = setExternalUploadError ?? setInternalUploadError

  const handleEmojiClick = (emoji: string) => {
    setText(prev => prev + emoji)
  }

  const handleOpenEmojiPicker = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiPickerAnchor(event.currentTarget)
    setIsEmojiPickerOpen(true)
  }

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    const newImages: CommentImage[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setUploadError(t('comments.invalidImageFormat'))
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError(t('comments.imageSizeLimit'))
        continue
      }

      try {
        const preview = await getImagePreview(file)
        newImages.push({ url: '', preview, file })
      } catch (error) {
        console.error('Failed to read image:', error)
      }
    }

    setImages(prev => [...prev, ...newImages].slice(0, 3))
    event.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (imageList: CommentImage[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const image of imageList) {
      if (image.file) {
        try {
          let fileToUpload = image.file
          
          if (!isGif(image.file)) {
            fileToUpload = await compressImage(image.file, {
              maxWidth: 800,
              maxHeight: 800,
              quality: 0.8,
              maxSizeKB: 500
            })
          }

          const result = await uploadImage(fileToUpload, 'comment')
          if (result.success && result.url) {
            uploadedUrls.push(result.url)
          } else {
            throw new Error(result.error || 'Upload failed')
          }
        } catch (error) {
          console.error('Failed to upload image:', error)
          throw error
        }
      } else if (image.url) {
        uploadedUrls.push(image.url)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) return
    
    setUploadError(null)
    
    try {
      let imageUrls: string[] = []
      if (images.length > 0) {
        imageUrls = await uploadImages(images)
      }
      
      await onSubmit(
        text.trim(),
        imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined
      )
      
      setText('')
      setImages([])
    } catch (err) {
      console.error('Failed to submit:', err)
      setUploadError(t('comments.uploadFailed'))
    }
  }

  const renderImagePreviews = () => {
    if (images.length === 0) return null
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {images.map((img, index) => (
          <div key={index} className="relative group">
            <img
              src={img.preview || img.url}
              alt={`Preview ${index + 1}`}
              className="w-16 h-16 object-cover rounded-lg border"
            />
            <button
              onClick={() => handleRemoveImage(index)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`${compact ? 'bg-gray-100 p-2 rounded-md' : 'bg-gray-50 p-4 rounded-lg'}`}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || t('comments.addComment')}
        className={`w-full border rounded-md ${compact ? 'p-2 text-sm' : 'p-3'} ${cn.input}`}
        rows={compact ? 2 : 3}
      />
      
      {renderImagePreviews()}
      
      {uploadError && (
        <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>
      )}
      
      <div className={`mt-2 flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenEmojiPicker}
            className={`p-1.5 rounded-md ${cn.colors.bg.light} ${cn.colors.bg.lightHover} transition-colors`}
            title={t('comments.addEmoji')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {FEATURES.COMMENT_IMAGE_UPLOAD_ENABLED && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1.5 rounded-md ${cn.colors.bg.light} ${cn.colors.bg.lightHover} transition-colors`}
                title={t('comments.addImage')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              
              {!compact && (
                <span className={`text-xs ${cn.colors.text.muted}`}>
                  {t('comments.maxImages')}
                </span>
              )}
            </>
          )}
        </div>
        
        <button
          onClick={handleSubmit}
          className={`${cn.colors.bg.primary} text-white ${compact ? 'py-0.5 px-3 text-xs' : 'py-1.5 px-5 text-sm'} rounded-md ${cn.colors.bg.primaryHover}`}
          disabled={(!text.trim() && images.length === 0) || isUploading || disabled}
        >
          {isUploading ? t('common.uploading') : t('comments.postComment')}
        </button>
      </div>

      <EmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onEmojiSelect={handleEmojiClick}
        anchorEl={emojiPickerAnchor}
      />
    </div>
  )
}
