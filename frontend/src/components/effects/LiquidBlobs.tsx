import { useEffect, useState } from 'react'

export default function LiquidBlobs() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
      aria-hidden="true"
    >
      {/* Blob 1 - Blue */}
      <div
        className="blob absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-float blob-1"
      />
      
      {/* Blob 2 - Purple */}
      <div
        className="blob absolute w-80 h-80 rounded-full opacity-20 blur-3xl animate-float blob-2"
      />
      
      {/* Blob 3 - Green */}
      <div
        className="blob absolute w-72 h-72 rounded-full opacity-15 blur-3xl animate-float blob-3"
      />
    </div>
  )
}