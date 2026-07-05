// Instant skeleton while the dashboard's Azure queries resolve, so the user
// sees structure immediately instead of a blank pane.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-md bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="swiss-card h-28 p-5">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-6 h-8 w-16 rounded-md bg-muted" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="swiss-card h-44 p-5">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="mt-3 h-3 w-40 rounded bg-muted" />
              <div className="mt-8 h-1.5 w-full rounded-full bg-muted" />
              <div className="mt-6 h-3 w-48 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
