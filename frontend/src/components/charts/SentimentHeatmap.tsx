import { useState } from 'react'
import { motion } from 'framer-motion'

interface SentimentData {
  sector: string
  sentiment: number // -1 to 1
  companies: number
}

export default function SentimentHeatmap() {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null)

  const sentimentData: SentimentData[] = [
    { sector: 'Banking', sentiment: 0.65, companies: 28 },
    { sector: 'Insurance', sentiment: 0.42, companies: 18 },
    { sector: 'Hydropower', sentiment: 0.78, companies: 45 },
    { sector: 'Finance', sentiment: -0.23, companies: 22 },
    { sector: 'Hotels', sentiment: 0.15, companies: 12 },
    { sector: 'Manufacturing', sentiment: -0.45, companies: 15 },
    { sector: 'Trading', sentiment: 0.32, companies: 8 },
    { sector: 'Microfinance', sentiment: 0.58, companies: 35 },
  ]

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return 'from-green-500 to-green-600'
    if (sentiment > 0) return 'from-green-400 to-green-500'
    if (sentiment > -0.5) return 'from-red-400 to-red-500'
    return 'from-red-500 to-red-600'
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.5) return 'Very Bullish'
    if (sentiment > 0) return 'Bullish'
    if (sentiment > -0.5) return 'Bearish'
    return 'Very Bearish'
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-heading-1 mb-4">Sector Sentiment Analysis</h2>
          <p className="text-body text-gray-600 dark:text-gray-400">
            AI-powered sentiment analysis across different sectors
          </p>
        </div>

        <div className="glass p-8 rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sentimentData.map((data, index) => (
              <motion.div
                key={data.sector}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => setHoveredSector(data.sector)}
                onHoverEnd={() => setHoveredSector(null)}
                className="relative group cursor-pointer"
              >
                <div
                  className={`aspect-square rounded-xl bg-gradient-to-br ${getSentimentColor(
                    data.sentiment
                  )} p-4 flex flex-col justify-between transition-all duration-300 ${
                    hoveredSector === data.sector ? 'shadow-2xl' : ''
                  } ${
                    hoveredSector && hoveredSector !== data.sector ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-white mb-1">
                      {data.sector}
                    </div>
                    <div className="text-xs text-white/80">
                      {data.companies} companies
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-1">
                      {(data.sentiment * 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-white/90">
                      {getSentimentLabel(data.sentiment)}
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  {hoveredSector === data.sector && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center"
                    >
                      <div className="text-white text-sm font-medium">
                        View Details
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-600" />
              <span className="text-gray-600 dark:text-gray-400">Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600" />
              <span className="text-gray-600 dark:text-gray-400">Bearish</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}