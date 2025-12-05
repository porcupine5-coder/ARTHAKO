export default function FloatingBubbles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute top-10 left-1/4 h-16 w-16 rounded-full blur-2xl opacity-30 bg-sky-400/30 animate-pulse" />
      <div className="absolute bottom-20 right-1/3 h-20 w-20 rounded-full blur-2xl opacity-30 bg-fuchsia-400/30 animate-pulse" />
    </div>
  )
}
