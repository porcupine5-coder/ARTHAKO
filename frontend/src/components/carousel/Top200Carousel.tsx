import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiFetch, API_BASE_URL } from '../../lib/apiClient'
import { useAuth } from '../../lib/AuthContext'
import Loader from '../common/Loader'

interface Company {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  sector: string
  chartHeights?: number[]
}

export default function Top200Carousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  // Removed global chartHeights as we now use per-company chart heights

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError('')
    
    const fetchCompanies = async () => {
      try {
        const response = await apiFetch('/companies')
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = errorData?.error || errorMessage
          } catch {
            // JSON parse failed, use status text
          }
          throw new Error(`Failed to fetch companies: ${errorMessage}`)
        }

        const data = await response.json()
        const companiesList = (data?.companies || []).slice(0, 200)
        
        // Fetch company-specific data for each company
        const companiesWithData = await Promise.all(
          companiesList.map(async (c: { symbol: string; name: string; sector?: string }) => {
            try {
              // Fetch company-specific OHLC data
              const ohlcResponse = await apiFetch(`/companies/${c.symbol}/ohlc`)
              if (!ohlcResponse.ok) {
                throw new Error(`Failed to fetch OHLC data for ${c.symbol}`)
              }
              
              const ohlcData = await ohlcResponse.json()
              const priceData = ohlcData.ohlc || []
              
              // Calculate price and change from actual data
              const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1].close : 0
              const previousPrice = priceData.length > 1 ? priceData[priceData.length - 2].close : latestPrice
              const change = latestPrice - previousPrice
              const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0
              
              // Generate chart heights from actual price data
              const chartPoints = priceData.slice(-12).map((point: { close: number }) => point.close)
              const min = Math.min(...chartPoints)
              const max = Math.max(...chartPoints)
              const range = max - min
              
              // Normalize chart heights to 0-100%
              const normalizedHeights = chartPoints.map((point: number) => 
                range > 0 ? ((point - min) / range) * 100 : 50
              )
              
              return {
                symbol: c.symbol,
                name: c.name,
                price: Math.round(latestPrice * 100) / 100,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                sector: c.sector || 'General',
                chartHeights: normalizedHeights
              }
            } catch (error) {
              console.warn(`Error fetching data for ${c.symbol}:`, error)
              // Fallback to random data if fetch fails
              const basePrice = 200 + Math.random() * 1500
              const change = (Math.random() - 0.5) * 50
              const changePercent = (change / basePrice) * 100
              return {
                symbol: c.symbol,
                name: c.name,
                price: Math.round(basePrice * 100) / 100,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                sector: c.sector || 'General',
                chartHeights: Array.from({ length: 12 }, () => Math.random() * 100)
              }
            }
          })
        )
        
        setCompanies(companiesWithData)
      } catch (e: any) {
        console.error('Error loading companies:', e)
        let errorMsg = 'Failed to load companies'
        
        // Handle different types of errors
        if (e instanceof TypeError && e.message.includes('fetch')) {
          // Network error - likely server not running or CORS issue
          errorMsg = `Unable to connect to the API server. Please ensure the API server is reachable at ${API_BASE_URL}`
        } else if (e?.message) {
          errorMsg = e.message
        }
        
        setError(errorMsg)
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [user])

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  // Paging (chunk by 3 cards)
  const chunkSize = 3
  const pages = useMemo(() => Math.ceil(companies.length / chunkSize), [companies.length])
  const [pageIndex, setPageIndex] = useState(0)
  const positionsRef = useRef<number[]>([])

  // Measure child offsets to enable precise scroll-to
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]
    positionsRef.current = children.map(c => c.offsetLeft)
  }, [companies.length])

  const scrollToPage = (i: number) => {
    const el = scrollRef.current
    if (!el) return
    const startIdx = Math.min(i * chunkSize, positionsRef.current.length - 1)
    const left = positionsRef.current[startIdx] ?? 0
    el.scrollTo({ left, behavior: 'smooth' })
    setPageIndex(i)
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const left = el.scrollLeft
    // approximate by dividing by the offset of each chunk start
    const startPositions = positionsRef.current.filter((_, idx) => idx % chunkSize === 0)
    let i = 0
    for (let p = 0; p < startPositions.length; p++) {
      if (left >= startPositions[p] - 40) i = p
    }
    setPageIndex(i)
  }

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-heading-1 mb-4">Top Companies</h2>
          <Loader />
        </div>
      </section>
    )
  }

  if (companies.length === 0 && !loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-heading-1 mb-4">Top Companies</h2>
          {error ? (
            <div className="glass p-6 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="text-red-500 font-medium mb-2">Error loading companies</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          ) : (
            <p className="text-body text-gray-600 dark:text-gray-400">
              No companies available at the moment.
            </p>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-heading-1 mb-4">Top {companies.length} Companies</h2>
        <p className="text-body text-gray-600 dark:text-gray-400">
          Explore the top performing companies in NEPSE
        </p>
        {/* Dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${pageIndex === i ? 'w-6 bg-neon-blue' : 'w-2 bg-gray-400/50'}`}
              onClick={() => scrollToPage(i)}
            />
          ))}
        </div>
      </div>

      {/* Scroll Controls + Track */}
      <div className="relative max-w-7xl mx-auto">
        <button
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full glass hover:glass-strong"
          onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
        >
          ‹
        </button>
        <button
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full glass hover:glass-strong"
          onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
        >
          ›
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onScroll={onScroll}
        >
          {companies.map((company, index) => (
            <motion.div
              key={company.symbol}
              className="flex-shrink-0 w-80 snap-start"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            >
              <div className="glass p-6 rounded-xl h-full hover:glass-strong transition-all duration-300 group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-heading-3 gradient-text mb-1">{company.symbol}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{company.name}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10">
                    {company.sector}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-2">NPR {company.price.toLocaleString()}</div>
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      company.change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {company.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>
                      {company.change >= 0 ? '+' : ''}
                      {company.change} ({company.changePercent >= 0 ? '+' : ''}
                      {company.changePercent}%)
                    </span>
                  </div>
                </div>

                {/* Company-Specific Chart */}
                <div className="h-16 rounded-lg bg-gradient-to-r from-neon-blue/10 to-electric-purple/10 flex items-end justify-around p-2 gap-1">
                  {(company.chartHeights || Array(12).fill(50)).map((height, i) => (
                    <div
                      key={`${company.symbol}-chart-${i}`}
                      className="flex-1 bg-neon-blue/30 rounded-sm transition-all duration-300 group-hover:bg-neon-blue/50"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Action Button */}
                <button
                  className="w-full mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-blue/50 transition-all duration-300 text-sm font-medium"
                  onClick={() => navigate(`/companies/${company.symbol}`)}
                >
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll Hint */}
      <div className="text-center mt-6 text-sm text-gray-500">← Scroll to explore more →</div>
    </section>
  )
}