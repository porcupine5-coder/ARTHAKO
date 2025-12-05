import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Award, TrendingUp, Play, CheckCircle, Lock } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  category: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  completed: boolean
  locked: boolean
  xp: number
  description: string
}

const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Understanding NEPSE Basics',
    category: 'Fundamentals',
    duration: 10,
    difficulty: 'beginner',
    completed: true,
    locked: false,
    xp: 100,
    description: 'Learn the basics of Nepal Stock Exchange trading'
  },
  {
    id: '2',
    title: 'Reading Financial Statements',
    category: 'Analysis',
    duration: 15,
    difficulty: 'beginner',
    completed: true,
    locked: false,
    xp: 150,
    description: 'Master the art of analyzing company financials'
  },
  {
    id: '3',
    title: 'Technical Analysis Fundamentals',
    category: 'Technical',
    duration: 20,
    difficulty: 'intermediate',
    completed: false,
    locked: false,
    xp: 250,
    description: 'Learn chart patterns and indicators'
  },
  {
    id: '4',
    title: 'Risk Management Strategies',
    category: 'Risk',
    duration: 18,
    difficulty: 'intermediate',
    completed: false,
    locked: false,
    xp: 200,
    description: 'Protect your portfolio with proven strategies'
  },
  {
    id: '5',
    title: 'Advanced Options Trading',
    category: 'Advanced',
    duration: 25,
    difficulty: 'advanced',
    completed: false,
    locked: true,
    xp: 500,
    description: 'Master complex trading strategies'
  },
  {
    id: '6',
    title: 'Portfolio Diversification',
    category: 'Strategy',
    duration: 12,
    difficulty: 'intermediate',
    completed: false,
    locked: false,
    xp: 180,
    description: 'Build a balanced investment portfolio'
  }
]

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  xp: number
}

const achievements: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', unlocked: true, xp: 50 },
  { id: '2', title: 'Knowledge Seeker', description: 'Complete 5 lessons', icon: '📚', unlocked: true, xp: 200 },
  { id: '3', title: 'Trading Expert', description: 'Complete all beginner lessons', icon: '⭐', unlocked: false, xp: 500 },
  { id: '4', title: 'Master Trader', description: 'Complete all lessons', icon: '👑', unlocked: false, xp: 1000 }
]

export default function LearningHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [userLevel, setUserLevel] = useState(5)
  const [userXP, setUserXP] = useState(450)
  const [maxXP] = useState(1000)

  const categories = ['all', 'Fundamentals', 'Analysis', 'Technical', 'Risk', 'Strategy', 'Advanced']

  const filteredLessons = mockLessons.filter(lesson => 
    selectedCategory === 'all' || lesson.category === selectedCategory
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'advanced': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const completedCount = mockLessons.filter(l => l.completed).length
  const totalCount = mockLessons.length

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-heading-3 flex items-center gap-2">
            <BookOpen className="text-neon-blue" size={24} />
            Learning Hub
          </h3>
          <p className="text-sm text-gray-400 mt-1">Level up your trading skills</p>
        </div>
      </div>

      {/* User Progress */}
      <div className="glass-strong p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-400">Level {userLevel}</div>
            <div className="text-2xl font-bold gradient-text">Trader in Training</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Progress</div>
            <div className="text-lg font-bold text-neon-blue">{completedCount}/{totalCount}</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{userXP} XP</span>
            <span>{maxXP} XP</span>
          </div>
          <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(userXP / maxXP) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-neon-blue to-electric-purple rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <TrendingUp size={14} className="text-green-400" />
          <span>{maxXP - userXP} XP to Level {userLevel + 1}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                : 'glass hover:glass-strong'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
        {filteredLessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`glass-strong p-4 rounded-lg transition-all ${
              lesson.locked ? 'opacity-50' : 'hover:glass cursor-pointer group'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                lesson.completed ? 'bg-green-500/20' : 
                lesson.locked ? 'bg-gray-500/20' : 
                'bg-neon-blue/20'
              }`}>
                {lesson.completed ? (
                  <CheckCircle className="text-green-400" size={24} />
                ) : lesson.locked ? (
                  <Lock className="text-gray-400" size={24} />
                ) : (
                  <Play className="text-neon-blue" size={24} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium line-clamp-1">{lesson.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getDifficultyColor(lesson.difficulty)}`}>
                      {lesson.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{lesson.description}</p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-gray-400">
                    <span>⏱️ {lesson.duration} min</span>
                    <span>📁 {lesson.category}</span>
                    <span className="text-neon-blue">+{lesson.xp} XP</span>
                  </div>
                  {!lesson.locked && !lesson.completed && (
                    <button className="px-3 py-1 rounded-lg bg-neon-blue/20 text-neon-blue text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Start Learning
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Award className="text-electric-purple" size={16} />
          Achievements
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-strong p-3 rounded-lg text-center ${
                achievement.unlocked ? 'border border-electric-purple/30' : 'opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{achievement.icon}</div>
              <div className="text-xs font-medium mb-1">{achievement.title}</div>
              <div className="text-xs text-gray-400">{achievement.description}</div>
              {achievement.unlocked && (
                <div className="text-xs text-electric-purple mt-1">+{achievement.xp} XP</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
