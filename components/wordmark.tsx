/**
 * The mark: two overlapping rings — a circle you are inside of. Drawn rather
 * than set in type so it holds up small, in a favicon, and on a dark header.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9.5" cy="12" r="6.75" stroke="#D8A657" strokeWidth="1.4" />
        <circle cx="14.5" cy="12" r="6.75" stroke="#F2EEE6" strokeWidth="1.4" opacity="0.55" />
      </svg>
      <span className="font-display text-[21px] leading-none tracking-tight text-bone">
        Circle<span className="text-gold">In</span>
      </span>
    </span>
  )
}
