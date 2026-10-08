/** Skeleton com as dimensões do conteúdo real (CLS ≈ 0). */
export function QuoteSummarySkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="flex h-12 items-center justify-between gap-4">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-5 w-24" />
        </div>
      ))}
      <hr className="border-border" />
      {['w-20', 'w-16', 'w-28'].map((w) => (
        <div key={w} className="flex h-6 items-center justify-between">
          <div className={`skeleton h-4 ${w}`} />
          <div className="skeleton h-4 w-24" />
        </div>
      ))}
      <div className="flex h-8 items-center justify-between pt-2">
        <div className="skeleton h-6 w-16" />
        <div className="skeleton h-6 w-32" />
      </div>
    </div>
  )
}
