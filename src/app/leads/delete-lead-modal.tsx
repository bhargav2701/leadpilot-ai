"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { deleteLead } from "./actions";

type DeleteLeadModalProps = {
  id: string;
  name: string;
};

export function DeleteLeadModal({ id, name }: DeleteLeadModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="h-10 w-full rounded-[10px] border border-red-500/40 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white sm:w-auto"
        onClick={() => setOpen(true)}
        type="button"
      >
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Delete lead?</h2>
            <p className="mt-3 leading-7 text-zinc-400">
              This will permanently delete {name} from your workspace.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:text-white"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <form action={deleteLead}>
                <input name="id" type="hidden" value={id} />
                <SubmitButton
                  className="w-full rounded-lg bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                  pendingLabel="Deleting..."
                >
                  Delete Lead
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
