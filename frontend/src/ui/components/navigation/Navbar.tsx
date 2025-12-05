import { Link } from 'react-router-dom'

export default function Navbar({ sessionEmail, onSignOut, dark, onToggleDark }: {
  sessionEmail: string
  onSignOut: () => Promise<void> | void
  dark: boolean
  onToggleDark: () => void
}) {
  return (
    <header className="p-4 sticky top-0 z-20 bg-white/70 dark:bg-[#0B1120]/80 backdrop-blur border-b flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link className="font-semibold" to="/">NEPSE Future AI</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="hover:underline" to="/">Home</Link>
          <Link className="hover:underline" to="/dashboard">Dashboard</Link>
          <Link className="hover:underline" to="/companies">Companies</Link>
          <Link className="hover:underline" to="/account">Account</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {sessionEmail ? <span className="text-sm">{sessionEmail}</span> : <span className="text-sm text-gray-500">Not signed in</span>}
        <button className="px-3 py-1 rounded border" onClick={onToggleDark}>
          Toggle {dark ? 'Light' : 'Dark'}
        </button>
        <button className="px-3 py-1 rounded border" onClick={() => void onSignOut()}>Sign out</button>
      </div>
    </header>
  )
}
