import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Text } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { X } from 'lucide-react'

interface SectorData {
  name: string
  performance: number // -100 to 100
  marketCap: number
  companies: Array<{
    symbol: string
    name: string
    change: number
  }>
  position: [number, number, number]
}

function SectorNode({ 
  sector, 
  onClick, 
  isHovered, 
  onHover 
}: { 
  sector: SectorData
  onClick: () => void
  isHovered: boolean
  onHover: (hover: boolean) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = sector.position[1] + Math.sin(state.clock.elapsedTime + sector.position[0]) * 0.1
      
      // Rotate slowly
      meshRef.current.rotation.y += 0.005
      
      // Scale on hover
      const targetScale = isHovered || hovered ? 1.3 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
  })
  
  // Color based on performance
  const getColor = () => {
    if (sector.performance > 5) return '#10b981'
    if (sector.performance < -5) return '#ef4444'
    return '#f59e0b'
  }
  
  // Size based on market cap
  const size = 0.3 + (sector.marketCap / 100000000000) * 0.5
  
  return (
    <group position={sector.position}>
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={onClick}
        onPointerOver={() => {
          setHovered(true)
          onHover(true)
        }}
        onPointerOut={() => {
          setHovered(false)
          onHover(false)
        }}
      >
        <meshStandardMaterial
          color={getColor()}
          emissive={getColor()}
          emissiveIntensity={isHovered || hovered ? 0.8 : 0.3}
          transparent
          opacity={0.9}
        />
      </Sphere>
      
      {/* Sector label */}
      {(isHovered || hovered) && (
        <Text
          position={[0, size + 0.3, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {sector.name}
        </Text>
      )}
      
      {/* Performance indicator */}
      {(isHovered || hovered) && (
        <Text
          position={[0, size + 0.5, 0]}
          fontSize={0.15}
          color={getColor()}
          anchorX="center"
          anchorY="middle"
        >
          {sector.performance > 0 ? '+' : ''}{sector.performance.toFixed(1)}%
        </Text>
      )}
    </group>
  )
}

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001
    }
  })
  
  return (
    <Sphere ref={globeRef} args={[2, 64, 64]}>
      <meshStandardMaterial
        color="#0f172a"
        wireframe
        transparent
        opacity={0.1}
      />
    </Sphere>
  )
}

export default function MarketMap3D() {
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null)
  const [hoveredSector, setHoveredSector] = useState<string | null>(null)
  
  const sectors: SectorData[] = useMemo(() => [
    {
      name: 'Banking',
      performance: 8.5,
      marketCap: 450000000000,
      companies: [
        { symbol: 'NABIL', name: 'Nabil Bank', change: 12.3 },
        { symbol: 'SCB', name: 'Standard Chartered', change: 8.7 },
        { symbol: 'HBL', name: 'Himalayan Bank', change: 6.2 },
      ],
      position: [3, 0, 0]
    },
    {
      name: 'Hydropower',
      performance: 15.2,
      marketCap: 280000000000,
      companies: [
        { symbol: 'UPPER', name: 'Upper Tamakoshi', change: 18.5 },
        { symbol: 'CHCL', name: 'Chilime Hydro', change: 14.2 },
        { symbol: 'NHPC', name: 'National Hydro', change: 12.8 },
      ],
      position: [2.1, 2.1, 0]
    },
    {
      name: 'Insurance',
      performance: -3.2,
      marketCap: 180000000000,
      companies: [
        { symbol: 'NLIC', name: 'Nepal Life', change: -2.1 },
        { symbol: 'NICL', name: 'Nepal Insurance', change: -4.5 },
        { symbol: 'PRIN', name: 'Prime Insurance', change: -2.8 },
      ],
      position: [0, 3, 0]
    },
    {
      name: 'Finance',
      performance: 4.8,
      marketCap: 120000000000,
      companies: [
        { symbol: 'GFIL', name: 'Goodwill Finance', change: 5.2 },
        { symbol: 'CFCL', name: 'Central Finance', change: 4.8 },
        { symbol: 'GUFL', name: 'Gurkhas Finance', change: 4.3 },
      ],
      position: [-2.1, 2.1, 0]
    },
    {
      name: 'Hotels',
      performance: -1.5,
      marketCap: 80000000000,
      companies: [
        { symbol: 'OHL', name: 'Oriental Hotels', change: -0.8 },
        { symbol: 'SHL', name: 'Soaltee Hotel', change: -2.3 },
        { symbol: 'TRHPR', name: 'Taragaon Regency', change: -1.4 },
      ],
      position: [-3, 0, 0]
    },
    {
      name: 'Manufacturing',
      performance: 6.3,
      marketCap: 200000000000,
      companies: [
        { symbol: 'UNL', name: 'Unilever Nepal', change: 8.2 },
        { symbol: 'BBC', name: 'Bottlers Nepal', change: 5.1 },
        { symbol: 'SONA', name: 'Sonapur Minerals', change: 5.6 },
      ],
      position: [-2.1, -2.1, 0]
    },
    {
      name: 'Microfinance',
      performance: 2.1,
      marketCap: 60000000000,
      companies: [
        { symbol: 'SMFDB', name: 'Swabalamban MF', change: 2.5 },
        { symbol: 'MSMBS', name: 'Mahuli Samudayik', change: 1.8 },
        { symbol: 'SMFBS', name: 'Summit MF', change: 2.0 },
      ],
      position: [0, -3, 0]
    },
    {
      name: 'Development Banks',
      performance: 3.7,
      marketCap: 95000000000,
      companies: [
        { symbol: 'SHINE', name: 'Shine Resunga', change: 4.2 },
        { symbol: 'MNBBL', name: 'Muktinath Bikas', change: 3.5 },
        { symbol: 'KSBBL', name: 'Kamana Sewa', change: 3.4 },
      ],
      position: [2.1, -2.1, 0]
    },
  ], [])
  
  return (
    <div className="glass p-6 rounded-xl">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-heading-3 mb-2">Interactive Market Map</h3>
        <p className="text-sm text-gray-400">
          Explore sectors in 3D • Size = Market Cap • Color = Performance
        </p>
      </div>
      
      {/* 3D Canvas */}
      <div className="h-96 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#A855F7" />
          
          <Globe />
          
          {sectors.map((sector) => (
            <SectorNode
              key={sector.name}
              sector={sector}
              onClick={() => setSelectedSector(sector)}
              isHovered={hoveredSector === sector.name}
              onHover={(hover) => setHoveredSector(hover ? sector.name : null)}
            />
          ))}
          
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={5}
            maxDistance={15}
          />
        </Canvas>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Negative</span>
          </div>
        </div>
        <span className="text-gray-500">Click to explore • Drag to rotate</span>
      </div>
      
      {/* Sector Detail Modal */}
      <AnimatePresence>
        {selectedSector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSector(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass p-6 rounded-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-heading-3">{selectedSector.name}</h3>
                  <p className="text-sm text-gray-400">
                    Market Cap: NPR {(selectedSector.marketCap / 1000000000).toFixed(2)}B
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSector(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Performance */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Sector Performance</div>
                <div className={`text-3xl font-bold ${
                  selectedSector.performance > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {selectedSector.performance > 0 ? '+' : ''}{selectedSector.performance.toFixed(2)}%
                </div>
              </div>
              
              {/* Top Companies */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Top Companies</h4>
                <div className="space-y-2">
                  {selectedSector.companies.map((company, index) => (
                    <motion.div
                      key={company.symbol}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <div className="font-semibold">{company.symbol}</div>
                        <div className="text-xs text-gray-400">{company.name}</div>
                      </div>
                      <div className={`font-bold ${
                        company.change > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {company.change > 0 ? '+' : ''}{company.change.toFixed(2)}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}