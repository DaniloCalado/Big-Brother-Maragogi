type BBGMarkProps = {
  subtitle?: string;
  className?: string;
};

export function BBGMark({
  subtitle = "Big Brother Maragogi",
  className,
}: BBGMarkProps) {
  return (
    <div
      className={`flex flex-col items-center text-center ${className ?? ""}`}
    >
      <div className="relative size-28 sm:size-32">
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bbgRing" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#fbbf24" />
              <stop offset="0.45" stopColor="#f97316" />
              <stop offset="0.75" stopColor="#a855f7" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
            <radialGradient id="bbgCore" cx="50%" cy="45%" r="60%">
              <stop offset="0" stopColor="#0b0b0b" />
              <stop offset="1" stopColor="#000000" />
            </radialGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#bbgRing)"
            strokeWidth="10"
          />
          <circle cx="60" cy="60" r="40" fill="url(#bbgCore)" />
          <circle
            cx="60"
            cy="60"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="8"
          />
          <circle cx="72" cy="52" r="8" fill="rgba(255,255,255,0.12)" />
        </svg>
        <div className="relative flex h-full w-full items-center justify-center">
          <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            BBM
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
