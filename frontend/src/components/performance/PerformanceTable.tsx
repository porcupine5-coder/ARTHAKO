import { TrendingUp, TrendingDown } from 'lucide-react'

interface PerformanceData {
  period: string
  return: number
  high: number
  low: number
  volatility: number
}

interface PerformanceTableProps {
  data?: PerformanceData[]
}

export default function PerformanceTable({ data }: PerformanceTableProps) {
  const mockData: PerformanceData[] = data || [
    { period: '1 Day', return: 1.2, high: 2150, low: 2100, volatility: 2.3 },
    { period: '1 Week', return: 2.5, high: 2180, low: 2050, volatility: 3.1 },
    { period: '1 Month', return: 5.8, high: 2200, low: 1980, volatility: 4.5 },
    { period: '3 Months', return: -1.2, high: 2250, low: 1900, volatility: 6.2 },
    { period: '6 Months', return: 8.4, high: 2300, low: 1850, volatility: 7.8 },
    { period: '1 Year', return: 15.6, high: 2400, low: 1750, volatility: 9.1 },
  ]

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-heading-3 mb-4">Historical Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Period</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Return</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">High</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Low</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Volatility</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                <td className="py-3 px-4 text-sm font-medium">{row.period}</td>
                <td className="py-3 px-4 text-right">
                  <div className={`flex items-center justify-end gap-1 ${row.return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {row.return >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span className="font-semibold">{row.return >= 0 ? '+' : ''}{row.return.toFixed(2)}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-sm">NPR {row.high.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-sm">NPR {row.low.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-sm">{row.volatility.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}