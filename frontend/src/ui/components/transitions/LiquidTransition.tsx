import React from 'react'

export default function LiquidTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="transition-opacity duration-300">
      {children}
    </div>
  )
}
