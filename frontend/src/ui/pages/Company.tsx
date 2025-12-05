import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Scatter } from 'recharts'
import { ArrowLeft } from 'lucide-react'
import ChartTypeSelector, { type ChartType } from '../../components/charts/ChartTypeSelector'
import TimeRangeSelector, { type TimeRange } from '../../components/charts/TimeRangeSelector'
import IndicatorPanel, { type Indicator } from '../../components/charts/IndicatorPanel'
import CompanyDetails from '../../components/company/CompanyDetails'
import CompanyHealthRadar from '../../components/company/CompanyHealthRadar'
import AIPredictionPanel from '../../components/analysis/AIPredictionPanel'
import CompanyAIAgent from '../../components/analysis/CompanyAIAgent'
import PerformanceTable from '../../components/performance/PerformanceTable'
import TechnicalPatterns from '../../components/analysis/TechnicalPatterns'
import { apiFetch, API_BASE_URL } from '../../lib/apiClient'

type Point = { date: string; open: number; high: number; low: number; close: number; volume: number }
type PredPoint = { date: string; close: number }

export default function Company() {
  const { symbol = '' } = useParams()
  const [series, setSeries] = useState<Point[]>([])
  const [preds, setPreds] = useState<PredPoint[]>([])
  const [explanation, setExplanation] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [fundamentals, setFundamentals] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [performance, setPerformance] = useState<any[]>([])
  const [patterns, setPatterns] = useState<any[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Chart controls
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [timeRange, setTimeRange] = useState<TimeRange>('3M')
  const [indicators, setIndicators] = useState<Indicator[]>([
    { id: 'sma20', name: 'SMA (20)', enabled: false, color: '#f59e0b', params: { period: 20 } },
    { id: 'sma50', name: 'SMA (50)', enabled: false, color: '#8b5cf6', params: { period: 50 } },
    { id: 'ema20', name: 'EMA (20)', enabled: false, color: '#06b6d4', params: { period: 20 } },
    { id: 'volume', name: 'Volume', enabled: true, color: '#6366f1' },
  ])
   
  // Calculate current price and price change from series data

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setError('')

    // Function to fetch initial data
    const fetchData = async () => {
      try {
        const [ohlcResponse, insightsResponse, fundamentalsResponse, statsResponse, performanceResponse, patternsResponse] = await Promise.all([
          apiFetch(`/companies/${symbol}/ohlc`),
          apiFetch(`/companies/${symbol}/insights`),
          apiFetch(`/companies/${symbol}/fundamentals`),
          apiFetch(`/companies/${symbol}/stats`),
          apiFetch(`/companies/${symbol}/performance`),
          apiFetch(`/companies/${symbol}/patterns`)
        ])

        // Handle OHLC response
        if (!ohlcResponse.ok) {
          let errorMessage = `HTTP ${ohlcResponse.status}: ${ohlcResponse.statusText}`
          try {
            const errorData = await ohlcResponse.json()
            errorMessage = errorData?.error || errorMessage
          } catch {
            // JSON parse failed, use status text
          }
          throw new Error(`Failed to fetch chart data: ${errorMessage}`)
        }

        // Handle insights response
        if (!insightsResponse.ok) {
          let errorMessage = `HTTP ${insightsResponse.status}: ${insightsResponse.statusText}`
          try {
            const errorData = await insightsResponse.json()
            errorMessage = errorData?.error || errorMessage
          } catch {
            // JSON parse failed, use status text
          }
          throw new Error(`Failed to fetch insights: ${errorMessage}`)
        }

        const [ohlc, insights, fundamentalsData, statsData, performanceData, patternsData] = await Promise.all([
          ohlcResponse.json(),
          insightsResponse.json(),
          fundamentalsResponse.json(),
          statsResponse.json(),
          performanceResponse.json(),
          patternsResponse.json()
        ])

        setSeries(ohlc?.ohlc || [])
        setPreds(insights?.predictions || [])
        setExplanation(insights?.explanation || '')
        setAiAnalysis(insights?.ai_analysis || null)
        setFundamentals(fundamentalsData?.fundamentals || null)
        setStats(statsData?.stats || null)
        setPerformance(performanceData?.performance || [])
        setPatterns(patternsData?.patterns || [])
        setLoading(false)
      } catch (e: any) {
        console.error('Error loading data:', e)
        let errorMsg = 'Failed to fetch data'
        
        // Handle different types of errors
        if (e instanceof TypeError && e.message.includes('fetch')) {
          // Network error - likely server not running or CORS issue
          errorMsg = `Unable to connect to the API server. Please ensure the API server is reachable at ${API_BASE_URL}`
        } else if (e?.message) {
          errorMsg = e.message
        }
        
        setError(errorMsg)
        setLoading(false)
      }
    }

    // Initial data fetch
    fetchData()

    // Set up live data polling
    const liveDataInterval = setInterval(() => {
      if (!loading) {
        // Fetch latest price point only
        apiFetch(`/companies/${symbol}/ohlc/latest`)
          .then(res => res.json())
          .then(data => {
            if (data && data.latest) {
              // Add new data point to series
              setSeries(prevSeries => {
                // Only add if it's newer than our last point
                const lastPoint = prevSeries[prevSeries.length - 1];
                if (lastPoint && data.latest.date > lastPoint.date) {
                  return [...prevSeries, data.latest];
                }
                return prevSeries;
              });
            }
          })
          .catch(err => console.warn('Failed to fetch live data:', err));
      }
    }, 10000); // Poll every 10 seconds

    // Clean up interval on unmount
    return () => clearInterval(liveDataInterval);
  }, [symbol])

  // Calculate moving averages
  const calculateSMA = (data: Point[], period: number) => {
    return data.map((point, idx) => {
      if (idx < period - 1) return { ...point, sma: null }
      const sum = data.slice(idx - period + 1, idx + 1).reduce((acc, p) => acc + p.close, 0)
      return { ...point, sma: sum / period }
    })
  }

  const calculateEMA = (data: Point[], period: number) => {
    const k = 2 / (period + 1)
    let ema = data[0]?.close || 0
    return data.map((point, idx) => {
      if (idx === 0) return { ...point, ema }
      ema = point.close * k + ema * (1 - k)
      return { ...point, ema }
    })
  }

  // Remove duplicate declarations of currentPrice, previousPrice, etc.
  // These are already declared earlier in the component

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (!series.length) return []
    const ranges: Record<TimeRange, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'ALL': series.length,
    }
    const days = ranges[timeRange]
    return series.slice(-days)
  }, [series, timeRange])

  // Add indicators to data
  const dataWithIndicators = useMemo(() => {
    let result = [...filteredData]
    
    const sma20Enabled = indicators.find(i => i.id === 'sma20')?.enabled
    const sma50Enabled = indicators.find(i => i.id === 'sma50')?.enabled
    const ema20Enabled = indicators.find(i => i.id === 'ema20')?.enabled

    if (sma20Enabled) {
      const sma20Data = calculateSMA(result, 20)
      result = result.map((point, idx) => ({ ...point, sma20: sma20Data[idx].sma }))
    }
    if (sma50Enabled) {
      const sma50Data = calculateSMA(result, 50)
      result = result.map((point, idx) => ({ ...point, sma50: sma50Data[idx].sma }))
    }
    if (ema20Enabled) {
      const ema20Data = calculateEMA(result, 20)
      result = result.map((point, idx) => ({ ...point, ema20: ema20Data[idx].ema }))
    }

    return result
  }, [filteredData, indicators])

  const toggleIndicator = (id: string) => {
    setIndicators(prev => prev.map(ind => 
      ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
    ))
  }

  // Calculate price metrics from stats or series data
  const currentPrice = stats?.currentPrice || (series.length > 0 ? series[series.length - 1].close : 0)
  const priceChange = stats?.change || 0
  const priceChangePercent = stats?.changePercent || 0

  const aiData = {
    predictions: preds,
    explanation,
    sentiment: priceChange >= 0 ? 'bullish' as const : 'bearish' as const,
    confidence: 0.78,
    priceTargets: currentPrice ? {
      bull: currentPrice * 1.15,
      base: currentPrice * 1.05,
      bear: currentPrice * 0.95,
    } : undefined,
    riskScore: 5.2,
    patterns: ['Ascending Triangle', 'Higher Lows'],
  }

  const renderChart = () => {
    const commonProps = {
      data: dataWithIndicators,
      margin: { left: 8, right: 8, top: 8, bottom: 8 },
    }

    const enabledIndicators = indicators.filter(i => i.enabled && i.id !== 'volume')

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="close" stroke="#00F5FF" strokeWidth={2} dot={false} />
            {enabledIndicators.map(ind => (
              <Line key={ind.id} type="monotone" dataKey={ind.id} stroke={ind.color} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            ))}
          </LineChart>
        )
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="close" stroke="#00F5FF" strokeWidth={2} fill="url(#colorClose)" />
            {enabledIndicators.map(ind => (
              <Line key={ind.id} type="monotone" dataKey={ind.id} stroke={ind.color} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            ))}
          </AreaChart>
        )
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
            <Bar dataKey="close" fill="#00F5FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
      
      case 'candlestick':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
            <Bar dataKey="high" fill="transparent" />
            <Bar dataKey="low" fill="transparent" />
            <Scatter dataKey="open" fill="#10b981" />
            <Scatter dataKey="close" fill="#ef4444" />
            <Line type="monotone" dataKey="close" stroke="#00F5FF" strokeWidth={2} dot={false} />
            {enabledIndicators.map(ind => (
              <Line key={ind.id} type="monotone" dataKey={ind.id} stroke={ind.color} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            ))}
          </ComposedChart>
        )
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/companies" className="p-2 glass rounded-lg hover:glass-strong transition-all duration-200">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-heading-1">{symbol}</h1>
              {currentPrice && (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold">NPR {currentPrice.toFixed(2)}</span>
                  <span className={`text-lg ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && <div className="glass p-12 rounded-xl text-center">Loading data...</div>}
        {error && <div className="glass p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500">{error}</div>}

        {!loading && !error && (
          <>
            {/* Chart Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <ChartTypeSelector selected={chartType} onChange={setChartType} />
              <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
            </div>

            {/* Main Chart */}
            {dataWithIndicators.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <h3 className="text-heading-3 mb-4">Price Chart</h3>
                <div className="w-full chart-height-main">
                  <ResponsiveContainer>
                    {renderChart()}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Volume Chart */}
            {indicators.find(i => i.id === 'volume')?.enabled && dataWithIndicators.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <h3 className="text-heading-3 mb-4">Volume</h3>
                <div className="w-full chart-height-volume">
                  <ResponsiveContainer>
                    <BarChart data={dataWithIndicators} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
                      <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Indicators Panel */}
            <IndicatorPanel indicators={indicators} onToggle={toggleIndicator} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                <CompanyDetails symbol={symbol} fundamentals={fundamentals} stats={stats} />
                
                {/* Future Predictions Chart */}
                {preds.length > 0 && (
                  <div className="glass p-6 rounded-xl">
                    <h3 className="text-heading-3 mb-4">AI Prediction (Next 14 Days)</h3>
                    <div className="w-full chart-height-prediction">
                      <ResponsiveContainer>
                        <LineChart data={preds} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 5', 'dataMax + 5']} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(11, 17, 32, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Performance Table */}
                <PerformanceTable data={performance} />

                {/* Technical Patterns */}
                <TechnicalPatterns patterns={patterns} />
              </div>

              {/* Right Column - AI Analysis */}
              <div className="lg:col-span-1 space-y-6">
                {/* Company Health Radar */}
                <CompanyHealthRadar 
                  symbol={symbol} 
                  stats={stats}
                  fundamentals={fundamentals}
                  performance={performance}
                  series={series}
                />
                
                {/* Company-Specific AI Agent */}
                {aiAnalysis ? (
                  <CompanyAIAgent symbol={symbol} analysis={aiAnalysis} currentPrice={currentPrice} />
                ) : (
                  <AIPredictionPanel data={aiData} currentPrice={currentPrice} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
