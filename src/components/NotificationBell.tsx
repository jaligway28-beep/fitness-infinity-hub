import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGym } from "@/lib/gym-store";
import type { Role } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

export function NotificationBell({ role }: { role: Role }) {
  const { notifications, markRead, markAllRead } = useGym();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const list = notifications.slice(0, 12);
  const messagesTo = role === "member" ? "/member/messages" : role === "trainer" ? "/trainer/messages" : "/admin/messages";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span
              data-testid="bell-count"
              className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => markAllRead(role)}>
            <CheckCheck className="size-4" /> Mark all as read
          </Button>
        </div>
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            You're all caught up — new alerts will appear here.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {list.map((n) => {
              const inner = (
                <>
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-primary",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", n.read ? "text-muted-foreground" : "font-semibold text-foreground")}>
                      {n.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground/70">{n.time}</span>
                  </span>
                </>
              );
              const cls = cn(
                "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                !n.read && "bg-primary/5",
              );
              return (
                <li key={n.id}>
                  {n.kind === "message" ? (
                    <Link
                      to={messagesTo}
                      className={cls}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" className={cls} onClick={() => markRead(n.id)}>
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
