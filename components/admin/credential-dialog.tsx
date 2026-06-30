"use client";

import * as React from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function CredentialDialog({
  open,
  onClose,
  email,
  password,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  password: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <DialogHeader title="Share these credentials" description="This password is shown only once - copy it now." onClose={onClose} />
      <DialogBody>
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <KeyRound className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] text-ink-500">{email}</p>
            <p className="truncate font-mono text-[15px] font-semibold text-ink-900">{password}</p>
          </div>
          <button
            onClick={copy}
            className="shrink-0 rounded-lg border border-amber-300 bg-white p-2 text-amber-700 hover:bg-amber-100"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-3 text-[12.5px] text-ink-500">
          They&rsquo;ll be required to set a new password the next time they sign in.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
