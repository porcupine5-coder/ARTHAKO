import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, BarChart3, Users, Globe } from 'lucide-react'

interface MacroData {
  nepseIndex: {
    value: number
    change: number
    changePercent: number
    trend: 'up' | 'down' | 'neutral'
  }
  volume: {
    total: number
    change: number
    changePercent: number
  }
  marketBreadth: {
    advances: number
    declines: number
    unchanged: number
    ratio: number
  }
  turnover: number
  transactions: number
  marketCap: number
}

interface MacroIndicatorsProps {
  selectedPeriod?: '7day' | '30day' | '90day' | '180day' | '365day'
}

export default function MacroIndicators({ selectedPeriod = '30day' }: MacroIndicatorsProps) {
  const [data, setData] = useState<MacroData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMacro = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/market/macro?period=${selectedPeriod}`)
        const result = await response.json()
        // Map backend data to frontend interface
        const mappedData: MacroData = {
          nepseIndex: {
            value: result.nepseIndex || 0,
            change: result.nepseChange || 0,
            changePercent: result.nepseChangePercent || 0,
            trend: (result.nepseChange || 0) >= 0 ? 'up' : 'down'
          },
          volume: {
            total: result.volume || 0,
            change: 0, // Missing in API
            changePercent: 0 // Missing in API
          },
          marketBreadth: {
            advances: result.marketBreadth?.advances || 0,
            declines: result.marketBreadth?.declines || 0,
            unchanged: result.marketBreadth?.unchanged || 0,
            ratio: result.marketBreadth?.ratio || 1
          },
          turnover: result.turnover || (result.volume * 100) || 0, // Estimate if missing
          transactions: result.trades || 0,
          marketCap: result.marketCap || 0
        }
        setData(mappedData)
      } catch (error) {
        console.error('Failed to fetch macro indicators:', error)
        // Mock data
        setData({
          nepseIndex: {
            value: 2118.45,
            change: 15.32,
            changePercent: 0.73,
            trend: 'up'
          },
          volume: {
            total: 45382000,
            change: 5234000,
            changePercent: 13.05
          },
          marketBreadth: {
            advances: 124,
            declines: 58,
            unchanged: 12,
            ratio: 2.14
          },
          turnover: 3250000000,
          transactions: 18500,
          marketCap: 4250000000000
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMacro()
    const interval = setInterval(fetchMacro, 15000) // Update every 15s
    return () => clearInterval(interval)
  }, [selectedPeriod])

  if (loading || !data) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded mb-4 w-1/3"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const indicators = [
    {
      label: 'NEPSE Index',
      value: (data?.nepseIndex?.value || 0).toFixed(2),
      change: `${(data?.nepseIndex?.change || 0) >= 0 ? '+' : ''}${(data?.nepseIndex?.change || 0).toFixed(2)}`,
      changePercent: `${(data?.nepseIndex?.changePercent || 0) >= 0 ? '+' : ''}${(data?.nepseIndex?.changePercent || 0).toFixed(2)}%`,
      icon: data?.nepseIndex?.trend === 'up' ? TrendingUp : TrendingDown,
      color: (data?.nepseIndex?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: (data?.nepseIndex?.change || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: (data?.nepseIndex?.change || 0) >= 0 ? 'border-green-500/30' : 'border-red-500/30'
    },
    {
      label: 'Trading Volume',
      value: `${((data?.volume?.total || 0) / 1000000).toFixed(2)}M`,
      change: `${(data?.volume?.change || 0) >= 0 ? '+' : ''}${((data?.volume?.change || 0) / 1000000).toFixed(2)}M`,
      changePercent: `${(data?.volume?.changePercent || 0) >= 0 ? '+' : ''}${(data?.volume?.changePercent || 0).toFixed(2)}%`,
      icon: Activity,
      color: 'text-neon-blue',
      bgColor: 'bg-neon-blue/10',
      borderColor: 'border-neon-blue/30'
    },
    {
      label: 'Market Breadth',
      value: (data?.marketBreadth?.ratio || 0).toFixed(2),
      change: `${data?.marketBreadth?.advances || 0}↑ ${data?.marketBreadth?.declines || 0}↓`,
      changePercent: `${data?.marketBreadth?.unchanged || 0} unchanged`,
      icon: BarChart3,
      color: (data?.marketBreadth?.ratio || 0) > 1.5 ? 'text-green-400' : (data?.marketBreadth?.ratio || 0) < 0.8 ? 'text-red-400' : 'text-yellow-400',
      bgColor: (data?.marketBreadth?.ratio || 0) > 1.5 ? 'bg-green-500/10' : (data?.marketBreadth?.ratio || 0) < 0.8 ? 'bg-red-500/10' : 'bg-yellow-500/10',
      borderColor: (data?.marketBreadth?.ratio || 0) > 1.5 ? 'border-green-500/30' : (data?.marketBreadth?.ratio || 0) < 0.8 ? 'border-red-500/30' : 'border-yellow-500/30'
    },
    {
      label: 'Turnover',
      value: `NPR ${((data?.turnover || 0) / 1000000000).toFixed(2)}B`,
      change: 'Daily volume',
      changePercent: `${(data?.transactions || 0).toLocaleString()} trades`,
      icon: Globe,
      color: 'text-electric-purple',
      bgColor: 'bg-electric-purple/10',
      borderColor: 'border-electric-purple/30'
    },
    {
      label: 'Market Cap',
      value: `NPR ${((data?.marketCap || 0) / 1000000000000).toFixed(2)}T`,
      change: 'Total capitalization',
      changePercent: '194 listed companies',
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-xl"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-heading-2 mb-1">Macro Market Indicators</h3>
        <p className="text-sm text-gray-500">Real-time market statistics and health metrics</p>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {indicators.map((indicator, index) => (
          <motion.div
            key={indicator.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`${indicator.bgColor} ${indicator.borderColor} border rounded-lg p-4 hover:scale-105 transition-all duration-300 cursor-pointer group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                {indicator.label}
              </span>
              <indicator.icon className={`${indicator.color} opacity-70 group-hover:opacity-100 transition-opacity`} size={18} />
            </div>

            <div className="mb-2">
              <div className="text-2xl font-bold">{indicator.value}</div>
            </div>

            <div className="space-y-0.5">
              <div className={`text-sm font-semibold ${indicator.color}`}>
                {indicator.change}
              </div>
              <div className="text-xs text-gray-500">
                {indicator.changePercent}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Market Status */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${data.nepseIndex.change >= 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-gray-400">
              Market is {data.nepseIndex.change >= 0 ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>
          <div className="text-gray-500 text-xs">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
