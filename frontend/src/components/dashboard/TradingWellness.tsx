import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Eye, Brain, Coffee, Activity, Clock, LucideIcon } from 'lucide-react'

interface WellnessMetric {
  label: string
  value: number
  max: number
  icon: LucideIcon
  color: string
  status: 'good' | 'warning' | 'critical'
}

export default function TradingWellness() {
  const [screenTime, setScreenTime] = useState(245)
  const [stressLevel, setStressLevel] = useState(65)
  const [breaksTaken, setBreaksTaken] = useState(3)
  const [focusScore, setFocusScore] = useState(78)
  const [showBreakReminder, setShowBreakReminder] = useState(false)

  useEffect(() => {
    // Simulate screen time increase
    const interval = setInterval(() => {
      setScreenTime(prev => prev + 1)
      
      // Show break reminder every 60 minutes
      if (screenTime % 60 === 0 && screenTime > 0) {
        setShowBreakReminder(true)
        setTimeout(() => setShowBreakReminder(false), 10000)
      }
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [screenTime])

  const metrics = [
    {
      label: 'Screen Time',
      value: screenTime,
      max: 480,
      icon: Eye,
      color: screenTime > 360 ? 'text-red-400' : screenTime > 240 ? 'text-yellow-400' : 'text-green-400',
      status: (screenTime > 360 ? 'critical' : screenTime > 240 ? 'warning' : 'good') as 'good' | 'warning' | 'critical'
    },
    {
      label: 'Stress Level',
      value: stressLevel,
      max: 100,
      icon: Brain,
      color: stressLevel > 70 ? 'text-red-400' : stressLevel > 50 ? 'text-yellow-400' : 'text-green-400',
      status: (stressLevel > 70 ? 'critical' : stressLevel > 50 ? 'warning' : 'good') as 'good' | 'warning' | 'critical'
    },
    {
      label: 'Breaks Today',
      value: breaksTaken,
      max: 8,
      icon: Coffee,
      color: breaksTaken < 2 ? 'text-red-400' : breaksTaken < 4 ? 'text-yellow-400' : 'text-green-400',
      status: (breaksTaken < 2 ? 'critical' : breaksTaken < 4 ? 'warning' : 'good') as 'good' | 'warning' | 'critical'
    },
    {
      label: 'Focus Score',
      value: focusScore,
      max: 100,
      icon: Activity,
      color: focusScore < 50 ? 'text-red-400' : focusScore < 70 ? 'text-yellow-400' : 'text-green-400',
      status: (focusScore < 50 ? 'critical' : focusScore < 70 ? 'warning' : 'good') as 'good' | 'warning' | 'critical'
    }
  ] as WellnessMetric[]

  const tips = [
    { icon: '👁️', title: '20-20-20 Rule', description: 'Every 20 minutes, look 20 feet away for 20 seconds' },
    { icon: '🧘', title: 'Breathe', description: 'Take 3 deep breaths before making important decisions' },
    { icon: '💧', title: 'Stay Hydrated', description: 'Drink water regularly to maintain focus' },
    { icon: '🚶', title: 'Move Around', description: 'Stand up and stretch every hour' },
    { icon: '😌', title: 'Mindful Trading', description: 'Don\'t let emotions drive your decisions' },
    { icon: '⏰', title: 'Set Limits', description: 'Define daily trading time and stick to it' }
  ]

  const handleTakeBreak = () => {
    setBreaksTaken(prev => prev + 1)
    setStressLevel(prev => Math.max(0, prev - 15))
    setFocusScore(prev => Math.min(100, prev + 10))
    setShowBreakReminder(false)
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-3 flex items-center gap-2">
            <Heart className="text-pink-500" size={24} />
            Trading Wellness
          </h3>
          <p className="text-sm text-gray-400 mt-1">Monitor your trading health</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <span className="text-sm">{formatTime(screenTime)}</span>
        </div>
      </div>

      {/* Break Reminder */}
      {showBreakReminder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-strong p-4 rounded-lg mb-4 border-2 border-yellow-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Coffee className="text-yellow-400" size={20} />
              </div>
              <div>
                <div className="font-medium">Time for a Break!</div>
                <div className="text-xs text-gray-400">You've been trading for a while</div>
              </div>
            </div>
            <button
              onClick={handleTakeBreak}
              className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all text-sm font-medium"
            >
              Take Break
            </button>
          </div>
        </motion.div>
      )}

      {/* Wellness Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="glass-strong p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <IconComponent className={metric.color} size={20} />
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                metric.status === 'good' ? 'bg-green-500/20 text-green-400' :
                metric.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {metric.status}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
            <div className="text-xl font-bold mb-2">
              {metric.label === 'Screen Time' ? formatTime(metric.value) : 
               metric.label === 'Breaks Today' ? metric.value :
               `${metric.value}%`}
            </div>
            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(metric.value / metric.max) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`h-full rounded-full ${
                  metric.status === 'good' ? 'bg-green-500' :
                  metric.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
              />
            </div>
          </motion.div>
        )
        })}
      </div>

      {/* Wellness Tips */}
      <div>
        <h4 className="text-sm font-medium mb-3">Wellness Tips</h4>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
          {tips.map((tip, index) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-strong p-3 rounded-lg hover:glass transition-all group cursor-pointer"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {tip.icon}
              </div>
              <div className="text-xs font-medium mb-1">{tip.title}</div>
              <div className="text-xs text-gray-400 line-clamp-2">{tip.description}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={handleTakeBreak}
          className="btn-primary text-xs flex items-center justify-center gap-2"
        >
          <Coffee size={14} />
          Take Break
        </button>
        <button
          onClick={() => setStressLevel(prev => Math.max(0, prev - 10))}
          className="glass hover:glass-strong px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
        >
          <Brain size={14} />
          Mindful Moment
        </button>
      </div>
    </div>
  )
}
