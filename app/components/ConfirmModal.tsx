"use client";

import { Loader2, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  busy = false,
  error,
  children
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <div className="w-full max-w-md border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-base text-white">{title}</h2>
          <button className="border border-border p-2 hover:border-[var(--border-active)]" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        {error && <p className="mt-4 border border-[var(--risk-medium)] bg-[var(--risk-medium-bg)] p-3 text-sm text-[var(--risk-medium)]">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button className="border border-border px-3 py-2 text-sm text-muted hover:text-white" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 border border-pharos bg-[rgba(59,130,246,0.14)] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
