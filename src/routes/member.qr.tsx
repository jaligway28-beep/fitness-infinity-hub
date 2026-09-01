import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, ScanLine, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { QrPass } from "@/components/QrPass";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PageHeader, SectionHeader } from "@/components/ui-bits";
import { dayLabel, daysUntil, formatDate } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/member/qr")({
  head: () => ({
    meta: [
      { title: "Digital QR Pass — Fitness Infinity" },
      {
        name: "description",
        content: "Your digital QR membership pass for contactless gym entry and attendance logging.",
      },
      { property: "og:title", content: "Digital QR Pass — Fitness Infinity" },
      {
        property: "og:description",
        content: "Scan your QR membership pass at the turnstile to record attendance instantly.",
      },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const { currentMember, attendance, checkIn } = useGym();
  const [token, setToken] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const myAttendance = attendance.filter((a) => a.memberId === currentMember.id);

  return (
    <>
      <PageHeader
        eyebrow="Gym entry"
        title="Digital QR membership pass"
        subtitle="Present this pass at the turnstile. The code refreshes for every entry."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="surface-panel flex flex-col items-center gap-5 p-6 text-center">
          <div className="flex w-full items-center gap-3 text-left">
            <Logo size={44} />
            <div>
              <p className="font-display text-sm font-semibold">Fitness Infinity</p>
              <p className="text-[11px] text-muted-foreground">Digital membership pass</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" /> {currentMember.plan} ·{" "}
            <span className="capitalize">{currentMember.planStatus}</span>
          </span>
          <QrPass value={`FI-${currentMember.id}-${token}`} size={260} />
          <div>
            <p className="font-display text-lg font-semibold">{currentMember.name}</p>
            <p className="text-xs text-muted-foreground">Pass token {token}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Valid until {formatDate(currentMember.expiresOn)} · {Math.max(0, daysUntil(currentMember.expiresOn))} days left
            </p>
          </div>
          <div className="grid w-full gap-2">
            <Button onClick={checkIn}>
              <ScanLine className="size-4" /> Simulate turnstile scan
            </Button>
            <Button
              variant="outline"
              onClick={() => setToken(Math.random().toString(36).slice(2, 8).toUpperCase())}
            >
              <RefreshCw className="size-4" /> Refresh code
            </Button>
          </div>
        </section>

        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Attendance history" subtitle="Every entry logged by the QR scanner" />
          <ul className="divide-y divide-border">
            {myAttendance.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-semibold">{dayLabel(a.date)}</p>
                  <p className="text-xs text-muted-foreground">{a.method}</p>
                </div>
                <p className="text-sm text-muted-foreground">{a.time}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
