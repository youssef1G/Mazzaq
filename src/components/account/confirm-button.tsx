"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function ConfirmButton({
  message,
  children,
  className,
  danger = false,
}: {
  message: string;
  children: ReactNode;
  className?: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      data-danger={danger}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? <Loader2 size={12} className="spin" /> : null}
      {children}
    </button>
  );
}
