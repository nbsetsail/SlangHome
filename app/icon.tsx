import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fdba74"/>
            <stop offset="100%" stopColor="#d1d5db"/>
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="1.5" fill="none"/>
        <ellipse cx="12" cy="12" rx="11" ry="4" stroke="url(#orbitGradient)" strokeWidth="0.5" fill="none"/>
        <path d="M5 3c1 1.5 1.5 3 1 4.5c-.5 1.5-2 2-3 3c-1.5 1-2 2.5-1 4c.5 1 1.5 1.5 2.5 1c1.5-.5 2-2 3.5-2.5c1.5-.5 3 .5 3.5 2c.5 1.5-.5 3-2 4c-1 .5-2 1-2 2.5" stroke="#fdba74" strokeWidth="2" fill="none"/>
        <path d="M7 4c.5 1 0 2-.5 2.5c-1 1-2 1.5-2.5 2.5" stroke="#fed7aa" strokeWidth="1.5" fill="none"/>
        <path d="M11 15c.5 1 1 2.5 0 4" stroke="#fed7aa" strokeWidth="1.5" fill="none"/>
        <path d="M15 4v16M15 4l3 6 3-6M15 20l3-6 3 6" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    {
      ...size,
    }
  )
}
