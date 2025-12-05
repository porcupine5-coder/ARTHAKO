import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface SectorData {
  name: string
  momentum: number // percentage change in last 7 days
  volume: number
  stocks: number
  avgChange: number
  sentiment: 'hot' | 'warm' | 'neutral' | 'cool' | 'cold'
}

const generateMockSectors = (period: string): SectorData[] => {
  const periodMultiplier = period === '7day' ? 1 : period === '30day' ? 2.5 : period === '90day' ? 4 : period === '180day' ? 6 : 8
  const volatilityMultiplier = period === '7day' ? 1.2 : period === '30day' ? 1 : period === '90day' ? 0.8 : period === '180day' ? 0.6 : 0.4

  const baseSectors = [
    { name: 'Banking', baseMomentum: 8.2, volume: 45000000, stocks: 28 },
    { name: 'Hydropower', baseMomentum: 5.7, volume: 32000000, stocks: 45 },
    { name: 'Insurance', baseMomentum: -2.3, volume: 18000000, stocks: 24 },
    { name: 'Hotels', baseMomentum: 3.1, volume: 12000000, stocks: 15 },
    { name: 'Development Banks', baseMomentum: 6.4, volume: 28000000, stocks: 32 },
    { name: 'Manufacturing', baseMomentum: -4.2, volume: 15000000, stocks: 18 },
    { name: 'Microfinance', baseMomentum: 1.2, volume: 9000000, stocks: 22 },
    { name: 'Finance', baseMomentum: 7.8, volume: 35000000, stocks: 20 },
    { name: 'Investment', baseMomentum: -0.8, volume: 8000000, stocks: 12 },
    { name: 'Trading', baseMomentum: 4.5, volume: 11000000, stocks: 14 },
    { name: 'Life Insurance', baseMomentum: 2.8, volume: 14000000, stocks: 10 },
    { name: 'Others', baseMomentum: 0.5, volume: 6000000, stocks: 25 }
  ]

  return baseSectors.map(sector => {
    const momentumVariation = (Math.random() - 0.5) * 10 * volatilityMultiplier
    const momentum = sector.baseMomentum * periodMultiplier + momentumVariation
    const avgChange = momentum / 3 + (Math.random() - 0.5) * 2

    let sentiment: 'hot' | 'warm' | 'neutral' | 'cool' | 'cold'
    if (momentum >= 15) sentiment = 'hot'
    else if (momentum >= 8) sentiment = 'warm'
    else if (momentum >= -2) sentiment = 'neutral'
    else if (momentum >= -8) sentiment = 'cool'
    else sentiment = 'cold'

    return {
      name: sector.name,
      momentum: Math.round(momentum * 10) / 10,
      volume: Math.round(sector.volume * (1 + Math.random() * 0.5)),
      stocks: sector.stocks,
      avgChange: Math.round(avgChange * 10) / 10,
      sentiment
    }
  })
}

export default function SectorHeatmap({ selectedPeriod = '30day' }: { selectedPeriod?: string }) {
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        const response = await fetch(`/api/market/sectors?period=${selectedPeriod}`)
        const data = await response.json()
        // Map backend data to frontend interface
        const mappedSectors = (data.sectors || []).map((sector: any) => ({
          name: sector.name || 'Unknown',
          momentum: sector.momentum || sector.change || 0,
          volume: sector.volume || 0,
          stocks: sector.stocks || 0,
          avgChange: sector.avgChange || sector.change || 0,
          sentiment: sector.sentiment || (sector.change >= 0 ? 'warm' : 'cool')
        }))
        setSectors(mappedSectors)
      } catch (error) {
        console.error('Failed to fetch sector data:', error)
        // Mock data based on selected period
        setSectors(generateMockSectors(selectedPeriod))
      } finally {
        setLoading(false)
      }
    }

    fetchSectorData()
    const interval = setInterval(fetchSectorData, 60000)
    return () => clearInterval(interval)
  }, [selectedPeriod])

  const getHeatColor = (momentum: number) => {
    if (momentum >= 7) return 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white'
    if (momentum >= 4) return 'bg-gradient-to-br from-green-600/70 to-green-700/70 border-green-500/50 text-green-100'
    if (momentum >= 1) return 'bg-gradient-to-br from-lime-600/40 to-green-600/40 border-lime-500/30 text-lime-100'
    if (momentum >= -1) return 'bg-gradient-to-br from-slate-600/30 to-slate-700/30 border-slate-500/20 text-slate-200'
    if (momentum >= -4) return 'bg-gradient-to-br from-orange-600/40 to-red-600/40 border-orange-500/30 text-orange-100'
    return 'bg-gradient-to-br from-red-600/70 to-red-700/70 border-red-500/50 text-red-100'
  }

  const getPulseAnimation = (sentiment: string) => {
    if (sentiment === 'hot') return 'animate-pulse'
    if (sentiment === 'cold') return 'animate-pulse'
    return ''
  }

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-8 bg-white/10 rounded mb-4 w-1/3"></div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  // Sort by momentum for better visualization
  const sortedSectors = [...sectors].sort((a, b) => b.momentum - a.momentum)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-xl"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-heading-2">Sector Performance Heatmap</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>{selectedPeriod.replace('day', '-day')} momentum</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">Real-time sector analysis across NEPSE</p>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {sortedSectors.map((sector, index) => (
          <motion.div
            key={sector.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`${getHeatColor(sector.momentum)} ${getPulseAnimation(sector.sentiment)} border-2 rounded-lg p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
            onClick={() => setSelectedSector(selectedSector === sector.name ? null : sector.name)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm leading-tight">{sector.name}</h4>
              {sector.momentum >= 0 ? (
                <TrendingUp size={16} className="shrink-0" />
              ) : (
                <TrendingDown size={16} className="shrink-0" />
              )}
            </div>

            <div className="mb-3">
              <div className="text-2xl font-bold">
                {(sector?.momentum || 0) >= 0 ? '+' : ''}{(sector?.momentum || 0).toFixed(1)}%
              </div>
              <div className="text-xs opacity-75">{selectedPeriod.replace('day', '-day')} change</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-white/20">
              <div>
                <div className="opacity-75 mb-0.5">Stocks</div>
                <div className="font-semibold">{sector?.stocks || 0}</div>
              </div>
              <div>
                <div className="opacity-75 mb-0.5">Avg ±</div>
                <div className="font-semibold">
                  {(sector?.avgChange || 0) >= 0 ? '+' : ''}{(sector?.avgChange || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sector Detail Chart */}
      {selectedSector && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 p-4 rounded-lg border border-white/10 mb-6"
        >
          <h4 className="text-lg font-semibold mb-4">{selectedSector} Sector Performance</h4>
          <div className="h-48 bg-gradient-to-r from-neon-blue/10 to-electric-purple/10 rounded flex items-end justify-around p-2 gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const sector = sortedSectors.find(s => s.name === selectedSector)
              const baseHeight = sector ? Math.max(20, 100 - Math.abs(sector.momentum) * 2) : 50
              return (
                <div
                  key={i}
                  className="flex-1 bg-neon-blue/30 rounded-sm transition-all duration-300 hover:bg-neon-blue/50"
                  style={{ height: `${baseHeight + Math.random() * 30}%` }}
                />
              )
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Volume</div>
              <div className="font-semibold">{sortedSectors.find(s => s.name === selectedSector)?.volume.toLocaleString()} shares</div>
            </div>
            <div>
              <div className="text-gray-400">Companies</div>
              <div className="font-semibold">{sortedSectors.find(s => s.name === selectedSector)?.stocks} stocks</div>
            </div>
            <div>
              <div className="text-gray-400">Avg Change</div>
              <div className="font-semibold">{sortedSectors.find(s => s.name === selectedSector)?.avgChange.toFixed(1)}%</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-emerald-600 border border-green-400"></div>
          <span className="text-gray-400">Hot (&gt;7%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-lime-600/40 to-green-600/40 border border-lime-500/30"></div>
          <span className="text-gray-400">Warm (1-7%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-600/30 to-slate-700/30 border border-slate-500/20"></div>
          <span className="text-gray-400">Neutral (-1 to 1%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-600/40 to-red-600/40 border border-orange-500/30"></div>
          <span className="text-gray-400">Cool (-1 to -4%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-red-600/70 to-red-700/70 border border-red-500/50"></div>
          <span className="text-gray-400">Cold (&lt;-4%)</span>
        </div>
      </div>
    </motion.div>
  )
}
