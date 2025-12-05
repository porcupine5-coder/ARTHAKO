import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { Shield, TrendingUp, DollarSign, Percent, AlertTriangle, Zap } from 'lucide-react'
import { apiFetch } from '../../lib/apiClient'

interface HealthMetrics {
  valuation: number
  growth: number
  profitability: number
  dividend: number
  risk: number
  momentum: number
}

interface Props {
  symbol: string
  metrics?: HealthMetrics
  stats?: any
  fundamentals?: any
  performance?: any[]
  series?: any[]
}

export default function CompanyHealthRadar({ symbol, metrics, stats, fundamentals, performance, series }: Props) {
  const [healthData, setHealthData] = useState<HealthMetrics | null>(metrics || null)
  const [loading, setLoading] = useState(!metrics)
  const [overallScore, setOverallScore] = useState(0)

  // Calculate health metrics from actual company data
  const calculateHealthMetrics = (): HealthMetrics => {
    // Valuation Score (based on P/E ratio and market cap trends)
    const peRatio = fundamentals?.peRatio || 20
    const idealPE = 15 // Ideal P/E ratio
    let valuationScore = 100 - Math.min(Math.abs(peRatio - idealPE) * 3, 60)
    if (peRatio > 0 && peRatio < 10) valuationScore = Math.max(valuationScore, 50)
    valuationScore = Math.max(20, Math.min(95, valuationScore))

    // Growth Score (based on price trends and volume)
    let growthScore = 50
    if (series && series.length > 20) {
      const recentPrices = series.slice(-30)
      const oldPrice = recentPrices[0]?.close || 1
      const newPrice = recentPrices[recentPrices.length - 1]?.close || 1
      const growth = ((newPrice - oldPrice) / oldPrice) * 100
      
      if (growth > 0) {
        growthScore = 50 + Math.min(growth * 2, 45)
      } else {
        growthScore = 50 + Math.max(growth * 2, -30)
      }
    }
    growthScore = Math.max(15, Math.min(98, growthScore))

    // Profitability Score (based on earnings and margins)
    const eps = fundamentals?.eps || 0
    const roe = fundamentals?.roe || 0
    let profitabilityScore = 40
    
    if (eps > 0) {
      profitabilityScore += Math.min(eps * 2, 30)
    }
    if (roe > 0) {
      profitabilityScore += Math.min(roe, 25)
    }
    profitabilityScore = Math.max(20, Math.min(95, profitabilityScore))

    // Dividend Score (based on dividend yield)
    const dividendYield = fundamentals?.dividendYield || 0
    let dividendScore = 30 + (dividendYield * 10)
    dividendScore = Math.max(15, Math.min(90, dividendScore))

    // Risk Score (based on volatility and debt ratio)
    let riskScore = 50
    if (series && series.length > 10) {
      const prices = series.slice(-30).map((p: any) => p.close)
      const mean = prices.reduce((a: number, b: number) => a + b, 0) / prices.length
      const variance = prices.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / prices.length
      const volatility = Math.sqrt(variance) / mean * 100
      
      riskScore = 50 + Math.min(volatility * 2, 40) // Higher volatility = higher risk
    }
    
    const debtToEquity = fundamentals?.debtToEquity || 0.5
    if (debtToEquity > 1) {
      riskScore += Math.min((debtToEquity - 1) * 15, 25)
    }
    riskScore = Math.max(15, Math.min(85, riskScore))

    // Momentum Score (based on recent price action and volume trends)
    let momentumScore = 50
    if (stats) {
      const changePercent = stats.changePercent || 0
      const change30d = stats.change30d || 0
      
      momentumScore = 50 + (changePercent * 5) + (change30d * 2)
    }
    
    if (series && series.length > 5) {
      const recentVolumes = series.slice(-10).map((p: any) => p.volume)
      const avgRecentVolume = recentVolumes.reduce((a: number, b: number) => a + b, 0) / recentVolumes.length
      const latestVolume = recentVolumes[recentVolumes.length - 1] || 0
      
      if (latestVolume > avgRecentVolume * 1.5) {
        momentumScore += 10 // Strong buying interest
      }
    }
    momentumScore = Math.max(10, Math.min(95, momentumScore))

    return {
      valuation: Math.round(valuationScore),
      growth: Math.round(growthScore),
      profitability: Math.round(profitabilityScore),
      dividend: Math.round(dividendScore),
      risk: Math.round(riskScore),
      momentum: Math.round(momentumScore)
    }
  }

  useEffect(() => {
    if (metrics) {
      setHealthData(metrics)
      setLoading(false)
      return
    }

    const fetchHealth = async () => {
      try {
        const response = await apiFetch(`/companies/${symbol}/health`)
        if (response.ok) {
          const data = await response.json()
          setHealthData(data.metrics)
        } else {
          // Calculate from available data
          const calculatedMetrics = calculateHealthMetrics()
          setHealthData(calculatedMetrics)
        }
      } catch (error) {
        console.error('Failed to fetch health metrics:', error)
        // Calculate from available data
        const calculatedMetrics = calculateHealthMetrics()
        setHealthData(calculatedMetrics)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
  }, [symbol, metrics, stats, fundamentals, series])

  useEffect(() => {
    if (healthData) {
      // Calculate overall score (risk is inverted)
      const score = (
        healthData.valuation +
        healthData.growth +
        healthData.profitability +
        healthData.dividend +
        (100 - healthData.risk) +
        healthData.momentum
      ) / 6
      setOverallScore(Math.round(score))
    }
  }, [healthData])

  if (loading || !healthData) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded mb-4 w-2/3"></div>
        <div className="h-64 bg-white/5 rounded"></div>
      </div>
    )
  }

  const radarData = [
    { category: 'Valuation', value: healthData.valuation, fullMark: 100 },
    { category: 'Growth', value: healthData.growth, fullMark: 100 },
    { category: 'Profitability', value: healthData.profitability, fullMark: 100 },
    { category: 'Dividend', value: healthData.dividend, fullMark: 100 },
    { category: 'Risk', value: 100 - healthData.risk, fullMark: 100 }, // Inverted
    { category: 'Momentum', value: healthData.momentum, fullMark: 100 }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-lime-400'
    if (score >= 40) return 'text-yellow-400'
    if (score >= 20) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-lime-500 to-green-600'
    if (score >= 40) return 'from-yellow-500 to-orange-500'
    if (score >= 20) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-red-700'
    }
  
    const healthMetrics = [
    { label: 'Valuation', value: healthData.valuation, icon: DollarSign, description: 'Price relative to intrinsic value' },
    { label: 'Growth', value: healthData.growth, icon: TrendingUp, description: 'Revenue and EPS growth trajectory' },
    { label: 'Profitability', value: healthData.profitability, icon: Percent, description: 'Margins and ROE performance' },
    { label: 'Dividend', value: healthData.dividend, icon: Shield, description: 'Dividend yield and consistency' },
    { label: 'Risk', value: 100 - healthData.risk, icon: AlertTriangle, description: 'Financial stability and volatility' },
    { label: 'Momentum', value: healthData.momentum, icon: Zap, description: 'Technical strength and trend' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-xl space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-heading-2 mb-1">Company Health Score</h3>
        <p className="text-sm text-gray-500">Multi-dimensional analysis of {symbol}</p>
      </div>

      {/* Overall Score */}
      <div className={`bg-gradient-to-br ${getScoreGradient(overallScore)} p-6 rounded-xl text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90 mb-1">Overall Health Score</div>
            <div className="text-5xl font-bold">{overallScore}<span className="text-2xl">/100</span></div>
            <div className="text-sm opacity-75 mt-2">
              {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Fair' : 'Poor'} investment quality
            </div>
          </div>
          <Shield size={64} className="opacity-50" />
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-black/20 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <Radar 
              name={symbol} 
              dataKey="value" 
              stroke="#00F5FF" 
              fill="#00F5FF" 
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(11, 17, 32, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {healthMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-2">
              <metric.icon size={16} className={getScoreColor(metric.value)} />
              <span className="text-sm font-medium">{metric.label}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getScoreGradient(metric.value)} rounded-full transition-all duration-500`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${getScoreColor(metric.value)}`}>
                {metric.value}
              </span>
            </div>
            <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {metric.description}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-white/10">
        Based on fundamental analysis, technical indicators, and AI assessment
      </div>
    </motion.div>
  )
}
