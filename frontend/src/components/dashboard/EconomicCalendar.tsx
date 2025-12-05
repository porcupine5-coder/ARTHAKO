import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

interface EconomicEvent {
  id: string
  date: Date
  title: string
  category: 'policy' | 'earnings' | 'data' | 'meeting'
  importance: 'high' | 'medium' | 'low'
  predictedImpact: number
  affectedSectors: string[]
  description: string
}

const mockEvents: EconomicEvent[] = [
  {
    id: '1',
    date: new Date(2025, 10, 8),
    title: 'Nepal Rastra Bank Monetary Policy Review',
    category: 'policy',
    importance: 'high',
    predictedImpact: 8.5,
    affectedSectors: ['Banking', 'Finance'],
    description: 'Quarterly monetary policy review expected to address interest rates'
  },
  {
    id: '2',
    date: new Date(2025, 10, 10),
    title: 'Q3 GDP Data Release',
    category: 'data',
    importance: 'high',
    predictedImpact: 7.8,
    affectedSectors: ['All Sectors'],
    description: 'Third quarter GDP growth data publication'
  },
  {
    id: '3',
    date: new Date(2025, 10, 12),
    title: 'NABIL Bank Earnings Report',
    category: 'earnings',
    importance: 'medium',
    predictedImpact: 6.2,
    affectedSectors: ['Banking'],
    description: 'Quarterly earnings announcement'
  },
  {
    id: '4',
    date: new Date(2025, 10, 15),
    title: 'Hydropower Summit 2025',
    category: 'meeting',
    importance: 'medium',
    predictedImpact: 5.5,
    affectedSectors: ['Hydropower', 'Energy'],
    description: 'Annual hydropower industry conference'
  },
  {
    id: '5',
    date: new Date(2025, 10, 18),
    title: 'Inflation Data October',
    category: 'data',
    importance: 'high',
    predictedImpact: 7.2,
    affectedSectors: ['All Sectors'],
    description: 'Monthly inflation rate announcement'
  },
  {
    id: '6',
    date: new Date(2025, 10, 20),
    title: 'Insurance Regulatory Update',
    category: 'policy',
    importance: 'medium',
    predictedImpact: 6.8,
    affectedSectors: ['Insurance'],
    description: 'New insurance sector regulations announcement'
  }
]

export default function EconomicCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10, 1))
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  const filteredEvents = mockEvents.filter(event => 
    filter === 'all' || event.importance === filter
  )

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'policy': return '📋'
      case 'earnings': return '💰'
      case 'data': return '📊'
      case 'meeting': return '🤝'
      default: return '📅'
    }
  }

  const getImpactDirection = (impact: number) => {
    if (impact >= 7) return <TrendingUp className="text-red-400" size={16} />
    if (impact >= 5) return <AlertTriangle className="text-yellow-400" size={16} />
    return <TrendingDown className="text-green-400" size={16} />
  }

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-3 flex items-center gap-2">
            <Calendar className="text-neon-blue" size={24} />
            Economic Calendar
          </h3>
          <p className="text-sm text-gray-400 mt-1">Upcoming events with impact projections</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
          className="p-2 glass rounded-lg hover:glass-strong transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h4 className="text-lg font-bold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
          className="p-2 glass rounded-lg hover:glass-strong transition-all"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'high', 'medium', 'low'] as const).map(importance => (
          <button
            key={importance}
            onClick={() => setFilter(importance)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === importance
                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                : 'glass hover:glass-strong'
            }`}
          >
            {importance.charAt(0).toUpperCase() + importance.slice(1)}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
              className={`glass-strong p-4 rounded-lg cursor-pointer transition-all hover:glass ${
                selectedEvent?.id === event.id ? 'border-2 border-neon-blue' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Date Badge */}
                <div className="flex-shrink-0 text-center p-2 glass rounded-lg">
                  <div className="text-xl font-bold">{event.date.getDate()}</div>
                  <div className="text-xs text-gray-400">
                    {event.date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(event.category)}</span>
                      <h4 className="text-sm font-medium line-clamp-1">{event.title}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getImportanceColor(event.importance)}`}>
                      {event.importance.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      {getImpactDirection(event.predictedImpact)}
                      <span>Impact: {event.predictedImpact.toFixed(1)}/10</span>
                    </div>
                    <span>•</span>
                    <span>{event.affectedSectors.join(', ')}</span>
                  </div>

                  {/* Impact Bar */}
                  <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${event.predictedImpact * 10}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        event.predictedImpact >= 7 ? 'bg-red-500' :
                        event.predictedImpact >= 5 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                    />
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedEvent?.id === event.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-white/10"
                      >
                        <p className="text-sm text-gray-300 mb-3">{event.description}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="glass p-2 rounded">
                            <div className="text-xs text-gray-400 mb-1">Category</div>
                            <div className="text-sm font-medium capitalize">{event.category}</div>
                          </div>
                          <div className="glass p-2 rounded">
                            <div className="text-xs text-gray-400 mb-1">Time</div>
                            <div className="text-sm font-medium">
                              {event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <div className="glass-strong p-8 rounded-lg text-center">
            <Calendar className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-gray-400">No events match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
