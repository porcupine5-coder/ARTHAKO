import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Sphere, Cone } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { TreePine, TrendingUp, TrendingDown } from 'lucide-react'

interface Stock {
  symbol: string
  sector: string
  value: number
  change: number
  color: string
}

const portfolioData: Stock[] = [
  { symbol: 'NABIL', sector: 'Banking', value: 850000, change: 12.5, color: '#00F5FF' },
  { symbol: 'NICA', sector: 'Banking', value: 650000, change: 8.2, color: '#0EA5E9' },
  { symbol: 'HDL', sector: 'Hydropower', value: 420000, change: -2.3, color: '#10b981' },
  { symbol: 'UPPER', sector: 'Hydropower', value: 380000, change: 15.7, color: '#059669' },
  { symbol: 'NLIC', sector: 'Insurance', value: 320000, change: 5.4, color: '#A855F7' },
  { symbol: 'SANIMA', sector: 'Insurance', value: 280000, change: -1.2, color: '#9333EA' },
  { symbol: 'SCB', sector: 'Banking', value: 520000, change: 9.8, color: '#06B6D4' },
  { symbol: 'EBL', sector: 'Banking', value: 470000, change: 6.3, color: '#0891B2' }
]

function Fruit({ position, stock }: { position: [number, number, number]; stock: Stock }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.001
      if (hovered) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1)
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      }
    }
  })

  const size = Math.max(0.1, (stock.value / 1000000) * 0.5)
  const isPositive = stock.change > 0

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 16, 16]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={stock.color}
          emissive={stock.color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      {hovered && (
        <Text
          position={[0, size + 0.3, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {stock.symbol}{'\n'}NPR {(stock.value / 1000).toFixed(0)}K{'\n'}
          {isPositive ? '+' : ''}{stock.change.toFixed(1)}%
        </Text>
      )}
    </group>
  )
}

function Branch({ start, end, thickness = 0.05 }: { start: [number, number, number]; end: [number, number, number]; thickness?: number }) {
  const direction = new THREE.Vector3(...end).sub(new THREE.Vector3(...start))
  const length = direction.length()
  const midpoint = new THREE.Vector3(...start).add(direction.multiplyScalar(0.5))

  return (
    <Cone
      args={[thickness, length, 8]}
      position={[midpoint.x, midpoint.y, midpoint.z]}
      rotation={[Math.PI / 2, 0, Math.atan2(direction.x, direction.y)]}
    >
      <meshStandardMaterial color="#8B4513" roughness={0.8} />
    </Cone>
  )
}

function Tree3D() {
  const sectors = {
    Banking: portfolioData.filter(s => s.sector === 'Banking'),
    Hydropower: portfolioData.filter(s => s.sector === 'Hydropower'),
    Insurance: portfolioData.filter(s => s.sector === 'Insurance')
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Trunk */}
      <Cone args={[0.15, 2, 8]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#654321" roughness={0.9} />
      </Cone>

      {/* Banking Branch (Right) */}
      <Branch start={[0, 1, 0]} end={[1.5, 1.8, 0]} thickness={0.08} />
      {sectors.Banking.map((stock, idx) => (
        <Fruit
          key={stock.symbol}
          position={[1.5 + Math.cos(idx) * 0.4, 1.8 + idx * 0.3, Math.sin(idx) * 0.4]}
          stock={stock}
        />
      ))}

      {/* Hydropower Branch (Left) */}
      <Branch start={[0, 1.2, 0]} end={[-1.5, 2, 0]} thickness={0.08} />
      {sectors.Hydropower.map((stock, idx) => (
        <Fruit
          key={stock.symbol}
          position={[-1.5 + Math.cos(idx + 3) * 0.4, 2 + idx * 0.3, Math.sin(idx + 3) * 0.4]}
          stock={stock}
        />
      ))}

      {/* Insurance Branch (Center Top) */}
      <Branch start={[0, 1.5, 0]} end={[0, 2.5, 0]} thickness={0.08} />
      {sectors.Insurance.map((stock, idx) => (
        <Fruit
          key={stock.symbol}
          position={[Math.cos(idx + 6) * 0.4, 2.5 + idx * 0.3, Math.sin(idx + 6) * 0.4]}
          stock={stock}
        />
      ))}

      <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
    </>
  )
}

export default function PortfolioTree() {
  const totalValue = portfolioData.reduce((sum, s) => sum + s.value, 0)
  const totalChange = portfolioData.reduce((sum, s) => sum + s.change, 0) / portfolioData.length

  return (
    <div className="glass p-6 rounded-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading-3 flex items-center gap-2">
            <TreePine className="text-green-500" size={24} />
            Portfolio Tree
          </h3>
          <p className="text-sm text-gray-400 mt-1">Your investments growing</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">NPR {(totalValue / 1000000).toFixed(2)}M</div>
          <div className={`flex items-center gap-1 text-sm ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="h-96 rounded-lg overflow-hidden bg-gradient-to-b from-sky-900/20 to-green-900/20">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <Tree3D />
        </Canvas>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="glass-strong p-3 rounded-lg text-center"
        >
          <div className="text-xs text-gray-400 mb-1">Banking</div>
          <div className="text-sm font-bold text-neon-blue">
            {portfolioData.filter(s => s.sector === 'Banking').length} stocks
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="glass-strong p-3 rounded-lg text-center"
        >
          <div className="text-xs text-gray-400 mb-1">Hydropower</div>
          <div className="text-sm font-bold text-green-400">
            {portfolioData.filter(s => s.sector === 'Hydropower').length} stocks
          </div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="glass-strong p-3 rounded-lg text-center"
        >
          <div className="text-xs text-gray-400 mb-1">Insurance</div>
          <div className="text-sm font-bold text-electric-purple">
            {portfolioData.filter(s => s.sector === 'Insurance').length} stocks
          </div>
        </motion.div>
      </div>
    </div>
  )
}
