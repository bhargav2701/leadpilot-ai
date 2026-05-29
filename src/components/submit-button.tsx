"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  className: string;
  pendingLabel?: string;
};

export function SubmitButton({ children, className, pendingLabel = "Saving..." }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
