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

type StatusData = {
  name: string;
  value: number;
};

type SourceData = {
  source: string;
  leads: number;
};

type TrendData = {
  date: string;
  leads: number;
};

type AnalyticsChartsProps = {
  followUpTrendData: TrendData[];
  sourceData: SourceData[];
  statusData: StatusData[];
  trendData: TrendData[];
};

const chartColors = ["#f97316", "#fb923c", "#fdba74", "#9ca3af"];

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black text-sm font-semibold text-zinc-500">
      {label}
    </div>
  );
}

export function AnalyticsCharts({
  followUpTrendData,
  sourceData,
  statusData,
  trendData,
}: AnalyticsChartsProps) {
  const hasStatusData = statusData.some((item) => item.value > 0);
  const hasSourceData = sourceData.some((item) => item.leads > 0);
  const hasTrendData = trendData.some((item) => item.leads > 0);
  const hasFollowUpTrendData = followUpTrendData.some((item) => item.leads > 0);

  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-2">
      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Leads by Status</h2>
          <p className="mt-2 text-sm text-zinc-500">Pipeline distribution by current status.</p>
        </div>
        {hasStatusData ? (
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={statusData}
                  dataKey="value"
                  innerRadius={58}
                  nameKey="name"
                  outerRadius={96}
                  paddingAngle={4}
                >
                  {statusData.map((item, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={item.name} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart label="No status data yet" />
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Leads by Source</h2>
          <p className="mt-2 text-sm text-zinc-500">Top acquisition channels by lead volume.</p>
        </div>
        {hasSourceData ? (
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={sourceData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="source" stroke="#71717a" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#71717a" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="leads" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart label="No source data yet" />
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6 xl:col-span-2">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Lead Creation Trend</h2>
          <p className="mt-2 text-sm text-zinc-500">Daily lead creation across the latest window.</p>
        </div>
        {hasTrendData ? (
          <div className="h-80">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#71717a" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />
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
          <EmptyChart label="No trend data yet" />
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-zinc-950 p-6 xl:col-span-2">
        <div className="mb-6">
          <h2 className="text-2xl font-black">Follow-Ups Generated Per Day</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Daily AI follow-up generation across the latest window.
          </p>
        </div>
        {hasFollowUpTrendData ? (
          <div className="h-80">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={followUpTrendData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#71717a" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />
                <Line
                  activeDot={{ fill: "#f97316", r: 6 }}
                  dataKey="leads"
                  dot={{ fill: "#f97316", r: 4 }}
                  stroke="#fb923c"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart label="No follow-up generation data yet" />
        )}
      </section>
    </div>
  );
}
