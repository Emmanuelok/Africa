export default function Loading() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-32 md:px-6">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-ping rounded-full bg-terracotta-500 opacity-30" />
          <div className="relative grid h-10 w-10 place-items-center rounded-full bg-terracotta-600">
            <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-600">Loading…</p>
      </div>
    </div>
  );
}
