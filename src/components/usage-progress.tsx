import { formatLimit, usagePercent } from "@/lib/billing/subscription";

type UsageProgressProps = {
  label: string;
  limit: number;
  used: number;
};

export function UsageProgress({ label, limit, used }: UsageProgressProps) {
  const percent = usagePercent(used, limit);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-bold text-zinc-200">{label}</p>
        <p className="font-semibold text-zinc-400">
          {used} / {formatLimit(limit)}
        </p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-black">
        <div
          className="h-full rounded-full bg-orange-500 transition-all"
          style={{ width: limit < 0 ? "100%" : `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
        {limit < 0 ? "Unlimited" : `${percent}% used`}
      </p>
    </div>
  );
}
