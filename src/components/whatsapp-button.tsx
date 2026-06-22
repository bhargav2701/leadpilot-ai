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
};

export function WhatsAppButton({
  className = "rounded-lg bg-[#25D366] px-4 py-2 text-sm font-black text-black transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-50",
  disabledClassName,
  label = "Open WhatsApp",
  leadId,
  message,
  phone,
}: WhatsAppButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const isValid = hasValidWhatsAppPhone(phone);
  const disabled = !isValid || isPending;

  function openWhatsApp() {
    if (!isValid) {
      setError("Phone number required for WhatsApp.");
      return;
    }

    setError("");
    const whatsappWindow = window.open("about:blank", "_blank", "noopener,noreferrer");
    startTransition(async () => {
      await logWhatsAppInitiated(leadId);
      const whatsappUrl = buildWhatsAppUrl(phone, message);
      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  return (
    <div>
      <button
        className={disabled && disabledClassName ? disabledClassName : className}
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
      {error && <p className="mt-2 text-xs font-bold text-red-300">{error}</p>}
    </div>
  );
}
