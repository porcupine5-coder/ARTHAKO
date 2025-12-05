export default function LiquidBlobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30 bg-indigo-400/40 dark:bg-indigo-600/30" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30 bg-emerald-400/40 dark:bg-emerald-600/30" />
    </div>
  )
}
