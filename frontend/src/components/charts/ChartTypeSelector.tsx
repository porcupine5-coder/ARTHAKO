import { BarChart3, LineChart, CandlestickChart, AreaChart } from 'lucide-react'

export type ChartType = 'line' | 'candlestick' | 'area' | 'bar'

interface ChartTypeSelectorProps {
  selected: ChartType
  onChange: (type: ChartType) => void
}

export default function ChartTypeSelector({ selected, onChange }: ChartTypeSelectorProps) {
  const types: { type: ChartType; icon: typeof LineChart; label: string }[] = [
    { type: 'line', icon: LineChart, label: 'Line' },
    { type: 'candlestick', icon: CandlestickChart, label: 'Candlestick' },
    { type: 'area', icon: AreaChart, label: 'Area' },
    { type: 'bar', icon: BarChart3, label: 'Bar' },
  ]

  return (
    <div className="flex items-center gap-2 p-1 glass rounded-lg">
      {types.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
            selected === type
              ? 'bg-neon-blue/20 text-neon-blue'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/5'
          }`}
          title={label}
        >
          <Icon size={18} />
          <span className="text-sm hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}