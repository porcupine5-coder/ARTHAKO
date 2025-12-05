export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'

interface TimeRangeSelectorProps {
  selected: TimeRange
  onChange: (range: TimeRange) => void
}

export default function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  const ranges: TimeRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']

  return (
    <div className="flex items-center gap-1 p-1 glass rounded-lg">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            selected === range
              ? 'bg-neon-blue/20 text-neon-blue'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/5'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  )
}