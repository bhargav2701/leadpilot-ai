"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SourceConversionData = {
  conversionRate: number;
  lost: number;
  source: string;
  total: number;
  won: number;
};

type TemperatureData = {
  name: string;
  value: number;
};

type ScoreDistributionData = {
  range: string;
  leads: number;
};

type PipelineData = {
  stage: string;
  leads: number;
};

type TrendData = {
  date: string;
  leads: number;
};

type AIInsightsChartsProps = {
  pipelineData: PipelineData[];
  scoreDistributionData: ScoreDistributionData[];
  sourceConversionData: SourceConversionData[];
  temperatureData: TemperatureData[];
  trendData: TrendData[];
};

const chartColors = ["#f97316", "#fb923c", "#fdba74", "#facc15", "#71717a"];

function tooltipStyle() {
  return {
    background: "#09090b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#fff",
  };
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black text-sm font-semibold text-zinc-500">
      {label}
    </div>
  );
}

export function AIInsightsCharts({
  pipelineData,
  scoreDistributionData,
  sourceConversionData,
  temperatureData,
  trendData,
}: AIInsightsChartsProps) {
  const hasSources = sourceConversionData.some((item) => item.total > 0);
  const hasTemperatures = temperatureData.some((item) => item.value > 0);
  const hasScores = scoreDistributionData.some((item) => item.leads > 0);
  const hasPipeline = pipelineData.some((item) => item.leads > 0);
  const hasTrend = trendData.some((item) => item.leads > 0);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Conversion Rate by Source</h2>
        <p className="mt-2 text-sm text-zinc-500">Win percentage across acquisition channels.</p>
        {hasSources ? (
          <div className="mt-6 h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={sourceConversionData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="source" stroke="#71717a" tickLine={false} />
                <YAxis stroke="#71717a" tickFormatter={(value) => `${value}%`} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => `${value}%`} />
                <Bar dataKey="conversionRate" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyChart label="No source conversion data yet" />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Lead Temperature Insights</h2>
        <p className="mt-2 text-sm text-zinc-500">Hot, warm, and cold lead mix.</p>
        {hasTemperatures ? (
          <div className="mt-6 h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={temperatureData}
                  dataKey="value"
                  innerRadius={58}
                  nameKey="name"
                  outerRadius={96}
                  paddingAngle={4}
                >
                  {temperatureData.map((item, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={item.name} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyChart label="No temperature data yet" />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Score Distribution</h2>
        <p className="mt-2 text-sm text-zinc-500">Lead volume by AI score band.</p>
        {hasScores ? (
          <div className="mt-6 h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={scoreDistributionData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="range" stroke="#71717a" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#71717a" tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="leads" fill="#fb923c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyChart label="No AI score data yet" />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="text-2xl font-black">Pipeline Health</h2>
        <p className="mt-2 text-sm text-zinc-500">Lead count by pipeline stage.</p>
        {hasPipeline ? (
          <div className="mt-6 h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="stage" stroke="#71717a" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#71717a" tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="leads" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyChart label="No pipeline data yet" />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6 xl:col-span-2">
        <h2 className="text-2xl font-black">Lead Trend</h2>
        <p className="mt-2 text-sm text-zinc-500">Daily lead creation across the latest window.</p>
        {hasTrend ? (
          <div className="mt-6 h-80">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#71717a" tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Line
                  activeDot={{ fill: "#f97316", r: 6 }}
                  dataKey="leads"
                  dot={{ fill: "#f97316", r: 4 }}
                  stroke="#f97316"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyChart label="No trend data yet" />
          </div>
        )}
      </section>
    </div>
  );
}
