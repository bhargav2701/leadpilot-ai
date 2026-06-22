"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logWhatsAppInitiated } from "@/app/whatsapp/actions";
import {
  buildWhatsAppUrl,
  generateWhatsAppTemplateMessage,
  getWhatsAppTemplate,
  hasValidWhatsAppPhone,
  whatsappTemplates,
  type WhatsAppTemplateKey,
} from "@/lib/whatsapp";
import type { Lead } from "@/types/lead";

type WhatsAppQuickActionsProps = {
  lead: Pick<Lead, "full_name" | "id" | "lead_temperature" | "phone" | "source" | "status">;
};

export function WhatsAppQuickActions({ lead }: WhatsAppQuickActionsProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const isValid = hasValidWhatsAppPhone(lead.phone);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openTemplate(templateKey: WhatsAppTemplateKey) {
    if (!isValid) {
      setError("Phone number required for WhatsApp.");
      return;
    }

    const template = getWhatsAppTemplate(templateKey);
    const message = generateWhatsAppTemplateMessage(templateKey, lead);
    const whatsappUrl = buildWhatsAppUrl(lead.phone, message);

    setError("");
    setOpen(false);
    if (process.env.NODE_ENV === "development") {
      console.log("Generated WhatsApp URL:", whatsappUrl);
    }
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      await logWhatsAppInitiated(lead.id, template.label);
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`flex h-10 w-full min-w-[112px] items-center justify-center gap-2 rounded-[10px] px-3 text-xs font-black transition ${
          isValid
            ? "bg-[#25D366] text-black hover:bg-[#1ebe5d]"
            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          if (!isValid) {
            setError("Phone number required for WhatsApp.");
            return;
          }
          setOpen((current) => !current);
        }}
        type="button"
      >
        WhatsApp <span aria-hidden="true">▼</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-12 z-[70] min-w-[220px] overflow-hidden rounded-[10px] border border-white/10 bg-zinc-950 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {whatsappTemplates.map((template) => (
            <button
              className="group flex h-12 w-full items-center gap-3 px-3 text-left transition hover:bg-orange-500/10"
              key={template.key}
              onClick={() => openTemplate(template.key)}
              title={template.description}
              type="button"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#25D366]/15 text-sm font-black text-[#25D366]">
                {template.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-white">
                  {template.label}
                </span>
                <span className="block truncate text-xs font-semibold text-zinc-500 group-hover:text-orange-200">
                  {template.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {!isValid && (
        <p className="mt-2 text-xs font-bold text-zinc-500">Phone number required for WhatsApp.</p>
      )}
      {error && (
        <div
          className="fixed bottom-5 right-5 z-[80] rounded-[10px] border border-red-500/30 bg-red-500 px-4 py-3 text-sm font-black text-white shadow-2xl"
          role="status"
        >
          {error}
        </div>
      )}
    </div>
  );
}
