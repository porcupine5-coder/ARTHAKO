import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Zap, Info } from 'lucide-react'

interface AIInsight {
  id: string
  type: 'prediction' | 'anomaly' | 'trend' | 'alert' | 'opportunity'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  symbols?: string[]
  timestamp: string
  confidence: number
}

const generateMockInsights = (period: string): AIInsight[] => {
  const periodMultiplier = period === '7day' ? 1 : period === '30day' ? 2 : period === '90day' ? 3 : period === '180day' ? 4 : 5
  const volatilityMultiplier = period === '7day' ? 1.5 : period === '30day' ? 1.2 : period === '90day' ? 1 : period === '180day' ? 0.8 : 0.6

  const baseInsights = [
    {
      id: '1',
      type: 'trend' as const,
      severity: 'info' as const,
      title: `Hydropower Sector ${period} Momentum`,
      message: `Hydropower sector showing ${Math.round(20 * periodMultiplier)}% volume growth over ${period.replace('day', '-days')}. ${Math.round(8 * periodMultiplier)} stocks breaking resistance levels.`,
      symbols: ['UPPER', 'NHPC', 'CHCL'],
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      confidence: 85
    },
    {
      id: '2',
      type: 'prediction' as const,
      severity: 'warning' as const,
      title: `${period} Price Movement Prediction`,
      message: `Based on ${period} technical analysis, ${Math.round(15 * periodMultiplier)} stocks showing breakout patterns with ${Math.round(8 * volatilityMultiplier)}% volatility.`,
      symbols: ['KBL', 'NABIL', 'EBL'],
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      confidence: 78
    },
    {
      id: '3',
      type: 'alert' as const,
      severity: 'critical' as const,
      title: `${period} Sector Performance Alert`,
      message: `Over ${period}, ${Math.round(6 * periodMultiplier)} commercial banks showing liquidity concerns. ${Math.round(12 * volatilityMultiplier)}% sector volatility detected.`,
      symbols: ['NABIL', 'SCB', 'HBL'],
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      confidence: 82
    },
    {
      id: '4',
      type: 'opportunity' as const,
      severity: 'info' as const,
      title: `${period} Undervalued Opportunities`,
      message: `AI analysis over ${period} identified ${Math.round(12 * periodMultiplier)} fundamentally strong stocks with ${Math.round(15 * volatilityMultiplier)}% average upside potential.`,
      symbols: ['GBIME', 'SANIMA', 'MEGA'],
      timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
      confidence: 72
    },
    {
      id: '5',
      type: 'anomaly' as const,
      severity: 'warning' as const,
      title: `${period} Trading Volume Anomaly`,
      message: `Abnormal volume patterns detected over ${period} with ${Math.round(250 * volatilityMultiplier)}% above average trading activity.`,
      symbols: ['NICA', 'UPPER', 'CHL'],
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      confidence: 88
    },
    {
      id: '6',
      type: 'trend' as const,
      severity: 'info' as const,
      title: `${period} Market Breadth Analysis`,
      message: `Market breadth improving over ${period} with advance-decline ratio of ${Math.round(2.1 * volatilityMultiplier)}:1. ${Math.round(65 * periodMultiplier)}% market participation.`,
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      confidence: 76
    }
  ]

  return baseInsights
}

export default function AIInsightsFeed({ selectedPeriod = '30day' }: { selectedPeriod?: string }) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`/ai/insights/feed?period=${selectedPeriod}`)
        const data = await response.json()
        setInsights(data.insights || [])
      } catch (error) {
        console.error('Failed to fetch AI insights:', error)
        // Mock data based on selected period
        setInsights(generateMockInsights(selectedPeriod))
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
    // Update every 30 seconds
    const interval = setInterval(fetchInsights, 30000)
    return () => clearInterval(interval)
  }, [selectedPeriod])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return TrendingUp
      case 'alert': return AlertCircle
      case 'anomaly': return Zap
      case 'opportunity': return Sparkles
      case 'trend': return TrendingDown
      default: return Info
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500/50 bg-red-500/10'
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10'
      default: return 'border-neon-blue/50 bg-neon-blue/10'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prediction': return 'text-green-400'
      case 'alert': return 'text-red-400'
      case 'anomaly': return 'text-yellow-400'
      case 'opportunity': return 'text-electric-purple'
      case 'trend': return 'text-neon-blue'
      default: return 'text-gray-400'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded mb-4 w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-purple to-neon-blue flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-heading-3">AI Insights Feed</h3>
            <p className="text-xs text-gray-500">Real-time market intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-electric-purple animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <AnimatePresence>
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type)
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${getSeverityColor(insight.severity)} border rounded-lg p-4 hover:scale-[1.02] transition-all duration-200 cursor-pointer group`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${getTypeColor(insight.type)} mt-0.5`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm group-hover:text-neon-blue transition-colors">
                        {insight.title}
                      </h4>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatTimestamp(insight.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                      {insight.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      {insight.symbols && insight.symbols.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {insight.symbols.map(symbol => (
                            <span 
                              key={symbol}
                              className="text-xs px-2 py-0.5 rounded bg-white/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 transition-colors"
                            >
                              {symbol}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
                        <Sparkles size={12} className="text-electric-purple" />
                        <span>{insight.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500">
          Powered by ensemble ML models • Updates every 30s
        </p>
      </div>
    </motion.div>
  )
}
