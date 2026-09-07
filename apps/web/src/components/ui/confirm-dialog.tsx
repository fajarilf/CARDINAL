"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Overlay, DialogPanel } from "./dialog";
import { Button } from "./button";
import { Spinner } from "./spinner";

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  loading = false,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  title: ReactNode;
  body: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <Overlay onDismiss={onCancel}>
      <DialogPanel
        className="max-w-[400px] p-[22px]"
        role="alertdialog"
        aria-modal="true"
      >
        <h2 className="text-[19px] font-bold mb-2">{title}</h2>
        <p className="mb-5 text-ink/55 text-sm leading-[1.55]">{body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="quiet" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner /> : destructive && <Trash2 size={15} strokeWidth={2} />}{" "}
            {confirmLabel}
          </Button>
        </div>
      </DialogPanel>
    </Overlay>
  );
}
