'use client'

import React from 'react'

export default function ParticleGlobe() {
  return (
    <div className="w-48 h-48 md:w-64 md:h-64 relative">
      <div className="absolute inset-0 bg-white/10 rounded-full backdrop-blur-sm animate-pulse-slow"></div>
      <div className="absolute inset-0 rounded-full animate-glow"></div>
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full relative z-10 animate-spin-slow" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" className="stroke-blue-400 animate-stroke-pulse"/>
        <ellipse cx="12" cy="12" rx="10" ry="4" className="stroke-orange-300 animate-stroke-shift"/>
        <path d="M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10" className="stroke-green-400 animate-stroke-shift" style={{ animationDelay: '0.5s' }}/>
        <path d="M12 2c-2.5 2.5-4 6-4 10s1.5 7.5 4 10" className="stroke-purple-400 animate-stroke-shift" style={{ animationDelay: '1s' }}/>
        <path d="M2 12h20" className="stroke-gray-400 animate-stroke-shift" style={{ animationDelay: '1.5s' }}/>
        <circle cx="12" cy="12" r="2" className="fill-orange-400 stroke-orange-500 animate-pulse-core"/>
      </svg>
      
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full animate-orbit-particle"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 60}deg) translateX(${80 + i * 5}px)`,
              animationDelay: `${i * 0.5}s`,
              opacity: 0.6 - i * 0.08
            }}
          />
        ))}
      </div>
    </div>
  )
}
