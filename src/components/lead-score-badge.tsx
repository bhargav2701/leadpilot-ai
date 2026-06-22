import type { LeadTemperature } from "@/types/lead";

type LeadScoreBadgeProps = {
  score?: number | null;
  temperature?: LeadTemperature | string | null;
};

function getTemperature(score: number, temperature?: string | null) {
  if (temperature) {
    return temperature;
  }

  if (score >= 75) {
    return "Hot";
  }

  if (score >= 40) {
    return "Warm";
  }

  return "Cold";
}

export function LeadScoreBadge({ score, temperature }: LeadScoreBadgeProps) {
  const safeScore = score ?? 0;
  const safeTemperature = getTemperature(safeScore, temperature);
  const styles =
    safeTemperature === "Hot"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : safeTemperature === "Warm"
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
        : "border-sky-500/30 bg-sky-500/10 text-sky-200";
  const icon = safeTemperature === "Hot" ? "🔥" : safeTemperature === "Warm" ? "🟡" : "🔵";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-sm font-black ${styles}`}
    >
      <span>{safeScore}</span>
      <span>{icon}</span>
      <span>{safeTemperature}</span>
    </span>
  );
}
