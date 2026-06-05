"use client";

import { useMemo, useState, useTransition } from "react";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import type { AILeadSummary } from "@/lib/ai/lead-summary";
import type { ActivityLog } from "@/types/activity-log";
import type { Lead, LeadStatus } from "@/types/lead";
import { leadTemperatures } from "@/types/lead";
import { moveLeadStage } from "./actions";

const pipelineStages = ["New", "Qualified", "Proposal", "Won", "Lost"] satisfies LeadStatus[];

type PipelineBoardProps = {
  activityLogs: ActivityLog[];
  aiSummaries: Record<string, AILeadSummary>;
  leads: Lead[];
  reminderCounts: Record<string, number>;
};

function getPipelineStatus(status: LeadStatus) {
  return status === "Converted" ? "Won" : status;
}

function getAssignedUser(lead: Lead) {
  return lead.assigned_to || "Unassigned";
}

function getSource(lead: Lead) {
  return lead.source?.trim() || "Unknown";
}

export function PipelineBoard({
  activityLogs,
  aiSummaries,
  leads: initialLeads,
  reminderCounts,
}: PipelineBoardProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [temperature, setTemperature] = useState("all");
  const [assignedUser, setAssignedUser] = useState("all");
  const [isPending, startTransition] = useTransition();
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedActivity = selectedLead
    ? activityLogs.filter((activity) => activity.lead_id === selectedLead.id)
    : [];
  const selectedSummary = selectedLead ? aiSummaries[selectedLead.id] : null;

  const sources = useMemo(
    () => Array.from(new Set(leads.map(getSource))).sort((a, b) => a.localeCompare(b)),
    [leads],
  );
  const assignedUsers = useMemo(
    () => Array.from(new Set(leads.map(getAssignedUser))).sort((a, b) => a.localeCompare(b)),
    [leads],
  );
  const filteredLeads = leads.filter((lead) => {
    const searchTerm = query.trim().toLowerCase();
    const matchesSearch = searchTerm
      ? [lead.full_name, lead.email, lead.phone, lead.source]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(searchTerm))
      : true;
    const matchesSource = source === "all" || getSource(lead) === source;
    const matchesTemperature = temperature === "all" || lead.lead_temperature === temperature;
    const matchesAssigned = assignedUser === "all" || getAssignedUser(lead) === assignedUser;

    return matchesSearch && matchesSource && matchesTemperature && matchesAssigned;
  });
  const stats = {
    active: leads.filter((lead) => ["Qualified", "Proposal"].includes(getPipelineStatus(lead.status)))
      .length,
    lost: leads.filter((lead) => getPipelineStatus(lead.status) === "Lost").length,
    new: leads.filter((lead) => getPipelineStatus(lead.status) === "New").length,
    total: leads.length,
    won: leads.filter((lead) => getPipelineStatus(lead.status) === "Won").length,
  };

  function moveLead(leadId: string, nextStatus: LeadStatus) {
    const lead = leads.find((item) => item.id === leadId);

    if (!lead || getPipelineStatus(lead.status) === nextStatus) {
      return;
    }

    const previousLeads = leads;
    setLeads((current) =>
      current.map((item) => (item.id === leadId ? { ...item, status: nextStatus } : item)),
    );

    startTransition(async () => {
      try {
        await moveLeadStage(leadId, nextStatus);
      } catch {
        setLeads(previousLeads);
      }
    });
  }

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Leads", value: stats.total },
          { label: "New Leads", value: stats.new },
          { label: "Active Opportunities", value: stats.active },
          { label: "Won Leads", value: stats.won },
          { label: "Lost Leads", value: stats.lost },
        ].map((stat) => (
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-5" key={stat.label}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              {stat.label}
            </p>
            <p className="mt-3 text-4xl font-black text-orange-500">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
        <input
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Lead"
          value={query}
        />
        <select
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          onChange={(event) => setSource(event.target.value)}
          value={source}
        >
          <option value="all">All sources</option>
          {sources.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          onChange={(event) => setTemperature(event.target.value)}
          value={temperature}
        >
          <option value="all">All temperatures</option>
          {leadTemperatures.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          className="min-w-0 rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
          onChange={(event) => setAssignedUser(event.target.value)}
          value={assignedUser}
        >
          <option value="all">All assigned users</option>
          {assignedUsers.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-6 overflow-x-auto pb-3">
        <div className="grid min-w-0 grid-cols-1 gap-4 md:min-w-[1380px] md:grid-cols-5 xl:min-w-0">
          {pipelineStages.map((stage) => {
            const stageLeads = filteredLeads.filter(
              (lead) => getPipelineStatus(lead.status) === stage,
            );

            return (
              <div
                className="min-h-60 rounded-xl border border-white/10 bg-zinc-950 p-4 transition data-[dragging=true]:border-orange-500/60 data-[dragging=true]:bg-orange-500/10"
                data-dragging={draggedLeadId ? "true" : "false"}
                key={stage}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const leadId = event.dataTransfer.getData("text/plain") || draggedLeadId;
                  setDraggedLeadId(null);
                  if (leadId) {
                    moveLead(leadId, stage);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">{stage}</h2>
                  <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-300">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {stageLeads.map((lead) => (
                    <button
                      className="block w-full rounded-xl border border-white/10 bg-black p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-500/50 hover:bg-zinc-900 disabled:opacity-70"
                      disabled={isPending}
                      draggable
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      onDragEnd={() => setDraggedLeadId(null)}
                      onDragStart={(event) => {
                        setDraggedLeadId(lead.id);
                        event.dataTransfer.setData("text/plain", lead.id);
                      }}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black text-white">{lead.full_name}</p>
                          <p className="mt-1 truncate text-sm text-zinc-500">{getSource(lead)}</p>
                        </div>
                        <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-black text-orange-300">
                          {lead.lead_score ?? 0}
                        </span>
                      </div>
                      <div className="mt-4">
                        <LeadScoreBadge
                          score={lead.lead_score}
                          temperature={lead.lead_temperature}
                        />
                      </div>
                      <p className="mt-4 truncate text-xs font-semibold text-zinc-500">
                        Assigned: {getAssignedUser(lead)}
                      </p>
                    </button>
                  ))}

                  {!stageLeads.length && (
                    <div className="rounded-lg border border-dashed border-white/10 bg-black p-5 text-center text-sm font-semibold text-zinc-600">
                      No leads in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedLeadId(null)}>
          <aside
            className="ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-white/10 bg-zinc-950 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
                  Lead Quick View
                </p>
                <h2 className="mt-2 text-3xl font-black">{selectedLead.full_name}</h2>
              </div>
              <button
                className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
                onClick={() => setSelectedLeadId(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Email", value: selectedLead.email || "-" },
                { label: "Phone", value: selectedLead.phone || "-" },
                { label: "Source", value: getSource(selectedLead) },
                { label: "Stage", value: getPipelineStatus(selectedLead.status) },
                { label: "Assigned User", value: getAssignedUser(selectedLead) },
                { label: "Reminder Count", value: String(reminderCounts[selectedLead.id] ?? 0) },
              ].map((item) => (
                <div className="rounded-lg border border-white/10 bg-black p-4" key={item.label}>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-2 break-words font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <section className="mt-5 rounded-xl border border-white/10 bg-black p-5">
              <h3 className="text-xl font-black">Notes</h3>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-zinc-300">
                {selectedLead.notes || "No notes added."}
              </p>
            </section>

            {selectedSummary && (
              <section className="mt-5 rounded-xl border border-orange-500/20 bg-orange-500/10 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">
                  AI Lead Summary
                </p>
                <p className="mt-3 leading-7 text-orange-50">{selectedSummary.summary}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                      Recommended
                    </p>
                    <p className="mt-2 font-black text-white">
                      {selectedSummary.recommendedAction}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                      Health
                    </p>
                    <p className="mt-2 font-black text-white">{selectedSummary.health}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm font-bold text-orange-100">
                    <span>Opportunity Score</span>
                    <span>{selectedSummary.opportunityScore}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-black">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${selectedSummary.opportunityScore}%` }}
                    />
                  </div>
                </div>
              </section>
            )}

            <section className="mt-5 rounded-xl border border-white/10 bg-black p-5">
              <h3 className="text-xl font-black">Activity Timeline</h3>
              <div className="mt-4 space-y-3">
                {selectedActivity.length ? (
                  selectedActivity.map((activity) => (
                    <div className="rounded-lg border border-white/10 bg-zinc-950 p-4" key={activity.id}>
                      <p className="font-bold text-orange-300">{activity.activity_type}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">{activity.description}</p>
                      <p className="mt-2 text-xs font-semibold text-zinc-600">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-zinc-950 p-5 text-sm font-semibold text-zinc-600">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
