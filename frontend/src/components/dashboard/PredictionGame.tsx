import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Trophy, Target, Clock, Zap } from 'lucide-react'

interface Prediction {
  id: string
  symbol: string
  currentPrice: number
  predictedPrice: number
  direction: 'up' | 'down'
  timestamp: number
  expiresAt: number
  result?: 'correct' | 'incorrect'
  points?: number
}

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
  accuracy: number
  predictions: number
}

export default function PredictionGame() {
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState('NABIL')
  const [predictedDirection, setPredictedDirection] = useState<'up' | 'down'>('up')
  const [userScore, setUserScore] = useState(1250)
  const [userAccuracy, setUserAccuracy] = useState(68.5)

  const symbols = ['NABIL', 'NICA', 'HDL', 'UPPER', 'NHPC', 'SANIMA', 'SCB', 'EBL']
  
  const mockCurrentPrices: Record<string, number> = {
    'NABIL': 1050,
    'NICA': 850,
    'HDL': 420,
    'UPPER': 380,
    'NHPC': 520,
    'SANIMA': 460,
    'SCB': 520,
    'EBL': 680
  }

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'TraderPro', score: 3450, accuracy: 85.2, predictions: 142 },
    { rank: 2, username: 'MarketWizard', score: 3120, accuracy: 78.9, predictions: 198 },
    { rank: 3, username: 'BullMaster', score: 2890, accuracy: 72.4, predictions: 156 },
    { rank: 4, username: 'You', score: userScore, accuracy: userAccuracy, predictions: 87 },
    { rank: 5, username: 'StockGuru', score: 2340, accuracy: 69.1, predictions: 134 }
  ]

  useEffect(() => {
    // Simulate checking predictions
    const interval = setInterval(() => {
      setPredictions(prev => prev.map(pred => {
        if (pred.result || Date.now() < pred.expiresAt) return pred
        
        // Simulate price change
        const priceChange = (Math.random() - 0.5) * 20
        const newPrice = pred.currentPrice + priceChange
        const actualDirection = newPrice > pred.currentPrice ? 'up' : 'down'
        const isCorrect = actualDirection === pred.direction
        
        return {
          ...pred,
          result: isCorrect ? 'correct' : 'incorrect',
          points: isCorrect ? 50 : -20
        }
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleMakePrediction = () => {
    const newPrediction: Prediction = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      currentPrice: mockCurrentPrices[selectedSymbol],
      predictedPrice: mockCurrentPrices[selectedSymbol] * (predictedDirection === 'up' ? 1.02 : 0.98),
      direction: predictedDirection,
      timestamp: Date.now(),
      expiresAt: Date.now() + 30000 // 30 seconds for demo
    }
    
    setPredictions(prev => [newPrediction, ...prev.slice(0, 9)])
  }

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-3 flex items-center gap-2">
            <Target className="text-neon-blue" size={24} />
            Market Prediction Game
          </h3>
          <p className="text-sm text-gray-400 mt-1">Test your market prediction skills</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Your Score</div>
            <div className="text-lg font-bold text-neon-blue">{userScore}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Accuracy</div>
            <div className="text-lg font-bold text-green-500">{userAccuracy}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('play')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'play'
              ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
              : 'glass hover:glass-strong'
          }`}
        >
          Make Prediction
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-electric-purple/20 text-electric-purple border border-electric-purple/30'
              : 'glass hover:glass-strong'
          }`}
        >
          <Trophy className="inline mr-1" size={16} />
          Leaderboard
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'play' ? (
          <motion.div
            key="play"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Prediction Form */}
            <div className="glass-strong p-4 rounded-lg">
              <label htmlFor="stock-select" className="block text-sm font-medium mb-2">Select Stock</label>
              <select
                id="stock-select"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-neon-blue"
              >
                {symbols.map(sym => (
                  <option key={sym} value={sym}>{sym} - NPR {mockCurrentPrices[sym]}</option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-2">Predict Direction (30s)</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setPredictedDirection('up')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    predictedDirection === 'up'
                      ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                      : 'glass hover:glass-strong'
                  }`}
                >
                  <TrendingUp size={20} />
                  Bullish
                </button>
                <button
                  onClick={() => setPredictedDirection('down')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    predictedDirection === 'down'
                      ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                      : 'glass hover:glass-strong'
                  }`}
                >
                  <TrendingDown size={20} />
                  Bearish
                </button>
              </div>

              <button
                onClick={handleMakePrediction}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Make Prediction (+50 points if correct)
              </button>
            </div>

            {/* Active Predictions */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock size={16} className="text-electric-purple" />
                Your Active Predictions
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {predictions.length === 0 ? (
                  <div className="glass-strong p-4 rounded-lg text-center text-gray-400 text-sm">
                    No predictions yet. Make your first prediction above!
                  </div>
                ) : (
                  predictions.map(pred => (
                    <motion.div
                      key={pred.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`glass-strong p-3 rounded-lg ${
                        pred.result === 'correct' ? 'border-l-4 border-green-500' :
                        pred.result === 'incorrect' ? 'border-l-4 border-red-500' :
                        'border-l-4 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{pred.symbol}</div>
                          <div className="text-xs text-gray-400">
                            NPR {pred.currentPrice} → 
                            <span className={pred.direction === 'up' ? 'text-green-400' : 'text-red-400'}>
                              {pred.direction === 'up' ? ' ↑' : ' ↓'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {pred.result ? (
                            <div className={`text-sm font-bold ${
                              pred.result === 'correct' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {pred.result === 'correct' ? '+' : ''}{pred.points} pts
                            </div>
                          ) : (
                            <div className="text-xs text-yellow-400">Pending...</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {leaderboard.map((entry, idx) => (
              <motion.div
                key={entry.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-strong p-4 rounded-lg ${
                  entry.username === 'You' ? 'border-2 border-neon-blue' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${
                    entry.rank === 1 ? 'text-yellow-400' :
                    entry.rank === 2 ? 'text-gray-300' :
                    entry.rank === 3 ? 'text-orange-400' :
                    'text-gray-500'
                  }`}>
                    #{entry.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{entry.username}</div>
                    <div className="text-xs text-gray-400">
                      {entry.predictions} predictions • {entry.accuracy}% accuracy
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-neon-blue">{entry.score}</div>
                    <div className="text-xs text-gray-400">points</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
