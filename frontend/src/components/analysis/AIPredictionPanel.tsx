import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Activity } from 'lucide-react'

interface PredictionData {
  predictions?: Array<{ date: string; close: number }>
  explanation?: string
  ai_analysis?: {
    sentiment?: 'bullish' | 'bearish' | 'neutral'
    confidence?: number
    risk_score?: number
    patterns?: Array<{
      name: string
      strength: string
      direction: string
      description: string
    }>
    price_targets?: {
      short_term: number
      medium_term: number
      long_term: number
    }
    technical_indicators?: {
      rsi: number
      macd: {
        signal: string
        histogram: number
      }
      moving_averages: {
        sma_20: string
        sma_50: string
        sma_200: string
      }
    }
  }
  sentiment?: 'bullish' | 'bearish' | 'neutral'
  confidence?: number
  priceTargets?: {
    bull: number
    base: number
    bear: number
  }
  riskScore?: number
  patterns?: string[]
}

interface AIPredictionPanelProps {
  data: PredictionData
  currentPrice?: number
}

export default function AIPredictionPanel({ data, currentPrice }: AIPredictionPanelProps) {
  // Use company-specific AI analysis if available, otherwise fall back to legacy data
  const aiAnalysis = data.ai_analysis || {}
  
  const { explanation } = data
  const sentiment = aiAnalysis.sentiment || data.sentiment
  const confidence = aiAnalysis.confidence ? aiAnalysis.confidence / 100 : data.confidence
  const riskScore = aiAnalysis.risk_score || data.riskScore
  
  // Use new price targets if available
  const priceTargets = data.priceTargets || (aiAnalysis.price_targets ? {
    bull: aiAnalysis.price_targets.long_term,
    base: aiAnalysis.price_targets.medium_term,
    bear: aiAnalysis.price_targets.short_term
  } : undefined)
  
  // Use new patterns if available
  const patterns = aiAnalysis.patterns 
    ? aiAnalysis.patterns.map(p => `${p.direction} ${p.name} (${p.strength})`) 
    : data.patterns

  const getSentimentColor = (sent?: string) => {
    switch (sent) {
      case 'bullish':
        return 'text-green-500'
      case 'bearish':
        return 'text-red-500'
      default:
        return 'text-yellow-500'
    }
  }

  const getSentimentIcon = (sent?: string) => {
    switch (sent) {
      case 'bullish':
        return TrendingUp
      case 'bearish':
        return TrendingDown
      default:
        return Activity
    }
  }

  const SentimentIcon = getSentimentIcon(sentiment)

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <Brain className="text-electric-purple" size={28} />
        <div>
          <h3 className="text-lg font-semibold">AI Analysis</h3>
          <p className="text-sm text-gray-500">Machine learning insights</p>
        </div>
      </div>

      {/* Sentiment & Confidence */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-500 mb-2">Market Sentiment</div>
          <div className={`flex items-center gap-2 ${getSentimentColor(sentiment)}`}>
            <SentimentIcon size={20} />
            <span className="text-lg font-semibold capitalize">{sentiment || 'Neutral'}</span>
          </div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-500 mb-2">Confidence Level</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-blue to-electric-purple rounded-full transition-all duration-500 progress-bar"
                style={{ '--progress-width': `${(confidence || 0) * 100}%` } as React.CSSProperties}
              />
            </div>
            <span className="text-lg font-semibold">{((confidence || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Price Targets */}
      {priceTargets && currentPrice && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-400">Price Targets</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-xs text-green-400 mb-1">Bull Case</div>
              <div className="text-lg font-bold text-green-500">NPR {priceTargets.bull.toFixed(2)}</div>
              <div className="text-xs text-green-400">
                +{(((priceTargets.bull - currentPrice) / currentPrice) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-xs text-blue-400 mb-1">Base Case</div>
              <div className="text-lg font-bold text-blue-500">NPR {priceTargets.base.toFixed(2)}</div>
              <div className="text-xs text-blue-400">
                {((priceTargets.base - currentPrice) / currentPrice * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-xs text-red-400 mb-1">Bear Case</div>
              <div className="text-lg font-bold text-red-500">NPR {priceTargets.bear.toFixed(2)}</div>
              <div className="text-xs text-red-400">
                {((priceTargets.bear - currentPrice) / currentPrice * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Score */}
      {riskScore !== undefined && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-400">Risk Assessment</h4>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Risk Score</span>
              <span className="text-sm font-semibold">{riskScore}/10</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 progress-bar ${
                  riskScore && riskScore > 7
                    ? 'bg-red-500'
                    : riskScore && riskScore > 4
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ '--progress-width': `${((riskScore || 5) / 10) * 100}%` } as React.CSSProperties}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-green-500">Low</span>
              <span className="text-xs text-yellow-500">Medium</span>
              <span className="text-xs text-red-500">High</span>
            </div>
          </div>
        </div>
      )}

      {/* Detected Patterns */}
      {patterns && patterns.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Detected Patterns</h4>
          <div className="flex flex-wrap gap-2">
            {patterns.map((pattern, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-electric-purple/20 text-electric-purple text-xs rounded-full border border-electric-purple/30"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Explanation */}
      {explanation && (
        <div className="p-4 bg-gradient-to-br from-neon-blue/10 to-electric-purple/10 border border-neon-blue/20 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 text-neon-blue">AI Insight</h4>
          <p className="text-sm text-gray-300 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  )
}