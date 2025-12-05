import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, Award } from 'lucide-react'

interface CompanyDetailsProps {
  symbol: string
  fundamentals?: {
    marketCap?: number
    peRatio?: number
    eps?: number
    dividendYield?: number
    revenue?: number
    profit?: number
    roe?: number
    debtToEquity?: number
  }
  stats?: {
    high52Week?: number
    low52Week?: number
    avgVolume?: number
    beta?: number
    currentPrice?: number
    change?: number
    changePercent?: number
  }
}

export default function CompanyDetails({ symbol, fundamentals, stats }: CompanyDetailsProps) {
  const [expanded, setExpanded] = useState(false)

  // New local state for offline/cached/mock display
  const [localData, setLocalData] = useState<{ fundamentals?: CompanyDetailsProps['fundamentals']; stats?: CompanyDetailsProps['stats'] } | null>(null)
  const [hasCache, setHasCache] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [loadingRetry, setLoadingRetry] = useState(false)

  useEffect(() => {
    const key = `company:${symbol}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        setLocalData(JSON.parse(raw))
        setHasCache(true)
      } else {
        setHasCache(false)
      }
    } catch {
      setHasCache(false)
    }
  }, [symbol])

  const saveCache = useCallback((data: { fundamentals?: CompanyDetailsProps['fundamentals']; stats?: CompanyDetailsProps['stats'] }) => {
    const key = `company:${symbol}`
    try {
      localStorage.setItem(key, JSON.stringify(data))
      setHasCache(true)
      setStatusMessage('Saved to local cache.')
      setTimeout(() => setStatusMessage(null), 2500)
    } catch {
      setStatusMessage('Failed to save cache.')
      setTimeout(() => setStatusMessage(null), 2500)
    }
  }, [symbol])

  const loadCache = useCallback(() => {
    if (!hasCache) {
      setStatusMessage('No cached data available.')
      setTimeout(() => setStatusMessage(null), 2500)
      return
    }
    const key = `company:${symbol}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        setLocalData(parsed)
        setStatusMessage('Loaded cached data.')
        setTimeout(() => setStatusMessage(null), 2000)
      }
    } catch {
      setStatusMessage('Failed to load cached data.')
      setTimeout(() => setStatusMessage(null), 2000)
    }
  }, [hasCache, symbol])

  const generateMockData = useCallback(() => {
    // deterministic pseudo-random based on symbol
    const seed = symbol.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const rand = (min: number, max: number, offset = 0) => {
      const v = ((seed * 9301 + 49297 + offset) % 233280) / 233280
      return Math.round((min + v * (max - min)) * 100) / 100
    }

    const mockStats = {
      currentPrice: rand(50, 200),
      change: rand(-5, 5, 1),
      changePercent: undefined as number | undefined,
      high52Week: rand(150, 300, 2),
      low52Week: rand(20, 49, 3),
      avgVolume: Math.round(rand(1000, 100000, 4)),
      beta: rand(0, 2, 5),
    }
    mockStats.changePercent = mockStats.change !== undefined && mockStats.currentPrice ? Math.round((mockStats.change / mockStats.currentPrice) * 100 * 100) / 100 : undefined

    const mockFundamentals = {
      marketCap: Math.round(rand(1e7, 5e9, 6)),
      peRatio: rand(5, 30, 7),
      eps: rand(1, 20, 8),
      dividendYield: rand(0, 8, 9),
      revenue: Math.round(rand(5e6, 2e9, 10)),
      profit: Math.round(rand(1e6, 5e8, 11)),
      roe: rand(5, 25, 12),
      debtToEquity: rand(0, 2, 13),
    }

    const data = { fundamentals: mockFundamentals, stats: mockStats }
    setLocalData(data)
    saveCache(data)
    setStatusMessage('Generated mock data and saved to cache.')
    setTimeout(() => setStatusMessage(null), 2000)
  }, [symbol, saveCache])

  const retry = useCallback(() => {
    // simple retry UI hook — parent/app should actually re-fetch and pass props in again
    setLoadingRetry(true)
    setStatusMessage('Attempting to refresh data...')
    // dispatch a custom event so parent can listen and try to re-fetch if desired
    window.dispatchEvent(new CustomEvent('company:refresh', { detail: { symbol } }))
    setTimeout(() => {
      setLoadingRetry(false)
      setStatusMessage('Refresh triggered. If API is back, parent should provide data.')
      setTimeout(() => setStatusMessage(null), 3000)
    }, 700)
  }, [symbol])

  const formatNumber = (num?: number, prefix = '', suffix = '') => {
    if (num === undefined || num === null) return 'N/A'
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B${suffix}`
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M${suffix}`
    if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(2)}K${suffix}`
    return `${prefix}${num.toFixed(2)}${suffix}`
  }

  // choose displayed data: prefer incoming props (fresh API) otherwise local/mock
  const displayedFundamentals = fundamentals ?? localData?.fundamentals
  const displayedStats = stats ?? localData?.stats

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="text-neon-blue" size={24} />
          <div className="text-left">
            <h3 className="text-lg font-semibold">Company Details</h3>
            <p className="text-sm text-gray-500">View fundamentals and trading statistics</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-white/10">
          {/* Offline banner + actions when API props missing */}
          {!fundamentals && !stats && (
            <div className="p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-yellow-400">Data unavailable — API / AI appears down.</div>
                  <div className="text-xs text-gray-400">You can load cached data, generate mock data, or trigger a retry.</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadCache} className="px-3 py-1 bg-white/5 rounded text-sm">Use cached</button>
                  <button onClick={generateMockData} className="px-3 py-1 bg-white/5 rounded text-sm">Generate mock</button>
                  <button onClick={retry} className="px-3 py-1 bg-white/5 rounded text-sm">{loadingRetry ? 'Retrying...' : 'Retry'}</button>
                </div>
              </div>
              {statusMessage && <div className="text-xs text-gray-300 mt-2">{statusMessage}</div>}
            </div>
          )}

          {/* Current Price Section */}
          {displayedStats && (
            <div className="pt-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold">{formatNumber(displayedStats.currentPrice, 'NPR ')}</span>
                {displayedStats.change !== undefined && (
                  <div className={`flex items-center gap-1 ${displayedStats.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {displayedStats.change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    <span className="text-lg font-medium">
                      {displayedStats.change >= 0 ? '+' : ''}{displayedStats.change.toFixed(2)} ({displayedStats.changePercent !== undefined ? `${displayedStats.changePercent.toFixed(2)}%` : 'N/A'})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trading Statistics */}
          {displayedStats && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Trading Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">52 Week High</div>
                  <div className="text-lg font-semibold text-green-500">{formatNumber(displayedStats.high52Week, 'NPR ')}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">52 Week Low</div>
                  <div className="text-lg font-semibold text-red-500">{formatNumber(displayedStats.low52Week, 'NPR ')}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Avg Volume</div>
                  <div className="text-lg font-semibold">{formatNumber(displayedStats.avgVolume)}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Beta</div>
                  <div className="text-lg font-semibold">{displayedStats.beta !== undefined ? displayedStats.beta.toFixed(2) : 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Fundamentals */}
          {displayedFundamentals && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <DollarSign size={16} />
                Fundamentals
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                  <div className="text-lg font-semibold">{formatNumber(displayedFundamentals.marketCap, 'NPR ')}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">P/E Ratio</div>
                  <div className="text-lg font-semibold">{displayedFundamentals.peRatio !== undefined ? displayedFundamentals.peRatio.toFixed(2) : 'N/A'}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">EPS</div>
                  <div className="text-lg font-semibold">{formatNumber(displayedFundamentals.eps, 'NPR ')}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Dividend Yield</div>
                  <div className="text-lg font-semibold">{displayedFundamentals.dividendYield !== undefined ? `${displayedFundamentals.dividendYield.toFixed(2)}%` : 'N/A'}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Revenue</div>
                  <div className="text-lg font-semibold">{formatNumber(displayedFundamentals.revenue, 'NPR ')}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Profit</div>
                  <div className="text-lg font-semibold">{formatNumber(displayedFundamentals.profit, 'NPR ')}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">ROE</div>
                  <div className="text-lg font-semibold">{displayedFundamentals.roe !== undefined ? `${displayedFundamentals.roe.toFixed(2)}%` : 'N/A'}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Debt/Equity</div>
                  <div className="text-lg font-semibold">{displayedFundamentals.debtToEquity !== undefined ? displayedFundamentals.debtToEquity.toFixed(2) : 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Award size={16} />
              Performance
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">1 Week</div>
                <div className="text-sm font-semibold text-green-500">+2.5%</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">1 Month</div>
                <div className="text-sm font-semibold text-green-500">+5.8%</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg text-center">
                <div className="text-xs text-gray-500 mb-1">3 Months</div>
                <div className="text-sm font-semibold text-red-500">-1.2%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}