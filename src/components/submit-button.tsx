"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  className,
  disabled = false,
  pendingLabel = "Saving...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={disabled || pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
