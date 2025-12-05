import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InteractiveLogo from './InteractiveLogo'

export default function HeroSection3D() {
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        <InteractiveLogo />

        <p className="text-body-lg max-w-2xl mx-auto mb-8 text-gray-600 dark:text-gray-300">
          Harness the power of artificial intelligence to predict market trends,
          analyze sentiment, and make informed investment decisions in the Nepal Stock Exchange.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/auth')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-neon-blue to-electric-purple text-white font-semibold hover:shadow-glow-blue transition-all duration-300 transform hover:scale-105"
          >
            Get Started
          </button>
          <button className="px-8 py-4 rounded-xl glass-strong font-semibold hover:glass transition-all duration-300 transform hover:scale-105">
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="glass p-6 rounded-xl">
            <div className="text-heading-2 gradient-text mb-2">200+</div>
            <div className="text-body-sm text-gray-600 dark:text-gray-400">Companies Tracked</div>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="text-heading-2 gradient-text mb-2">95%</div>
            <div className="text-body-sm text-gray-600 dark:text-gray-400">Prediction Accuracy</div>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="text-heading-2 gradient-text mb-2">24/7</div>
            <div className="text-body-sm text-gray-600 dark:text-gray-400">Market Analysis</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-neon-blue/50 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-neon-blue rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}