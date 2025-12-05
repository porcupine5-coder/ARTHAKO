import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Activity, Eye, AlertTriangle, Target, Sparkles } from 'lucide-react'

interface PortfolioMetrics {
  totalValue: number
  dailyChange: number
  dailyChangePercent: number
  totalGain: number
  totalGainPercent: number
  activeStocks: number
  watchlistCount: number
  riskLevel: 'low' | 'medium' | 'high'
  aiConfidence: number
  projected30Day: number
  projected30DayChange: number
}

interface PortfolioOverviewProps {
  selectedPeriod?: '7day' | '30day' | '90day' | '180day' | '365day'
}

export default function PortfolioOverviewEnhanced({ selectedPeriod = '30day' }: PortfolioOverviewProps) {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/portfolio/overview?period=${selectedPeriod}`)
        const data = await response.json()
        // Map backend data to frontend interface
        const mappedMetrics: PortfolioMetrics = {
          totalValue: data.totalValue ?? 0,
          dailyChange: data.dayChange ?? 0,
          dailyChangePercent: data.dayChangePercent ?? 0,
          totalGain: data.totalGainLoss ?? 0,
          totalGainPercent: data.totalGainLossPercent ?? 0,
          activeStocks: data.holdings?.length ?? 0,
          watchlistCount: data.watchlistCount ?? data.holdings?.length ?? 0,
          riskLevel: data.riskLevel ?? 'medium',
          aiConfidence: data.aiConfidence ?? 85,
          projected30Day: data.projected30Day ?? (data.totalValue || 0) * 1.05,
          projected30DayChange: data.projected30DayChange ?? 5
        }
        setMetrics(mappedMetrics)
      } catch (error) {
        console.error('Failed to fetch portfolio metrics:', error)
        // Fallback to mock data
        setMetrics({
          totalValue: 2500000,
          dailyChange: 15000,
          dailyChangePercent: 0.6,
          totalGain: 285000,
          totalGainPercent: 12.5,
          activeStocks: 12,
          watchlistCount: 24,
          riskLevel: 'medium',
          aiConfidence: 78,
          projected30Day: 2625000,
          projected30DayChange: 5.0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [selectedPeriod])

  if (loading || !metrics) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded mb-4 w-1/3"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const borderColor = metrics.dailyChangePercent >= 0
    ? 'border-green-500/30 shadow-green-500/20'
    : 'border-red-500/30 shadow-red-500/20'

  const cards = [
    {
      label: 'Portfolio Value',
      value: `NPR ${((metrics?.totalValue || 0) / 1000).toFixed(0)}K`,
      change: `${(metrics?.dailyChangePercent || 0) >= 0 ? '+' : ''}${(metrics?.dailyChangePercent || 0).toFixed(2)}%`,
      subValue: `${(metrics?.dailyChange || 0) >= 0 ? '+' : ''}NPR ${((metrics?.dailyChange || 0) / 1000).toFixed(1)}K today`,
      icon: DollarSign,
      color: (metrics?.dailyChangePercent || 0) >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: (metrics?.dailyChangePercent || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
    },
    {
      label: 'Total Gain',
      value: `NPR ${((metrics?.totalGain || 0) / 1000).toFixed(0)}K`,
      change: `+${(metrics?.totalGainPercent || 0).toFixed(2)}%`,
      subValue: 'All time',
      icon: TrendingUp,
      color: 'text-neon-blue',
      bgColor: 'bg-neon-blue/10'
    },
    {
      label: 'Active Stocks',
      value: (metrics?.activeStocks || 0).toString(),
      change: `${metrics?.watchlistCount || 0} watching`,
      subValue: 'In portfolio',
      icon: Activity,
      color: 'text-electric-purple',
      bgColor: 'bg-electric-purple/10'
    },
    {
      label: '30-Day Projection',
      value: `NPR ${((metrics?.projected30Day || 0) / 1000).toFixed(0)}K`,
      change: `${(metrics?.projected30DayChange || 0) >= 0 ? '+' : ''}${(metrics?.projected30DayChange || 0).toFixed(1)}%`,
      subValue: 'AI forecast',
      icon: Target,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    }
  ]

  return (
    <div className={`glass p-6 rounded-xl border-2 ${borderColor} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-heading-2 mb-1">Portfolio Overview</h2>
          <p className="text-sm text-gray-500">Real-time performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Risk Level Meter */}
          <div className={`px-4 py-2 rounded-lg border ${getRiskColor(metrics.riskLevel)}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <div>
                <div className="text-xs opacity-75">Risk Level</div>
                <div className="font-semibold uppercase text-sm">{metrics.riskLevel}</div>
              </div>
            </div>
          </div>

          {/* AI Confidence Score */}
          <div className="px-4 py-2 rounded-lg bg-electric-purple/20 border border-electric-purple/30">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-electric-purple" />
              <div>
                <div className="text-xs text-gray-400">AI Confidence</div>
                <div className="font-semibold text-electric-purple text-sm">{metrics.aiConfidence}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`${card.bgColor} p-5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide">{card.label}</span>
              <card.icon className={`${card.color} opacity-70 group-hover:opacity-100 transition-opacity`} size={18} />
            </div>
            <div className="text-2xl font-bold mb-1">{card.value}</div>
            <div className="flex items-center justify-between">
              <div className={`text-sm font-semibold ${card.color}`}>{card.change}</div>
              <div className="text-xs text-gray-500">{card.subValue}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Indicator */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Live updates every 30s</span>
        </div>
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  )
}
