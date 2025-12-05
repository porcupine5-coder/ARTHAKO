import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, BarChart3 } from 'lucide-react'

import AIPredictionPanelEnhanced from '../../components/dashboard/AIPredictionPanelEnhanced'
import SectorHeatmap from '../../components/dashboard/SectorHeatmap'
import AIInsightsFeed from '../../components/dashboard/AIInsightsFeed'
import MacroIndicators from '../../components/dashboard/MacroIndicators'
import TopMovers from '../../components/dashboard/TopMovers'
import ErrorBoundary from '../../components/common/ErrorBoundary'

export default function ProfessionalDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7day' | '30day' | '90day' | '180day' | '365day'>('30day')

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-dark-bg via-dark-bg/95 to-dark-bg">
      <div className="max-w-[1920px] mx-auto">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue via-electric-purple to-neon-blue bg-[length:200%_200%] animate-gradient flex items-center justify-center shadow-lg shadow-electric-purple/50">
                  <BarChart3 className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-neon-blue via-electric-purple to-neon-blue bg-clip-text text-transparent">
                    Professional Dashboard
                  </h1>
                  <p className="text-gray-400 mt-1">
                    AI-powered insights • Real-time analytics • Advanced predictions
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-400">Market Open</span>
                </div>
              </div>

              {/* Time Period Selector */}
              <div className="flex gap-2">
                {(['7day', '30day', '90day', '180day', '365day'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedPeriod === period
                      ? 'bg-neon-blue/20 text-neon-blue border-2 border-neon-blue/50'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                  >
                    {period === '7day' ? '7D' : period === '30day' ? '30D' : period === '90day' ? '90D' : period === '180day' ? '180D' : '1Y'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-30 rounded-full"></div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="space-y-6">
          {/* Row 1: Portfolio Overview (Full Width) */}


          {/* Row 2: Macro Indicators (Full Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ErrorBoundary>
              <MacroIndicators selectedPeriod={selectedPeriod} />
            </ErrorBoundary>
          </motion.div>

          {/* Row 3: AI Prediction + AI Insights */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ErrorBoundary>
                <AIPredictionPanelEnhanced selectedPeriod={selectedPeriod} />
              </ErrorBoundary>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ErrorBoundary>
                <AIInsightsFeed selectedPeriod={selectedPeriod} />
              </ErrorBoundary>
            </motion.div>
          </div>

          {/* Row 4: Sector Heatmap (Full Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ErrorBoundary>
              <SectorHeatmap selectedPeriod={selectedPeriod} />
            </ErrorBoundary>
          </motion.div>

          {/* Row 5: Top Movers (Full Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ErrorBoundary>
              <TopMovers selectedPeriod={selectedPeriod} />
            </ErrorBoundary>
          </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 mb-6"
        >
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="text-electric-purple" size={20} />
                <div>
                  <p className="text-sm font-medium">Powered by Advanced AI Models</p>
                  <p className="text-xs text-gray-500">Prophet • LSTM • XGBoost • Ensemble Learning</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                <p>Data refreshes automatically</p>
                <p>Last sync: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}
