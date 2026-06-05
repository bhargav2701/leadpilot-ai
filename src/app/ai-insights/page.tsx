import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import type { Lead, LeadStatus } from "@/types/lead";
import { leadTemperatures } from "@/types/lead";
import { AIInsightsCharts } from "./ai-insights-charts";

const pipelineStages = ["New", "Qualified", "Proposal", "Won", "Lost"] satisfies LeadStatus[];

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

function getSourceName(source: string | null) {
  return source?.trim() || "Unknown";
}

function isWon(status: LeadStatus) {
  return status === "Won" || status === "Converted";
}

function buildTrendData(items: Lead[]) {
  const days = new Map<string, number>();
  const now = new Date();

  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    days.set(date.toISOString().slice(0, 10), 0);
  }

  items.forEach((lead) => {
    const key = new Date(lead.created_at).toISOString().slice(0, 10);
    if (days.has(key)) {
      days.set(key, (days.get(key) ?? 0) + 1);
    }
  });

  return Array.from(days.entries()).map(([date, leads]) => ({
    date: formatDay(date),
    leads,
  }));
}

function buildScoreDistribution(leads: Lead[]) {
  const ranges = [
    { leads: 0, max: 20, min: 0, range: "0-20" },
    { leads: 0, max: 40, min: 21, range: "21-40" },
    { leads: 0, max: 60, min: 41, range: "41-60" },
    { leads: 0, max: 80, min: 61, range: "61-80" },
    { leads: 0, max: 100, min: 81, range: "81-100" },
  ];

  leads.forEach((lead) => {
    const score = lead.lead_score ?? 0;
    const bucket = ranges.find((range) => score >= range.min && score <= range.max);
    if (bucket) {
      bucket.leads += 1;
    }
  });

  return ranges.map(({ leads: leadCount, range }) => ({ leads: leadCount, range }));
}

export default async function AIInsightsPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id,user_id,full_name,email,phone,source,status,notes,assigned_to,lead_score,lead_temperature,created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const leads = (data ?? []) as Lead[];
  const totalLeads = leads.length;
  const sourceStats = leads.reduce<
    Record<string, { lost: number; total: number; won: number }>
  >((result, lead) => {
    const source = getSourceName(lead.source);
    result[source] = result[source] ?? { lost: 0, total: 0, won: 0 };
    result[source].total += 1;
    if (isWon(lead.status)) {
      result[source].won += 1;
    }
    if (lead.status === "Lost") {
      result[source].lost += 1;
    }
    return result;
  }, {});
  const sourceConversionData = Object.entries(sourceStats)
    .map(([source, values]) => ({
      conversionRate: values.total ? Math.round((values.won / values.total) * 1000) / 10 : 0,
      lost: values.lost,
      source,
      total: values.total,
      won: values.won,
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate || b.total - a.total);
  const bestSource = sourceConversionData[0]?.source ?? "No source yet";
  const worstSource =
    [...sourceConversionData].filter((item) => item.total > 0).sort(
      (a, b) => a.conversionRate - b.conversionRate || b.total - a.total,
    )[0]?.source ?? "No source yet";
  const temperatureData = leadTemperatures.map((temperature) => ({
    name: temperature,
    value: leads.filter((lead) => lead.lead_temperature === temperature).length,
  }));
  const scoreValues = leads.map((lead) => lead.lead_score ?? 0);
  const averageScore = scoreValues.length
    ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
    : 0;
  const highestScore = scoreValues.length ? Math.max(...scoreValues) : 0;
  const lowestScore = scoreValues.length ? Math.min(...scoreValues) : 0;
  const totalWon = leads.filter((lead) => isWon(lead.status)).length;
  const totalLost = leads.filter((lead) => lead.status === "Lost").length;
  const winRate = totalLeads ? Math.round((totalWon / totalLeads) * 1000) / 10 : 0;
  const lossRate = totalLeads ? Math.round((totalLost / totalLeads) * 1000) / 10 : 0;
  const pipelineData = pipelineStages.map((stage) => ({
    leads: leads.filter((lead) => (lead.status === "Converted" ? "Won" : lead.status) === stage)
      .length,
    stage,
  }));
  const stuckStage = pipelineData
    .filter((item) => !["Won", "Lost"].includes(item.stage))
    .sort((a, b) => b.leads - a.leads)[0];
  const temperatureWinRates = leadTemperatures.map((temperature) => {
    const temperatureLeads = leads.filter((lead) => lead.lead_temperature === temperature);
    const won = temperatureLeads.filter((lead) => isWon(lead.status)).length;

    return {
      rate: temperatureLeads.length ? Math.round((won / temperatureLeads.length) * 1000) / 10 : 0,
      temperature,
    };
  });
  const bestTemperature = [...temperatureWinRates].sort((a, b) => b.rate - a.rate)[0];
  const sourceComparison =
    sourceConversionData.length >= 2
      ? `${sourceConversionData[0].source} leads convert ${Math.round(
          sourceConversionData[0].conversionRate - sourceConversionData[1].conversionRate,
        )}% better than ${sourceConversionData[1].source} leads.`
      : "Add more lead sources to compare channel conversion performance.";
  const recommendations = [
    sourceComparison,
    bestTemperature && bestTemperature.rate > 0
      ? `${bestTemperature.temperature} leads have the highest close rate at ${bestTemperature.rate}%.`
      : "Score and temperature more leads to reveal close-rate patterns.",
    stuckStage && stuckStage.leads > 0
      ? `Most open leads are currently in ${stuckStage.stage} stage.`
      : "Your open pipeline is balanced across active stages.",
    averageScore > 0
      ? `Average AI score is ${averageScore}; prioritize leads above this score for faster follow-up.`
      : "Create scored leads to unlock AI score recommendations.",
  ];

  return (
    <AppShell active="ai-insights" userEmail={user.email}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            AI Insights
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Intelligence dashboard
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            Source performance, lead quality, conversion signals, and practical recommendations.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          Unable to load AI insights: {error.message}
        </div>
      )}

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Best Lead Source", value: bestSource },
          { label: "Worst Lead Source", value: worstSource },
          { label: "Win Rate", value: `${winRate}%` },
          { label: "Loss Rate", value: `${lossRate}%` },
        ].map((item) => (
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-6" key={item.label}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {item.label}
            </p>
            <p className="mt-4 break-words text-3xl font-black text-orange-500">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Average Lead Score", value: averageScore },
          { label: "Highest Lead Score", value: highestScore },
          { label: "Lowest Lead Score", value: lowestScore },
          { label: "Total Won / Lost", value: `${totalWon} / ${totalLost}` },
        ].map((item) => (
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-6" key={item.label}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {item.label}
            </p>
            <p className="mt-4 text-4xl font-black text-orange-500">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Pipeline Health</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {pipelineData.map((item) => (
            <div className="rounded-lg border border-white/10 bg-black p-4" key={item.stage}>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">
                {item.stage}
              </p>
              <p className="mt-2 text-3xl font-black text-orange-500">{item.leads}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">AI Recommendations</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {recommendations.map((recommendation) => (
            <div
              className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4 text-sm font-semibold leading-6 text-orange-100"
              key={recommendation}
            >
              {recommendation}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <AIInsightsCharts
          pipelineData={pipelineData}
          scoreDistributionData={buildScoreDistribution(leads)}
          sourceConversionData={sourceConversionData}
          temperatureData={temperatureData}
          trendData={buildTrendData(leads)}
        />
      </section>
    </AppShell>
  );
}
