import { useState, useRef, useEffect } from 'react'
import { Search, Mic, X, TrendingUp, TrendingDown, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/apiClient'
import { useAuth } from '../../lib/AuthContext'

interface Company {
  symbol: string
  name: string
  sector?: string
  price?: number
  change?: number
  changePercent?: number
}

interface CompanySearchProps {
  onSelect?: (company: Company) => void
}

export default function CompanySearch({ onSelect }: CompanySearchProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [suggestions, setSuggestions] = useState<Company[]>([])
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch companies on mount (only if authenticated)
  useEffect(() => {
    if (!user) return
    
    const fetchCompanies = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/companies')
        if (res.ok) {
          const data = await res.json()
          setAllCompanies(data.companies || [])
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [user])

  useEffect(() => {
    if (query.length > 0) {
      const filtered = allCompanies.filter(
        (company) =>
          company.symbol.toLowerCase().includes(query.toLowerCase()) ||
          company.name.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 10)) // Limit to top 10 matches
    } else {
      setSuggestions([])
    }
  }, [query, allCompanies])

  useEffect(() => {
    if (isFocused && containerRef.current) {
      // Dynamically import GSAP when needed
      import('gsap').then((gsapModule) => {
        const gsap = gsapModule.gsap || gsapModule.default || gsapModule
        gsap.to(containerRef.current, {
          scale: 1.02,
          duration: 0.3,
          ease: 'power2.out',
        })
      }).catch((error) => {
        console.warn('GSAP not available for search animation:', error)
        // Fallback without animation
        if (containerRef.current) {
          containerRef.current.style.transform = 'scale(1.02)'
        }
      })
    } else if (containerRef.current) {
      // Dynamically import GSAP when needed
      import('gsap').then((gsapModule) => {
        const gsap = gsapModule.gsap || gsapModule.default || gsapModule
        gsap.to(containerRef.current, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        })
      }).catch((error) => {
        console.warn('GSAP not available for search animation:', error)
        // Fallback without animation
        if (containerRef.current) {
          containerRef.current.style.transform = 'scale(1)'
        }
      })
    }
  }, [isFocused])

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleSelect = (company: Company) => {
    if (!user) {
      navigate('/auth')
      return
    }
    
    setQuery(company.symbol)
    setSuggestions([])
    onSelect?.(company)
    // Navigate to company detail page
    navigate(`/companies/${company.symbol}`)
  }

  const handleInputFocus = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    setIsFocused(true)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      <div
        ref={containerRef}
        className={`relative glass-strong rounded-xl transition-all duration-300 ${isFocused ? 'glow-blue' : ''
          }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="text-gray-400" size={20} />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={!user ? "Sign in to search companies..." : loading ? "Loading companies..." : "Search companies by symbol or name..."}
            className="flex-1 bg-transparent outline-none text-body placeholder:text-gray-500"
            disabled={loading || !user}
          />

          {query && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Clear search"
            >
              <X size={18} className="text-gray-400" />
            </button>
          )}

          <button
            onClick={handleVoiceSearch}
            className={`p-2 rounded-lg transition-all duration-300 ${isListening
                ? 'bg-red-500/20 text-red-500 animate-pulse'
                : 'hover:bg-white/10 text-gray-400'
              }`}
            aria-label="Voice search"
          >
            <Mic size={18} />
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden animate-slide-down z-50">
            {suggestions.map((company) => (
              <button
                key={company.symbol}
                onClick={() => handleSelect(company)}
                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors duration-200 border-b border-white/5 last:border-b-0 flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neon-blue">{company.symbol}</span>
                    <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                      {company.sector || 'General'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {company.name}
                  </div>
                </div>

                {/* Price Info */}
                {company.price !== undefined && (
                  <div className="text-right">
                    <div className="font-medium text-gray-200">
                      NPR {company.price.toLocaleString()}
                    </div>
                    {company.change !== undefined && company.changePercent !== undefined && (
                      <div className={`text-xs flex items-center justify-end gap-1 ${company.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {company.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>
                          {company.change > 0 ? '+' : ''}{company.change} ({company.changePercent}%)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isListening && (
        <div className="text-center mt-4 text-sm text-gray-400 animate-pulse">
          Listening...
        </div>
      )}
    </div>
  )
}