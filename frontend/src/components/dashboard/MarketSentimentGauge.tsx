import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text3D, Center } from '@react-three/drei'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, X } from 'lucide-react'
import * as THREE from 'three'

interface SentimentData {
  value: number // -100 to 100
  label: string
  confidence: number
  drivers: Array<{
    factor: string
    impact: number
    description: string
  }>
}

function AnimatedGauge({ value }: { value: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const needleRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02
    }
    
    if (needleRef.current) {
      // Rotate needle based on sentiment value (-100 to 100 maps to -90 to 90 degrees)
      const targetRotation = (value / 100) * (Math.PI / 2)
      needleRef.current.rotation.z += (targetRotation - needleRef.current.rotation.z) * 0.05
    }
  })
  
  // Color based on sentiment
  const getColor = (val: number) => {
    if (val > 30) return '#10b981' // Green
    if (val < -30) return '#ef4444' // Red
    return '#f59e0b' // Yellow
  }
  
  return (
    <group>
      {/* Gauge background arc */}
      <mesh ref={meshRef}>
        <torusGeometry args={[2, 0.1, 16, 100, Math.PI]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      
      {/* Colored gauge fill */}
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[2, 0.12, 16, 100, (value + 100) / 200 * Math.PI]} />
        <meshStandardMaterial color={getColor(value)} emissive={getColor(value)} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Needle */}
      <mesh ref={needleRef} position={[0, 0, 0.1]}>
        <boxGeometry args={[0.05, 1.8, 0.05]} />
        <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={0.8} />
      </mesh>
      
      {/* Center pivot */}
      <mesh position={[0, 0, 0.15]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={1} />
      </mesh>
      
      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#A855F7" />
    </group>
  )
}

export default function MarketSentimentGauge() {
  const [sentimentData, setSentimentData] = useState<SentimentData>({
    value: 45,
    label: 'Bullish',
    confidence: 87,
    drivers: [
      { factor: 'Strong Banking Sector', impact: 35, description: 'Commercial banks showing robust growth' },
      { factor: 'Hydropower Momentum', impact: 28, description: 'Renewable energy stocks gaining traction' },
      { factor: 'Market Volume', impact: 24, description: 'Above-average trading activity' },
      { factor: 'Foreign Investment', impact: 13, description: 'Increased foreign institutional interest' },
    ]
  })
  const [showDrivers, setShowDrivers] = useState(false)
  
  useEffect(() => {
    // Fetch real sentiment data
    const fetchSentiment = async () => {
      try {
        // This would call your AI service
        // const response = await fetch('http://localhost:8000/market/sentiment')
        // const data = await response.json()
        // setSentimentData(data)
      } catch (error) {
        console.error('Failed to fetch sentiment:', error)
      }
    }
    
    fetchSentiment()
    const interval = setInterval(fetchSentiment, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  const getSentimentIcon = () => {
    if (sentimentData.value > 30) return TrendingUp
    if (sentimentData.value < -30) return TrendingDown
    return Activity
  }
  
  const SentimentIcon = getSentimentIcon()
  
  return (
    <div className="glass p-6 rounded-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-electric-purple flex items-center justify-center">
            <SentimentIcon className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-heading-4">Market Sentiment</h3>
            <p className="text-xs text-gray-500">AI-Powered Analysis</p>
          </div>
        </div>
        <button
          onClick={() => setShowDrivers(true)}
          className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          View Drivers
        </button>
      </div>
      
      {/* 3D Gauge */}
      <div className="h-64 -mx-6">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <AnimatedGauge value={sentimentData.value} />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>
      
      {/* Sentiment Info */}
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold gradient-text mb-2">
          {sentimentData.label}
        </div>
        <div className="text-sm text-gray-400">
          Confidence: {sentimentData.confidence}%
        </div>
        
        {/* Sentiment Scale */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-red-500">Bearish</span>
          <span className="text-yellow-500">Neutral</span>
          <span className="text-green-500">Bullish</span>
        </div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="flex-1 bg-gradient-to-r from-red-500 to-yellow-500" />
            <div className="flex-1 bg-gradient-to-r from-yellow-500 to-green-500" />
          </div>
          <div 
            className="h-full w-1 bg-white relative -mt-2 transition-all duration-500"
            style={{ marginLeft: `${((sentimentData.value + 100) / 200) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Drivers Modal */}
      {showDrivers && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDrivers(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass p-6 rounded-xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-heading-3">Top Sentiment Drivers</h3>
              <button
                onClick={() => setShowDrivers(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {sentimentData.drivers.map((driver, index) => (
                <motion.div
                  key={driver.factor}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{driver.factor}</span>
                    <span className="text-neon-blue font-bold">{driver.impact}%</span>
                  </div>
                  <p className="text-sm text-gray-400">{driver.description}</p>
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${driver.impact}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-neon-blue to-electric-purple"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}