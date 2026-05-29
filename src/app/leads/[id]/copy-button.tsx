"use client";

import { useState } from "react";

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="rounded-lg border border-orange-500/40 px-3 py-2 text-sm font-bold text-orange-300 transition hover:bg-orange-500 hover:text-black"
      onClick={copyMessage}
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
