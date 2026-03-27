type BBGMarkProps = {
  subtitle?: string;
  className?: string;
};

export function BBGMark({
  subtitle = "Big Brother Enseada",
  className,
}: BBGMarkProps) {
  return (
    <div className={`flex flex-col items-center text-center ${className ?? ""}`}>
      <div className="relative size-28 sm:size-32">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,#fbbf24,#f97316,#a855f7,#22d3ee,#fbbf24)]" />
        <div className="absolute inset-[12px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a3a3a_0%,#232323_45%,#141414_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
        <div className="absolute inset-[18px] rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
        <div className="absolute inset-[18px] rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_22%,rgba(0,0,0,0.00)_58%),radial-gradient(circle_at_50%_72%,#0b0b0b_0%,#000000_70%)]" />
        <div className="absolute inset-[30px] rounded-full border-[8px] border-white/15" />
        <div className="absolute inset-[44px] rounded-full border border-white/10 opacity-60" />
        <div className="relative grid h-full w-full place-items-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
          <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            BBE
          </span>
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
        {subtitle}
      </div>
    </div>
  );
}
