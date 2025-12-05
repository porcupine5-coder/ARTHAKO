import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, Activity, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const priceData = useMemo(
    () => [
      { date: '2025-01-01', close: 2100, volume: 45000000 },
      { date: '2025-01-02', close: 2104, volume: 52000000 },
      { date: '2025-01-03', close: 2102, volume: 48000000 },
      { date: '2025-01-04', close: 2108, volume: 55000000 },
      { date: '2025-01-05', close: 2111, volume: 58000000 },
      { date: '2025-01-06', close: 2109, volume: 51000000 },
      { date: '2025-01-07', close: 2115, volume: 62000000 }
    ],
    []
  )

  const sectorData = useMemo(
    () => [
      { name: 'Banking', value: 35, color: '#00F5FF' },
      { name: 'Insurance', value: 20, color: '#A855F7' },
      { name: 'Hydropower', value: 25, color: '#10b981' },
      { name: 'Others', value: 20, color: '#f59e0b' },
    ],
    []
  )

  const stats = [
    { label: 'Portfolio Value', value: 'NPR 2.5M', change: '+12.5%', icon: DollarSign, color: 'text-green-500' },
    { label: 'Total Gain', value: 'NPR 285K', change: '+8.2%', icon: TrendingUp, color: 'text-neon-blue' },
    { label: 'Active Stocks', value: '12', change: '+2', icon: Activity, color: 'text-electric-purple' },
    { label: 'Watchlist', value: '24', change: '+5', icon: Users, color: 'text-yellow-500' },
  ]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-heading-1 mb-8">Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass p-6 rounded-xl hover:glass-strong transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-body-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                  <stat.icon className={stat.color} size={20} />
                </div>
                <div className="text-heading-2 mb-2">{stat.value}</div>
                <div className={`text-sm ${stat.color}`}>{stat.change}</div>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Price Chart */}
            <div className="lg:col-span-2 glass p-6 rounded-xl">
              <h3 className="text-heading-3 mb-6">NEPSE Index (7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(11, 17, 32, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="close" stroke="#00F5FF" strokeWidth={2} fill="url(#colorClose)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sector Distribution */}
            <div className="glass p-6 rounded-xl">
              <h3 className="text-heading-3 mb-6">Portfolio Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {sectorData.map((sector) => (
                  <div key={sector.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: sector.color }}
                      />
                      <span>{sector.name}</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">{sector.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="glass p-6 rounded-xl">
            <h3 className="text-heading-3 mb-6">Trading Volume</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(11, 17, 32, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="volume" fill="#A855F7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
