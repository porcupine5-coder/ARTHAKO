import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/apiClient'

type Company = { symbol: string; name: string }

export default function CompanySearch() {
  const [list, setList] = useState<Company[]>([])
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch('/companies').then(r => r.json()).then(b => setList(b?.companies || [])).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return list.slice(0, 10)
    return list.filter(c => c.symbol.toLowerCase().includes(s) || c.name.toLowerCase().includes(s)).slice(0, 10)
  }, [q, list])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded border bg-transparent"
          placeholder="Search symbol or name"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      <div className="mt-3 grid">
        {filtered.map(c => (
          <button
            key={c.symbol}
            className="text-left px-3 py-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-900"
            onClick={() => navigate(`/companies/${c.symbol}`)}
          >
            <div className="font-medium">{c.symbol}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">{c.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
