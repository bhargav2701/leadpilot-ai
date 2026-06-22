"use client";

import { useState, useTransition } from "react";
import { logWhatsAppInitiated } from "@/app/whatsapp/actions";
import { buildWhatsAppUrl, hasValidWhatsAppPhone } from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  className?: string;
  disabledClassName?: string;
  label?: string;
  leadId: string;
  message?: string;
  phone: string | null;
  templateName?: string;
};

export function WhatsAppButton({
  className = "h-10 rounded-[10px] bg-[#25D366] px-4 text-sm font-black text-black transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-50",
  disabledClassName,
  label = "Open WhatsApp",
  leadId,
  message,
  phone,
  templateName,
}: WhatsAppButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const isValid = hasValidWhatsAppPhone(phone);
  const disabled = isPending;

  function openWhatsApp() {
    if (!isValid) {
      setError("Phone number required for WhatsApp.");
      return;
    }

    const whatsappUrl = buildWhatsAppUrl(phone, message);

    setError("");
    if (process.env.NODE_ENV === "development") {
      console.log("Generated WhatsApp URL:", whatsappUrl);
    }
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    startTransition(async () => {
      await logWhatsAppInitiated(leadId, templateName);
    });
  }

  return (
    <div>
      <button
        className={
          !isValid
            ? (disabledClassName ??
              "h-10 rounded-[10px] bg-zinc-800 px-4 text-sm font-black text-zinc-500 transition hover:bg-zinc-700")
            : disabled && disabledClassName
              ? disabledClassName
              : className
        }
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          openWhatsApp();
        }}
        type="button"
      >
        {isPending ? "Opening..." : label}
      </button>
      {!isValid && (
        <p className="mt-2 text-xs font-bold text-zinc-500">Phone number required for WhatsApp.</p>
      )}
      {error && (
        <div
          className="fixed bottom-5 right-5 z-[80] rounded-lg border border-red-500/30 bg-red-500 px-4 py-3 text-sm font-black text-white shadow-2xl"
          role="status"
        >
          {error}
        </div>
      )}
    </div>
  );
}
