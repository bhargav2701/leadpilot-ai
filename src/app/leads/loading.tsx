export default function LeadsLoading() {
  return (
    <main className="min-h-screen bg-black p-6 text-white lg:pl-80">
      <div className="mx-auto max-w-7xl animate-pulse py-8">
        <div className="h-5 w-24 rounded bg-orange-500/30" />
        <div className="mt-5 h-12 w-80 max-w-full rounded bg-white/10" />
        <div className="mt-8 h-20 rounded-xl bg-zinc-950" />
        <div className="mt-6 h-96 rounded-xl bg-zinc-950" />
      </div>
    </main>
  );
}
