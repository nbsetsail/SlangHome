'use client'
import React from 'react'

interface JsonLdProps {
  data: Record<string, any>
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// 网站结构化数据
export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Slang Home',
  description: 'Your Ultimate Slang Dictionary - Discover and learn the latest slang words and phrases',
  url: 'https://slanghome.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://slanghome.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

// 组织结构化数据
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Slang Home',
  description: 'Your Ultimate Slang Dictionary',
  url: 'https://slanghome.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://slanghome.com/logo.png',
    width: 512,
    height: 512,
  },
  sameAs: [
    'https://twitter.com/slanghome',
    'https://facebook.com/slanghome',
    'https://instagram.com/slanghome',
  ],
}

// 词典应用结构化数据
export const dictionaryAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'Slang Home Dictionary',
  description: 'A comprehensive collection of modern slang words and phrases',
  url: 'https://slanghome.com',
}
