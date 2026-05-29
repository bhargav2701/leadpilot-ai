export default function AnalyticsLoading() {
  return (
    <main className="min-h-screen bg-black p-6 text-white lg:pl-80">
      <div className="mx-auto max-w-7xl animate-pulse py-8">
        <div className="h-5 w-28 rounded bg-orange-500/30" />
        <div className="mt-5 h-12 w-80 max-w-full rounded bg-white/10" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div className="h-32 rounded-xl bg-zinc-950" key={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
