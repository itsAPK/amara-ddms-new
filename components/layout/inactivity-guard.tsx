"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WARNING_AFTER_MS = 25 * 60 * 1000; // matches the 30 min server session, warns 5 min ahead
const TIMEOUT_AFTER_MS = 30 * 60 * 1000;
const COUNTDOWN_SECONDS = Math.round((TIMEOUT_AFTER_MS - WARNING_AFTER_MS) / 1000);
const ACTIVITY_EVENTS = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"] as const;

export function InactivityGuard() {
  const [warning, setWarning] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(COUNTDOWN_SECONDS);
  const lastActivity = React.useRef(Date.now());

  React.useEffect(() => {
    const markActive = () => {
      lastActivity.current = Date.now();
      if (warning) setWarning(false);
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive));

    const interval = setInterval(() => {
      const idleFor = Date.now() - lastActivity.current;
      if (idleFor >= TIMEOUT_AFTER_MS) {
        signOut({ callbackUrl: "/login?timeout=1" });
      } else if (idleFor >= WARNING_AFTER_MS) {
        setWarning(true);
        setSecondsLeft(Math.max(0, Math.round((TIMEOUT_AFTER_MS - idleFor) / 1000)));
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warning]);

  return (
    <Dialog open={warning} onClose={() => {}} size="sm">
      <DialogBody>
        <div className="flex gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div className="pt-1">
            <h3 className="font-display text-[16px] text-ink-900">Still there?</h3>
            <p className="mt-1.5 text-[13.5px] text-ink-500">
              For your security, you&rsquo;ll be signed out in <strong>{secondsLeft}s</strong> due to inactivity.
            </p>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login?timeout=1" })}
        >
          Sign out now
        </Button>
        <Button
          size="sm"
          onClick={() => {
            lastActivity.current = Date.now();
            setWarning(false);
          }}
        >
          Stay signed in
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
