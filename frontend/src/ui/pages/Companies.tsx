import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Search, Filter, Eye } from 'lucide-react'
import { apiFetch, API_BASE_URL } from '../../lib/apiClient'
import BanterLoader from '../../components/common/BanterLoader'

type Company = {
  symbol: string
  name: string
  sector?: string
  marketCap?: number
  peRatio?: number
  price?: number
  change?: number
  changePercent?: number
  sentiment?: 'bullish' | 'neutral' | 'bearish'
  recommendation?: string
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [displayedCompanies, setDisplayedCompanies] = useState<Company[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'marketCap'>('symbol')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [visibleCount, setVisibleCount] = useState(20)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setError('')

    const fetchCompaniesWithData = async () => {
      try {
        // Fetch companies list (already includes price, change, and changePercent)
        const companiesRes = await apiFetch('/companies')
        if (!companiesRes.ok) {
          const errorData = await companiesRes.json().catch(() => ({ error: 'Failed to fetch companies' }))
          throw new Error(errorData?.error || `HTTP ${companiesRes.status}: ${companiesRes.statusText}`)
        }

        const companiesData = await companiesRes.json()
        const companiesList = companiesData?.companies || []

        // The /companies endpoint already returns price, change, and changePercent
        // We'll fetch AI insights in batches for better performance
        const batchSize = 50
        const companiesWithData: Company[] = []

        for (let i = 0; i < companiesList.length; i += batchSize) {
          const batch = companiesList.slice(i, i + batchSize)

          const batchPromises = batch.map(async (c: any) => {
            try {
              // Only fetch insights, not OHLC (since price data is already in the company object)
              const insightsRes = await apiFetch(`/companies/${c.symbol}/insights`)
              const insights = await insightsRes.json()

              return {
                ...c,
                sentiment: insights?.ai_analysis?.sentiment || 'neutral',
                recommendation: insights?.ai_analysis?.recommendation || 'HOLD',
              }
            } catch (err) {
              console.warn(`Error fetching insights for ${c.symbol}:`, err)
              return {
                ...c,
                sentiment: 'neutral' as const,
                recommendation: 'HOLD',
              }
            }
          })

          const batchResults = await Promise.all(batchPromises)
          companiesWithData.push(...batchResults)

          // Update UI progressively as batches complete
          setCompanies([...companiesWithData])
          setFilteredCompanies([...companiesWithData])
        }

      } catch (e: any) {
        const errorMsg = e?.message || 'Failed to fetch'
        if (e instanceof TypeError && e.message.includes('fetch')) {
          setError(`Unable to connect to the API server. Please ensure it is reachable at ${API_BASE_URL}`)
        } else {
          setError(errorMsg)
        }
        console.error('Error loading companies:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchCompaniesWithData()
  }, [])

  // Filter and sort companies
  useEffect(() => {
    let filtered = [...companies]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sector filter
    if (sectorFilter !== 'All') {
      filtered = filtered.filter(c => c.sector === sectorFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || 0
      let bVal = b[sortBy] || 0

      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredCompanies(filtered)
    setVisibleCount(20) // Reset visible count when filters change
  }, [companies, searchTerm, sectorFilter, sortBy, sortOrder])

  // Update displayed companies based on visible count
  useEffect(() => {
    setDisplayedCompanies(filteredCompanies.slice(0, visibleCount))
  }, [filteredCompanies, visibleCount])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredCompanies.length) {
          setVisibleCount(prev => Math.min(prev + 20, filteredCompanies.length))
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [visibleCount, filteredCompanies.length])



  const sectors = ['All', ...Array.from(new Set(companies.map(c => c.sector).filter(Boolean)))]

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-heading-1 mb-4">Top 200 Companies</h1>
          <p className="text-body text-gray-600 dark:text-gray-400">
            Browse all top 200 listed companies in NEPSE with AI analysis and insights
          </p>
        </div>

        {/* Filters */}
        <div className="glass-strong p-6 rounded-xl mb-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search - Enhanced with 3D float and glow */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-electric-purple/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative transform transition-all duration-300 hover:translate-y-[-2px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-neon-blue transition-colors duration-300" size={20} />
                <input
                  type="text"
                  placeholder="Search by symbol or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-black/40 border-2 border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:border-neon-blue/70 focus:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all duration-300 backdrop-blur-xl"
                  style={{
                    boxShadow: searchTerm ? '0 0 20px rgba(0, 245, 255, 0.2)' : 'none'
                  }}
                />
              </div>
            </div>

            {/* Sector Filter - Enhanced select */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-electric-purple/20 to-neon-blue/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative transform transition-all duration-300 hover:translate-y-[-2px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-electric-purple transition-colors duration-300 pointer-events-none z-10" size={20} />
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-black/40 border-2 border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:border-electric-purple/70 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 backdrop-blur-xl appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23A855F7' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center'
                  }}
                  aria-label="Filter companies by sector"
                >
                  {sectors.map(sector => (
                    <option key={sector} value={sector} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      {sector}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
            <span>Showing {displayedCompanies.length} of {filteredCompanies.length} companies</span>
            {visibleCount < filteredCompanies.length && (
              <span className="text-neon-blue animate-pulse">Loading more...</span>
            )}
          </div>
        </div>

        {loading && (
          <div className="glass p-12 rounded-xl text-center" style={{ position: 'relative' }}>
            <div className="mb-6"><BanterLoader /></div>
            <div className="text-body mb-4">Loading top 200 companies with AI analysis...</div>
            <div className="text-sm text-gray-500">This may take a moment</div>
          </div>
        )}

        {error && (
          <div className="glass p-6 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="text-red-500">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <div className="glass-strong rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl">
                    <th className="text-left py-4 px-6 text-sm font-semibold">Logo</th>
                    <th
                      className="text-left py-4 px-6 text-sm font-semibold cursor-pointer hover:text-neon-blue transition-colors"
                      onClick={() => handleSort('symbol')}
                    >
                      Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold">Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold">Sector</th>
                    <th
                      className="text-right py-4 px-6 text-sm font-semibold cursor-pointer hover:text-neon-blue transition-colors"
                      onClick={() => handleSort('price')}
                    >
                      Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-4 px-6 text-sm font-semibold cursor-pointer hover:text-neon-blue transition-colors"
                      onClick={() => handleSort('change')}
                    >
                      Trend {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-4 px-6 text-sm font-semibold cursor-pointer hover:text-neon-blue transition-colors"
                      onClick={() => handleSort('marketCap')}
                    >
                      Market Cap {sortBy === 'marketCap' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-semibold">AI Sentiment</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold">Recommendation</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCompanies.map((c, index) => {
                    const isPositive = (c.change || 0) >= 0
                    const animationDelay = `${index * 50}ms`

                    return (
                      <tr
                        key={c.symbol}
                        className="border-b border-white/5 hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent transition-all duration-300 group"
                        style={{
                          animation: 'fadeInRow 0.5s ease-out',
                          animationDelay,
                          animationFillMode: 'both'
                        }}
                      >
                        {/* Logo */}
                        <td className="py-4 px-6">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue/20 to-electric-purple/20 flex items-center justify-center text-sm font-bold text-neon-blue border border-neon-blue/30 group-hover:scale-110 transition-transform duration-300">
                            {c.symbol.substring(0, 2)}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-heading-4 gradient-text group-hover:scale-105 transition-transform duration-300">{c.symbol}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-300">{c.name}</div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-white/10 to-white/5 border border-white/20 backdrop-blur-sm group-hover:border-neon-blue/30 transition-colors duration-300">
                            {c.sector}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="font-semibold">NPR {c.price?.toFixed(2) || '0.00'}</div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? <TrendingUp size={14} className="animate-bounce" /> : <TrendingDown size={14} className="animate-bounce" />}
                            <span className="font-semibold">
                              {isPositive ? '+' : ''}{c.change?.toFixed(2) || '0.00'} ({isPositive ? '+' : ''}{c.changePercent?.toFixed(2) || '0.00'}%)
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="text-sm">NPR {((c.marketCap || 0) / 1000000000).toFixed(2)}B</div>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${c.sentiment === 'bullish' ? 'bg-green-500/20 text-green-500 border border-green-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                              c.sentiment === 'bearish' ? 'bg-red-500/20 text-red-500 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                                'bg-yellow-500/20 text-yellow-500 border border-yellow-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            }`}>
                            {c.sentiment?.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${c.recommendation === 'BUY' ? 'bg-green-500/20 text-green-500 border border-green-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                              c.recommendation === 'SELL' ? 'bg-red-500/20 text-red-500 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                                'bg-blue-500/20 text-blue-500 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            }`}>
                            {c.recommendation}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <Link
                            to={`/companies/${c.symbol}`}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue/10 to-electric-purple/10 hover:from-neon-blue/20 hover:to-electric-purple/20 border border-neon-blue/30 hover:border-neon-blue/50 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all duration-300 text-sm font-medium inline-flex items-center gap-2 group-hover:scale-105"
                          >
                            <Eye size={14} />
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Infinite scroll trigger */}
            {visibleCount < filteredCompanies.length && (
              <div ref={loadMoreRef} className="py-8 text-center">
                <div className="inline-flex items-center gap-2 text-neon-blue">
                  <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {filteredCompanies.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-body text-gray-500">No companies found matching your filters.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}