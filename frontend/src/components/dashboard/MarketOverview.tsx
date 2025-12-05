import { useEffect, useRef, useMemo } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
// import { gsap } from 'gsap'
// import { useRevealOnScroll } from '../../hooks/useScrollTrigger'

export default function MarketOverview() {
  // const sectionRef = useRevealOnScroll()
  const chartRef = useRef<HTMLDivElement>(null)

  const data = useMemo(
    () => [
      { date: '2025-01-01', close: 2100, volume: 45000000 },
      { date: '2025-01-02', close: 2104, volume: 52000000 },
      { date: '2025-01-03', close: 2102, volume: 48000000 },
      { date: '2025-01-04', close: 2108, volume: 55000000 },
      { date: '2025-01-05', close: 2111, volume: 58000000 },
      { date: '2025-01-06', close: 2109, volume: 51000000 },
      { date: '2025-01-07', close: 2115, volume: 62000000 },
    ],
    []
  )

  const marketStats = useMemo(() => {
    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    const change = latest.close - previous.close
    const changePercent = ((change / previous.close) * 100).toFixed(2)
    const isPositive = change >= 0

    return {
      current: latest.close,
      change,
      changePercent,
      isPositive,
      volume: latest.volume,
    }
  }, [data])

  // Remove the GSAP animation effect that was causing issues
  /*
  useEffect(() => {
    if (!chartRef.current) return

    const lines = chartRef.current.querySelectorAll('.recharts-line-curve')
    lines.forEach((line) => {
      const length = (line as SVGPathElement).getTotalLength()
      gsap.fromTo(
        line,
        {
          strokeDasharray: length,
          strokeDashoffset: length,
        },
        {
          strokeDashoffset: 0,
          duration: 2,
          ease: 'power2.out',
        }
      )
    })
  }, [])
  */

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-heading-1 mb-4">Market Overview</h2>
          <p className="text-body text-gray-600 dark:text-gray-400">
            Real-time insights powered by AI analysis
          </p>
        </div>

        {/* Market Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* NEPSE Index */}
          <div className="glass p-6 rounded-xl hover:glass-strong transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-body-sm text-gray-600 dark:text-gray-400">NEPSE Index</span>
              <Activity className="text-neon-blue" size={20} />
            </div>
            <div className="text-heading-2 mb-2">{marketStats.current.toFixed(2)}</div>
            <div className={`flex items-center gap-2 text-sm ${marketStats.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {marketStats.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{marketStats.isPositive ? '+' : ''}{marketStats.change.toFixed(2)} ({marketStats.changePercent}%)</span>
            </div>
          </div>

          {/* Volume */}
          <div className="glass p-6 rounded-xl hover:glass-strong transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-body-sm text-gray-600 dark:text-gray-400">Trading Volume</span>
              <Activity className="text-electric-purple" size={20} />
            </div>
            <div className="text-heading-2 mb-2">
              {(marketStats.volume / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              NPR {marketStats.volume.toLocaleString()}
            </div>
          </div>

          {/* AI Sentiment */}
          <div className="glass p-6 rounded-xl hover:glass-strong transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-body-sm text-gray-600 dark:text-gray-400">AI Sentiment</span>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="text-heading-2 mb-2 text-green-500">Bullish</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Confidence: 87%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef} className="glass p-6 rounded-xl">
          <h3 className="text-heading-3 mb-6">7-Day Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(11, 17, 32, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                }}
                labelStyle={{ color: '#E2E8F0' }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#00F5FF"
                strokeWidth={2}
                fill="url(#colorClose)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}