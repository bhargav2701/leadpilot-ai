import { SubmitButton } from "@/components/submit-button";
import { followUpTones, type FollowUp } from "@/types/follow-up";
import type { Lead } from "@/types/lead";
import { CopyButton } from "./copy-button";
import { generateFollowUp } from "./follow-up-actions";

type FollowUpGeneratorProps = {
  followUps: FollowUp[];
  lead: Lead;
};

export function FollowUpGenerator({ followUps, lead }: FollowUpGeneratorProps) {
  return (
    <section className="mt-8 rounded-xl border border-white/10 bg-zinc-950 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">
            AI Follow-Up Generator
          </p>
          <h2 className="mt-3 text-2xl font-black">Generate Follow-Up</h2>
          <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
            <p>
              <span className="font-bold text-zinc-200">Lead Name:</span> {lead.full_name}
            </p>
            <p>
              <span className="font-bold text-zinc-200">Lead Source:</span>{" "}
              {lead.source || "Unknown"}
            </p>
            <p>
              <span className="font-bold text-zinc-200">Lead Status:</span> {lead.status}
            </p>
            <p>
              <span className="font-bold text-zinc-200">Notes:</span>{" "}
              {lead.notes || "No notes"}
            </p>
          </div>
        </div>

        <form action={generateFollowUp} className="grid gap-3 sm:min-w-72">
          <input name="lead_id" type="hidden" value={lead.id} />
          <select
            className="rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
            name="tone"
          >
            {followUpTones.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>
          <SubmitButton
            className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            pendingLabel="Generating..."
          >
            Generate Follow-Up
          </SubmitButton>
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-black">Follow-Up History</h3>
        <div className="mt-4 space-y-4">
          {followUps.length ? (
            followUps.map((followUp) => (
              <article className="rounded-xl border border-white/10 bg-black p-5" key={followUp.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-orange-300">{followUp.tone}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {new Date(followUp.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton text={followUp.generated_message} />
                    <form action={generateFollowUp}>
                      <input name="lead_id" type="hidden" value={lead.id} />
                      <input name="tone" type="hidden" value={followUp.tone} />
                      <SubmitButton
                        className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                        pendingLabel="Regenerating..."
                      >
                        Regenerate
                      </SubmitButton>
                    </form>
                  </div>
                </div>
                <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
                  {followUp.generated_message}
                </pre>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 bg-black p-8 text-center">
              <p className="font-bold">No follow-ups generated yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Generate the first email and WhatsApp follow-up for this lead.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
