'use client'
import React, { useEffect } from 'react'

interface SlangSeoProps {
  phrase?: string
  explanation?: string
  example?: string
  categories?: string
  tags?: string
}

export default function SlangSeo({ phrase, explanation, example, categories, tags }: SlangSeoProps) {
  useEffect(() => {
    if (!phrase) return

    // Update page title
    const title = `${phrase} - Meaning & Definition | Slang Home`
    document.title = title

    // Update or create meta description
    const description = explanation 
      ? `${phrase}: ${explanation.substring(0, 150)}${explanation.length > 150 ? '...' : ''}`
      : `Discover the meaning and usage of "${phrase}" on Slang Home - your ultimate slang dictionary.`

    updateMetaTag('description', description)
    updateMetaTag('keywords', generateKeywords(phrase, categories, tags))

    // Update Open Graph tags
    updateMetaTag('og:title', title, 'property')
    updateMetaTag('og:description', description, 'property')
    updateMetaTag('og:type', 'article', 'property')

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary', 'name')
    updateMetaTag('twitter:title', title, 'name')
    updateMetaTag('twitter:description', description, 'name')

    // Update canonical URL
    updateCanonicalUrl()

    // Add structured data
    addStructuredData(phrase, explanation, example)

    // Cleanup function
    return () => {
      // Remove structured data on unmount
      const existingScript = document.getElementById('slang-structured-data')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [phrase, explanation, example, categories, tags])

  return null
}

function updateMetaTag(name: string, content: string, attr: string = 'name') {
  let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement
  
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attr, name)
    document.head.appendChild(meta)
  }
  
  meta.setAttribute('content', content)
}

function updateCanonicalUrl() {
  const canonicalUrl = window.location.href.split('?')[0]
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
  
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  
  link.setAttribute('href', canonicalUrl)
}

function generateKeywords(phrase: string, categories?: string | string[], tags?: string | string[]): string {
  const keywords = [phrase, 'slang', 'meaning', 'definition', 'slang dictionary']
  
  if (categories) {
    const categoryList = Array.isArray(categories) ? categories : categories.split(',').map(c => c.trim())
    keywords.push(...categoryList)
  }
  
  if (tags) {
    const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())
    keywords.push(...tagList)
  }
  
  return keywords.filter(k => k).join(', ')
}

function addStructuredData(phrase: string, explanation?: string, example?: string) {
  // Remove existing structured data
  const existingScript = document.getElementById('slang-structured-data')
  if (existingScript) {
    existingScript.remove()
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: phrase,
    description: explanation || `Definition of the slang term "${phrase}"`,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Slang Home Dictionary',
      url: 'https://slanghome.com'
    }
  }

  if (example) {
    (structuredData as any).usageInfo = example
  }

  const script = document.createElement('script')
  script.id = 'slang-structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(structuredData)
  document.head.appendChild(script)
}
