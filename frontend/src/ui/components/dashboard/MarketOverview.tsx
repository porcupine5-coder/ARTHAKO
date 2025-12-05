export default function MarketOverview() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid gap-2">
        <h2 className="text-2xl font-semibold">Market Overview</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-4 rounded border">Index: —</div>
          <div className="p-4 rounded border">Adv/Dec: —/—</div>
          <div className="p-4 rounded border">Volume: —</div>
        </div>
      </div>
    </section>
  )
}
