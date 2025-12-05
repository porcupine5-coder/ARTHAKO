import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Users, Eye, Copy, Star, TrendingUp } from 'lucide-react'

interface TradingActivity {
  symbol: string
  price: number
  volume: number
  traders: number
  topTraders: number
  avgReturn: number
  heat: number
}

const mockData: TradingActivity[] = [
  { symbol: 'NABIL', price: 1050, volume: 125000, traders: 342, topTraders: 28, avgReturn: 12.5, heat: 9.2 },
  { symbol: 'NICA', price: 850, volume: 98000, traders: 289, topTraders: 22, avgReturn: 8.3, heat: 7.8 },
  { symbol: 'HDL', price: 420, volume: 156000, traders: 412, topTraders: 35, avgReturn: 15.2, heat: 8.9 },
  { symbol: 'UPPER', price: 380, volume: 134000, traders: 378, topTraders: 31, avgReturn: 18.7, heat: 9.5 },
  { symbol: 'SCB', price: 520, volume: 89000, traders: 256, topTraders: 19, avgReturn: 6.8, heat: 6.5 },
  { symbol: 'NHPC', price: 520, volume: 112000, traders: 301, topTraders: 24, avgReturn: 10.2, heat: 7.3 },
  { symbol: 'EBL', price: 680, volume: 76000, traders: 223, topTraders: 17, avgReturn: 5.4, heat: 5.9 },
  { symbol: 'SANIMA', price: 460, volume: 94000, traders: 267, topTraders: 20, avgReturn: 7.9, heat: 6.8 },
  { symbol: 'NLIC', price: 1200, volume: 68000, traders: 198, topTraders: 15, avgReturn: 4.2, heat: 5.2 },
  { symbol: 'GBIME', price: 390, volume: 102000, traders: 284, topTraders: 21, avgReturn: 9.1, heat: 7.1 }
]

interface TopTrader {
  name: string
  return: number
  followers: number
  accuracy: number
  position: 'long' | 'short'
}

const topTraders: TopTrader[] = [
  { name: 'MarketWizard', return: 156.3, followers: 2340, accuracy: 78.5, position: 'long' },
  { name: 'BullMaster', return: 142.7, followers: 1890, accuracy: 75.2, position: 'long' },
  { name: 'TraderPro', return: 128.4, followers: 1650, accuracy: 72.8, position: 'short' },
  { name: 'StockGuru', return: 115.9, followers: 1420, accuracy: 70.3, position: 'long' }
]

export default function SocialTradingHeatmap() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [view, setView] = useState<'heatmap' | 'traders'>('heatmap')

  const getHeatColor = (heat: number) => {
    if (heat >= 9) return 'bg-red-500'
    if (heat >= 7) return 'bg-orange-500'
    if (heat >= 5) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getHeatGlow = (heat: number) => {
    if (heat >= 9) return 'shadow-lg shadow-red-500/50'
    if (heat >= 7) return 'shadow-lg shadow-orange-500/50'
    if (heat >= 5) return 'shadow-lg shadow-yellow-500/50'
    return 'shadow-lg shadow-green-500/50'
  }

  const maxHeat = Math.max(...mockData.map(d => d.heat))
  const sortedByHeat = [...mockData].sort((a, b) => b.heat - a.heat)

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-3 flex items-center gap-2">
            <Flame className="text-orange-500" size={24} />
            Social Trading Heatmap
          </h3>
          <p className="text-sm text-gray-400 mt-1">See what top traders are trading</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('heatmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'heatmap'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'glass hover:glass-strong'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setView('traders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'traders'
                ? 'bg-electric-purple/20 text-electric-purple border border-electric-purple/30'
                : 'glass hover:glass-strong'
            }`}
          >
            Top Traders
          </button>
        </div>
      </div>

      {view === 'heatmap' ? (
        <div className="space-y-4">
          {/* Heat Legend */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Heat:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-500 rounded" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Very High</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-5 gap-2">
            {sortedByHeat.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                onClick={() => setSelectedStock(stock.symbol)}
                className={`relative p-3 rounded-lg cursor-pointer transition-all ${getHeatColor(stock.heat)} ${
                  selectedStock === stock.symbol ? getHeatGlow(stock.heat) : ''
                }`}
                style={{ 
                  opacity: 0.7 + (stock.heat / maxHeat) * 0.3 
                }}
              >
                <div className="text-white font-bold text-sm mb-1">{stock.symbol}</div>
                <div className="text-white/80 text-xs">{stock.heat.toFixed(1)}°</div>
                <div className="text-white/60 text-xs flex items-center gap-1">
                  <Users size={10} />
                  {stock.traders}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Selected Stock Details */}
          {selectedStock && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong p-4 rounded-lg"
            >
              {(() => {
                const stock = mockData.find(s => s.symbol === selectedStock)
                if (!stock) return null
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold">{stock.symbol}</h4>
                      <button className="btn-primary text-xs flex items-center gap-1">
                        <Copy size={12} />
                        Copy Trade
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Price</div>
                        <div className="font-bold">NPR {stock.price}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Volume</div>
                        <div className="font-bold">{(stock.volume / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Active Traders</div>
                        <div className="font-bold">{stock.traders}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Top Traders</div>
                        <div className="font-bold text-electric-purple">{stock.topTraders}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Avg Return</div>
                        <div className="font-bold text-green-400">+{stock.avgReturn}%</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Heat Score</div>
                        <div className="font-bold text-orange-400">{stock.heat.toFixed(1)}</div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {topTraders.map((trader, index) => (
            <motion.div
              key={trader.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-strong p-4 rounded-lg hover:glass transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-electric-purple flex items-center justify-center font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {trader.name}
                      {index < 3 && <Star className="text-yellow-400" size={14} fill="currentColor" />}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye size={12} />
                      {trader.followers.toLocaleString()} followers
                    </div>
                  </div>
                </div>
                <button className="btn-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Follow
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Total Return</div>
                  <div className="font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp size={14} />
                    +{trader.return}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                  <div className="font-bold text-neon-blue">{trader.accuracy}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Position</div>
                  <div className={`font-bold ${trader.position === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {trader.position.toUpperCase()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
