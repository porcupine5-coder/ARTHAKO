import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper, TrendingUp, TrendingDown, AlertCircle, ExternalLink } from 'lucide-react'

interface NewsItem {
  id: string
  title: string
  source: string
  timestamp: Date
  sentiment: 'positive' | 'negative' | 'neutral'
  impactScore: number
  affectedStocks: string[]
  category: string
  url: string
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Nepal Rastra Bank announces new monetary policy favoring banking sector',
    source: 'The Himalayan Times',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    sentiment: 'positive',
    impactScore: 8.5,
    affectedStocks: ['NABIL', 'SCB', 'EBL', 'NICA'],
    category: 'Policy',
    url: '#'
  },
  {
    id: '2',
    title: 'Hydropower production hits record low due to drought',
    source: 'Kathmandu Post',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    sentiment: 'negative',
    impactScore: 7.2,
    affectedStocks: ['HDL', 'UPPER', 'NHPC'],
    category: 'Energy',
    url: '#'
  },
  {
    id: '3',
    title: 'Insurance sector shows strong quarterly growth',
    source: 'MyRepublica',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    sentiment: 'positive',
    impactScore: 6.8,
    affectedStocks: ['NLIC', 'SANIMA', 'SICL'],
    category: 'Earnings',
    url: '#'
  },
  {
    id: '4',
    title: 'New regulations may affect foreign investment limits',
    source: 'Nepal Economic Forum',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    sentiment: 'neutral',
    impactScore: 5.5,
    affectedStocks: ['NABIL', 'SCB'],
    category: 'Regulation',
    url: '#'
  },
  {
    id: '5',
    title: 'Tech sector IPO draws massive oversubscription',
    source: 'Business 360',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    sentiment: 'positive',
    impactScore: 9.1,
    affectedStocks: ['CIT', 'NIMB'],
    category: 'IPO',
    url: '#'
  }
]

export default function NewsImpactTracker() {
  const [news, setNews] = useState<NewsItem[]>(mockNews)
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'Policy', 'Energy', 'Earnings', 'Regulation', 'IPO']

  const filteredNews = news.filter(item => {
    if (filter !== 'all' && item.sentiment !== filter) return false
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
    return true
  })

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'negative': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp size={16} />
      case 'negative': return <TrendingDown size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-3 flex items-center gap-2">
            <Newspaper className="text-neon-blue" size={24} />
            News Impact Tracker
          </h3>
          <p className="text-sm text-gray-400 mt-1">Real-time market news analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'positive', 'negative', 'neutral'] as const).map(sentiment => (
            <button
              key={sentiment}
              onClick={() => setFilter(sentiment)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === sentiment
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'glass hover:glass-strong'
              }`}
            >
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-electric-purple/20 text-electric-purple border border-electric-purple/30'
                  : 'glass hover:glass-strong'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              className="glass-strong p-4 rounded-lg hover:glass transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getSentimentColor(item.sentiment)} border`}>
                  {getSentimentIcon(item.sentiment)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium line-clamp-2 group-hover:text-neon-blue transition-colors">
                      {item.title}
                    </h4>
                    <ExternalLink size={14} className="text-gray-400 group-hover:text-neon-blue flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{getTimeAgo(item.timestamp)}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">{item.category}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-medium">Impact Score:</div>
                    <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.impactScore * 10}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          item.impactScore >= 8 ? 'bg-red-500' :
                          item.impactScore >= 6 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      />
                    </div>
                    <div className="text-xs font-bold">{item.impactScore.toFixed(1)}</div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {item.affectedStocks.map(stock => (
                      <span
                        key={stock}
                        className="px-2 py-0.5 text-xs rounded-full bg-neon-blue/10 text-neon-blue border border-neon-blue/30"
                      >
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNews.length === 0 && (
          <div className="glass-strong p-8 rounded-lg text-center">
            <Newspaper className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-gray-400">No news items match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
