import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface Indicator {
  id: string
  name: string
  enabled: boolean
  color: string
  params?: Record<string, number>
}

interface IndicatorPanelProps {
  indicators: Indicator[]
  onToggle: (id: string) => void
  onParamChange?: (id: string, param: string, value: number) => void
}

export default function IndicatorPanel({ indicators, onToggle, onParamChange }: IndicatorPanelProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors duration-200"
      >
        <span className="text-sm font-medium">Technical Indicators</span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/10">
          {indicators.map((indicator) => (
            <div key={indicator.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`indicator-${indicator.id}`}
                  aria-label={`Toggle ${indicator.name}`}
                  checked={indicator.enabled}
                  onChange={() => onToggle(indicator.id)}
                  className="w-4 h-4 rounded border-gray-300 text-neon-blue focus:ring-neon-blue"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: indicator.color }}
                  />
                  <label htmlFor={`indicator-${indicator.id}`} className="text-sm cursor-pointer">{indicator.name}</label>
                </div>
              </div>
              {indicator.params && onParamChange && (
                <div className="flex items-center gap-2">
                  {Object.entries(indicator.params).map(([key, value]) => (
                    <input
                      key={key}
                      type="number"
                      value={value}
                      aria-label={`${indicator.name} ${key} parameter`}
                      onChange={(e) => onParamChange(indicator.id, key, Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded"
                      disabled={!indicator.enabled}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}