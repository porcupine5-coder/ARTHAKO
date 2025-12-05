import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Activity, History, Lightbulb, BarChart3, Clock } from 'lucide-react'

interface HistoricalAnalysis {
  total_period_change?: number
  recent_momentum?: number
  '52_week_high'?: number
  '52_week_low'?: number
  high_date?: string
  low_date?: string
  current_vs_high?: number
  current_vs_low?: number
  trend_direction?: string
  data_points?: number
}

interface TechnicalIndicators {
  sma_20?: number
  sma_50?: number
  volatility?: number
  volume_trend?: string
}

interface AIAnalysis {
  sentiment?: 'bullish' | 'bearish' | 'neutral'
  confidence?: number
  historical_analysis?: HistoricalAnalysis
  recommendations?: string[]
  price_targets?: {
    bull: number
    base: number
    bear: number
  }
  risk_score?: number
  patterns?: string[]
  technical_indicators?: TechnicalIndicators
  explanation?: string
}

interface CompanyAIAgentProps {
  symbol: string
  analysis: AIAnalysis
  currentPrice?: number
}

export default function CompanyAIAgent({ symbol, analysis, currentPrice }: CompanyAIAgentProps) {
  const { sentiment, confidence, historical_analysis, recommendations, price_targets, risk_score, patterns, technical_indicators, explanation } = analysis

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
      {/* Header - Company-Specific Agent */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 bg-gradient-to-br from-neon-blue/20 to-electric-purple/20 rounded-lg">
          <Brain className="text-electric-purple" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{symbol} AI Agent</h3>
          <p className="text-xs text-gray-500">Company-specific chart analysis</p>
        </div>
      </div>

      {/* Historical Analysis Section */}
      {historical_analysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History size={18} className="text-neon-blue" />
            <h4 className="text-sm font-semibold text-gray-300">📊 Past History Analysis</h4>
          </div>
          <div className="p-4 bg-white/5 rounded-lg space-y-2 text-sm">
            {historical_analysis.trend_direction && (
              <div className="flex justify-between">
                <span className="text-gray-400">Trend Direction:</span>
                <span className={`font-semibold ${historical_analysis.trend_direction === 'upward' ? 'text-green-400' : 'text-red-400'}`}>
                  {historical_analysis.trend_direction === 'upward' ? '↗️ Upward' : '↘️ Downward'}
                </span>
              </div>
            )}
            {historical_analysis.total_period_change !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Total Period Change:</span>
                <span className={`font-semibold ${historical_analysis.total_period_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {historical_analysis.total_period_change >= 0 ? '+' : ''}{historical_analysis.total_period_change.toFixed(2)}%
                </span>
              </div>
            )}
            {historical_analysis.recent_momentum !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Recent Momentum:</span>
                <span className={`font-semibold ${historical_analysis.recent_momentum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {historical_analysis.recent_momentum >= 0 ? '+' : ''}{historical_analysis.recent_momentum.toFixed(2)}%
                </span>
              </div>
            )}
            {historical_analysis['52_week_high'] && currentPrice && (
              <div className="flex justify-between">
                <span className="text-gray-400">52W High:</span>
                <span className="font-semibold text-yellow-400">NPR {historical_analysis['52_week_high'].toFixed(2)}</span>
              </div>
            )}
            {historical_analysis['52_week_low'] && currentPrice && (
              <div className="flex justify-between">
                <span className="text-gray-400">52W Low:</span>
                <span className="font-semibold text-yellow-400">NPR {historical_analysis['52_week_low'].toFixed(2)}</span>
              </div>
            )}
            {historical_analysis.current_vs_high !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">From High:</span>
                <span className="font-semibold">{historical_analysis.current_vs_high.toFixed(2)}%</span>
              </div>
            )}
            {historical_analysis.current_vs_low !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">From Low:</span>
                <span className="font-semibold text-green-400">{historical_analysis.current_vs_low.toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

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
                className="h-full bg-gradient-to-r from-neon-blue to-electric-purple rounded-full transition-all duration-500"
                style={{ width: `${((confidence || 0) * 100)}%` }}
              />
            </div>
            <span className="text-lg font-semibold">{((confidence || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      {technical_indicators && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-neon-blue" />
            <h4 className="text-sm font-semibold text-gray-300">Technical Indicators</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {technical_indicators.sma_20 && (
              <div className="p-2 bg-white/5 rounded">
                <div className="text-gray-400">SMA 20</div>
                <div className="font-semibold">NPR {technical_indicators.sma_20.toFixed(2)}</div>
              </div>
            )}
            {technical_indicators.sma_50 && (
              <div className="p-2 bg-white/5 rounded">
                <div className="text-gray-400">SMA 50</div>
                <div className="font-semibold">NPR {technical_indicators.sma_50.toFixed(2)}</div>
              </div>
            )}
            {technical_indicators.volatility !== undefined && (
              <div className="p-2 bg-white/5 rounded">
                <div className="text-gray-400">Volatility</div>
                <div className="font-semibold">{technical_indicators.volatility.toFixed(2)}%</div>
              </div>
            )}
            {technical_indicators.volume_trend && (
              <div className="p-2 bg-white/5 rounded">
                <div className="text-gray-400">Volume</div>
                <div className="font-semibold capitalize">{technical_indicators.volume_trend}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Price Targets */}
      {price_targets && currentPrice && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-400">Price Targets</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-xs text-green-400 mb-1">Bull Case</div>
              <div className="text-lg font-bold text-green-500">NPR {price_targets.bull.toFixed(2)}</div>
              <div className="text-xs text-green-400">
                +{(((price_targets.bull - currentPrice) / currentPrice) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-xs text-blue-400 mb-1">Base Case</div>
              <div className="text-lg font-bold text-blue-500">NPR {price_targets.base.toFixed(2)}</div>
              <div className="text-xs text-blue-400">
                {((price_targets.base - currentPrice) / currentPrice * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="text-xs text-red-400 mb-1">Bear Case</div>
              <div className="text-lg font-bold text-red-500">NPR {price_targets.bear.toFixed(2)}</div>
              <div className="text-xs text-red-400">
                {((price_targets.bear - currentPrice) / currentPrice * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-yellow-500" />
            <h4 className="text-sm font-semibold text-gray-300">💡 Recommendations - What to Do</h4>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-gray-200 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {risk_score !== undefined && (
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              <span className="text-sm font-semibold">Risk Score</span>
            </div>
            <span className="text-lg font-bold">{risk_score.toFixed(1)}/10</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                risk_score < 4 ? 'bg-green-500' : risk_score < 7 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${risk_score * 10}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {risk_score < 4 ? 'Low Risk' : risk_score < 7 ? 'Moderate Risk' : 'High Risk'}
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
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-neon-blue" />
            <h4 className="text-sm font-semibold text-neon-blue">🔮 Future Prediction</h4>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{explanation}</p>
        </div>
      )}
    </div>
  )
}

