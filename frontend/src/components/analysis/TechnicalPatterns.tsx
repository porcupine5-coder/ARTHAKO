import { Activity, CheckCircle, AlertCircle } from 'lucide-react'

interface Pattern {
  name: string
  type: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  description: string
}

interface TechnicalPatternsProps {
  patterns?: Pattern[]
}

export default function TechnicalPatterns({ patterns }: TechnicalPatternsProps) {
  const mockPatterns: Pattern[] = patterns || [
    {
      name: 'Ascending Triangle',
      type: 'bullish',
      confidence: 0.82,
      description: 'Price forming higher lows with resistance at current level',
    },
    {
      name: 'Higher Lows',
      type: 'bullish',
      confidence: 0.75,
      description: 'Consistent pattern of higher lows indicating upward momentum',
    },
    {
      name: 'Volume Breakout',
      type: 'bullish',
      confidence: 0.68,
      description: 'Recent volume spike suggests increased buying interest',
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bullish':
        return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'bearish':
        return 'text-red-500 bg-red-500/10 border-red-500/20'
      default:
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bullish':
        return CheckCircle
      case 'bearish':
        return AlertCircle
      default:
        return Activity
    }
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="text-electric-purple" size={24} />
        <h3 className="text-heading-3">Technical Patterns</h3>
      </div>

      <div className="space-y-3">
        {mockPatterns.map((pattern, idx) => {
          const Icon = getTypeIcon(pattern.type)
          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${getTypeColor(pattern.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={18} />
                  <span className="font-semibold">{pattern.name}</span>
                </div>
                <span className="text-sm font-medium">
                  {(pattern.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm opacity-80">{pattern.description}</p>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current rounded-full transition-all duration-500"
                  style={{ width: `${pattern.confidence * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}