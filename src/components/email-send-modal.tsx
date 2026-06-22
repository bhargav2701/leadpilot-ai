"use client";

import { useMemo, useState, useTransition } from "react";
import {
  emailTemplates,
  generateEmailTemplate,
  getEmailTemplate,
  type EmailTemplateKey,
} from "@/lib/email/templates";
import type { Lead } from "@/types/lead";

type EmailSendModalProps = {
  lead: Pick<Lead, "email" | "full_name" | "id" | "source" | "status">;
};

export function EmailSendModal({ lead }: EmailSendModalProps) {
  const [open, setOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState<EmailTemplateKey>("follow-up");
  const generated = useMemo(() => generateEmailTemplate(templateKey, lead), [lead, templateKey]);
  const [subject, setSubject] = useState(generated.subject);
  const [body, setBody] = useState(generated.body);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const canSend = Boolean(lead.email) && !isPending;

  function chooseTemplate(nextTemplate: EmailTemplateKey) {
    const next = generateEmailTemplate(nextTemplate, lead);
    setTemplateKey(nextTemplate);
    setSubject(next.subject);
    setBody(next.body);
  }

  function sendEmail() {
    if (!lead.email) {
      setError("Lead email is required.");
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch("/api/email/send", {
        body: JSON.stringify({
          body,
          leadId: lead.id,
          subject,
          templateKey,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string; ok?: boolean };

      if (!response.ok || result.error) {
        setError(result.error ?? "Email failed to send.");
        return;
      }

      setOpen(false);
      setToast("Email sent.");
      window.setTimeout(() => setToast(""), 2200);
    });
  }

  return (
    <>
      <button
        className="h-10 rounded-[10px] bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400"
        onClick={() => {
          chooseTemplate(templateKey);
          setOpen(true);
        }}
        type="button"
      >
        Send Email
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
                  Email Preview
                </p>
                <h2 className="mt-2 text-2xl font-black">Send email to {lead.full_name}</h2>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  {lead.email || "No email on file"}
                </p>
              </div>
              <button
                className="rounded-[10px] border border-white/10 px-3 py-2 text-sm font-bold text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-300"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {emailTemplates.map((template) => (
                <button
                  className={`rounded-[10px] border p-3 text-left text-sm font-bold transition ${
                    templateKey === template.key
                      ? "border-orange-500 bg-orange-500/10 text-orange-200"
                      : "border-white/10 bg-black text-zinc-300 hover:border-orange-500/50"
                  }`}
                  key={template.key}
                  onClick={() => chooseTemplate(template.key)}
                  title={template.description}
                  type="button"
                >
                  {template.label}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-zinc-300">Subject</span>
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
                onChange={(event) => setSubject(event.target.value)}
                value={subject}
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-zinc-300">Body</span>
              <textarea
                className="mt-2 min-h-72 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-orange-500"
                onChange={(event) => setBody(event.target.value)}
                value={body}
              />
            </label>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                {error}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                className="h-10 rounded-[10px] border border-white/10 px-4 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-[10px] bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSend}
                onClick={sendEmail}
                type="button"
              >
                {isPending ? "Sending..." : `Send ${getEmailTemplate(templateKey).label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-5 right-5 z-[90] rounded-[10px] border border-emerald-500/40 bg-emerald-500 px-4 py-3 text-sm font-black text-black shadow-2xl"
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  );
}
