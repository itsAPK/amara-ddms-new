"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
    setLoading(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={!!state} onClose={() => close(false)} size="sm">
        {state && (
          <DialogBody>
            <div className="flex gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="pt-1">
                <h3 className="font-display text-[16px] text-ink-900">{state.options.title}</h3>
                {state.options.description && (
                  <p className="mt-1.5 text-[13.5px] text-ink-500">{state.options.description}</p>
                )}
              </div>
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant={state?.options.variant === "primary" ? "primary" : "danger"}
            size="sm"
            loading={loading}
            onClick={() => {
              setLoading(true);
              close(true);
            }}
          >
            {state?.options.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}
