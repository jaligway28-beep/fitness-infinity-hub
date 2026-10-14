import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  initialAttendance,
  initialBookings,
  initialMessages,
  initialNotifications,
  formatDate,
  identityFor,
  planStatusFor,
  todayIso,
  members as seedMembers,
  plans as seedPlans,
  trainers,
  TIME_SLOTS,
  type Attendance,
  type Booking,
  type BookingStatus,
  type Member,
  type MessageThread,
  type Notification,
  type Plan,
  type Role,
} from "./gym-data";

type Session = { role: Role; name: string; id: string } | null;

export type ScanResult =
  | { ok: true; kind: "check-in" | "check-out"; memberName: string; time: string }
  | { ok: false; reason: string; detail: string };

export const SCAN_COOLDOWN_MS = 60_000;

type GymContextValue = {
  session: Session;
  signIn: (role: Role, name?: string) => void;
  signOut: () => void;
  currentMember: Member;
  members: Member[];
  bookings: Booking[];
  attendance: Attendance[];
  notifications: Notification[];
  messages: MessageThread[];
  plans: Plan[];
  availability: Record<string, string[]>;
  activeTrainerId: string;
  createBooking: (input: {
    trainerId: string;
    date: string;
    slot: string;
    goal: string;
    note?: string;
  }) => void;
  rescheduleBooking: (id: string, date: string, slot: string) => void;
  cancelBooking: (id: string) => void;
  setBookingStatus: (id: string, status: BookingStatus) => void;
  toggleSlot: (date: string, slot: string) => void;
  markAllRead: (audience: Role) => void;
  markRead: (id: string) => void;
  sendMessage: (memberId: string, memberName: string, body: string) => void;
  checkIn: () => ScanResult;
  renewPlan: (planName: string) => void;
  updateMemberProfile: (patch: Partial<Member>) => void;
  staffScan: (memberId: string) => ScanResult;
  lastScanResult: ScanResult | null;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
  broadcast: (input: {
    audience: Role;
    title: string;
    body: string;
    kind: Notification["kind"];
  }) => void;
};

const GymContext = createContext<GymContextValue | null>(null);

const ACTIVE_TRAINER_ID = "t1";
const uid = () => Math.random().toString(36).slice(2, 9);

const nowTime = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export function GymProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageThread[]>(initialMessages);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [plans, setPlans] = useState<Plan[]>(seedPlans);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const lastScanAtRef = useRef<Record<string, number>>({});

  const currentMember = members[0]!;

  const sessionRole = session?.role ?? null;

  // Notifications live in the database: each user only sees and updates their own rows.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthUserId(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadNotifications = useCallback(async (uid: string, role: Role) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, kind, link, read_at, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return;
    setNotifications(
      (data ?? []).map((n) => ({
        id: n.id,
        audience: role,
        title: n.title,
        body: n.body,
        kind: n.kind as Notification["kind"],
        link: n.link,
        read: Boolean(n.read_at),
        time: new Date(n.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    );
  }, []);

  useEffect(() => {
    if (!authUserId || !sessionRole) {
      setNotifications([]);
      return;
    }
    const uid = authUserId;
    const role = sessionRole;
    let cancelled = false;
    void (async () => {
      // First visit: seed this account's feed with its role's welcome notifications.
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid);
      if (!cancelled && count === 0) {
        const seed = initialNotifications.filter((n) => n.audience === role);
        if (seed.length) {
          await supabase.from("notifications").insert(
            seed.map((n) => ({
              user_id: uid,
              title: n.title,
              body: n.body,
              kind: n.kind,
              read_at: n.read ? new Date().toISOString() : null,
            })),
          );
        }
      }
      if (!cancelled) await loadNotifications(uid, role);
    })();
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        () => void loadNotifications(uid, role),
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [authUserId, sessionRole, loadNotifications]);

  const pushNotification = useCallback(
    (audience: Role, title: string, body: string, kind: Notification["kind"]) => {
      if (!authUserId) return;
      if (audience === sessionRole) {
        const tempId = `tmp-${uid()}`;
        setNotifications((prev) => [
          { id: tempId, audience, title, body, time: `Today, ${nowTime()}`, kind, read: false },
          ...prev,
        ]);
        void supabase.from("notifications").insert({ user_id: authUserId, title, body, kind });
      } else {
        void supabase.rpc("notify_role", { _role: audience, _title: title, _body: body, _kind: kind });
      }
    },
    [authUserId, sessionRole],
  );

  const signIn = useCallback((role: Role, name?: string) => {
    setSession({ role, name: name?.trim() || identityFor(role).name, id: role });
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  const createBooking = useCallback<GymContextValue["createBooking"]>(
    ({ trainerId, date, slot, goal, note }) => {
      const trainer = trainers.find((t) => t.id === trainerId);
      if (!trainer) return;
      const booking: Booking = {
        id: uid(),
        memberId: currentMember.id,
        memberName: currentMember.name,
        trainerId,
        trainerName: trainer.name,
        date,
        slot,
        goal,
        note,
        status: "pending",
      };
      setBookings((prev) => [booking, ...prev]);
      pushNotification(
        "member",
        "Booking request sent",
        `${trainer.name} will confirm your ${slot} session shortly.`,
        "booking",
      );
      pushNotification(
        "trainer",
        "New booking request",
        `${currentMember.name} requested ${slot} — ${goal}.`,
        "booking",
      );
      toast.success("Booking request sent", { description: `${trainer.name} • ${slot}` });
    },
    [currentMember, pushNotification],
  );

  const rescheduleBooking = useCallback<GymContextValue["rescheduleBooking"]>(
    (id, date, slot) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, date, slot, status: "pending" } : b)),
      );
      pushNotification(
        "member",
        "Appointment rescheduled",
        `Your session moved to ${slot}. Awaiting trainer confirmation.`,
        "booking",
      );
      toast.success("Appointment rescheduled");
    },
    [pushNotification],
  );

  const cancelBooking = useCallback<GymContextValue["cancelBooking"]>(
    (id) => {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      pushNotification(
        "member",
        "Appointment cancelled",
        "Your session was cancelled. Your session credit was returned.",
        "booking",
      );
      toast("Appointment cancelled");
    },
    [pushNotification],
  );

  const setBookingStatus = useCallback<GymContextValue["setBookingStatus"]>(
    (id, status) => {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      const booking = bookings.find((b) => b.id === id);
      const label =
        status === "confirmed"
          ? "Appointment accepted"
          : status === "declined"
            ? "Appointment declined"
            : status === "completed"
              ? "Session marked completed"
              : "Appointment updated";
      pushNotification(
        "member",
        label,
        `${booking?.trainerName ?? "Your trainer"} — ${booking?.slot ?? ""} ${label.toLowerCase()}.`,
        "booking",
      );
      toast.success(label);
    },
    [bookings, pushNotification],
  );

  const toggleSlot = useCallback<GymContextValue["toggleSlot"]>((date, slot) => {
    setAvailability((prev) => {
      const current = prev[date] ?? TIME_SLOTS;
      const next = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
      return { ...prev, [date]: next };
    });
  }, []);

  const markAllRead = useCallback<GymContextValue["markAllRead"]>(
    (_audience) => {
      if (!authUserId) return;
      const before = notifications;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      void supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", authUserId)
        .is("read_at", null)
        .then(({ error }) => {
          if (error) {
            setNotifications(before);
            toast.error("Couldn't mark notifications as read", { description: error.message });
          } else toast.success("All notifications marked as read");
        });
    },
    [authUserId, notifications],
  );

  const markRead = useCallback<GymContextValue["markRead"]>((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (id.startsWith("tmp-")) return;
    void supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .is("read_at", null)
      .then(({ error }) => {
        if (error) {
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
          toast.error("Couldn't mark as read", { description: error.message });
        }
      });
  }, []);

  const sendMessage = useCallback<GymContextValue["sendMessage"]>(
    (memberId, memberName, body) => {
      setMessages((prev) => [
        {
          id: uid(),
          memberId,
          memberName,
          from: trainers[0]!.name,
          body,
          time: `Today, ${nowTime()}`,
        },
        ...prev,
      ]);
      pushNotification("member", `Message from ${trainers[0]!.name}`, body, "announcement");
      toast.success(`Sent to ${memberName}`);
    },
    [pushNotification],
  );

  const runScan = useCallback(
    (memberId: string, source: "turnstile" | "front-desk"): ScanResult => {
      const member = members.find((m) => m.id === memberId);
      const time = nowTime();
      const reject = (reason: string, detail: string): ScanResult => {
        const result = { ok: false as const, reason, detail };
        setLastScanResult(result);
        toast.error(reason, { description: detail });
        return result;
      };

      if (!member) return reject("Pass not recognised", "This QR code is not linked to any member.");

      const today = todayIso();
      const status = planStatusFor(member.expiresOn);
      if (status === "expired") {
        return reject(
          "Membership expired",
          `${member.name}'s plan expired on ${formatDate(member.expiresOn)}. Renew at the front desk before entry.`,
        );
      }

      const last = lastScanAtRef.current[memberId] ?? 0;
      const elapsed = Date.now() - last;
      if (elapsed < SCAN_COOLDOWN_MS) {
        return reject(
          "Duplicate scan blocked",
          `${member.name} was already scanned ${Math.max(1, Math.round(elapsed / 1000))}s ago. Wait ${Math.ceil(
            (SCAN_COOLDOWN_MS - elapsed) / 1000,
          )}s before scanning again.`,
        );
      }

      const todays = attendance.filter((a) => a.memberId === memberId && a.date === today);
      const checkedIn = todays.some((a) => a.kind === "check-in");
      const checkedOut = todays.some((a) => a.kind === "check-out");

      if (checkedIn && checkedOut) {
        return reject(
          "Visit already completed",
          `${member.name} has both a check-in and check-out logged today. Only one visit per day is allowed.`,
        );
      }

      const kind: Attendance["kind"] = checkedIn ? "check-out" : "check-in";
      lastScanAtRef.current[memberId] = Date.now();

      setAttendance((prev) => [
        {
          id: uid(),
          memberId,
          memberName: member.name,
          date: today,
          time,
          method: "QR Scan",
          kind,
        },
        ...prev,
      ]);

      const label = kind === "check-in" ? "Check-in" : "Check-out";
      pushNotification(
        "member",
        `${label} recorded`,
        `${member.name} scanned the Fitness Infinity QR pass at ${
          source === "turnstile" ? "the turnstile" : "the front desk"
        } at ${time}.`,
        "announcement",
      );
      pushNotification(
        "admin",
        `QR ${label.toLowerCase()} — ${member.name}`,
        `Recorded at ${time} via the ${source} scanner.`,
        "announcement",
      );

      const result: ScanResult = { ok: true, kind, memberName: member.name, time };
      setLastScanResult(result);
      toast.success(`${label} recorded for ${member.name}`, { description: time });
      return result;
    },
    [attendance, members, pushNotification],
  );

  const checkIn = useCallback<GymContextValue["checkIn"]>(
    () => runScan(currentMember.id, "turnstile"),
    [currentMember, runScan],
  );


  const renewPlan = useCallback<GymContextValue["renewPlan"]>(
    (planName) => {
      const expires = new Date();
      expires.setHours(12, 0, 0, 0);
      expires.setDate(expires.getDate() + 30);
      const expiresOn = `${expires.getFullYear()}-${String(expires.getMonth() + 1).padStart(2, "0")}-${String(
        expires.getDate(),
      ).padStart(2, "0")}`;
      setMembers((prev) =>
        prev.map((m, i) =>
          i === 0
            ? { ...m, plan: planName, expiresOn, planStatus: planStatusFor(expiresOn) }
            : m,
        ),
      );
      pushNotification(
        "member",
        "Membership renewed",
        `${planName} is active for another 30 days — new expiry ${formatDate(expiresOn)}.`,
        "membership",
      );
      toast.success(`${planName} renewed`);
    },
    [pushNotification],
  );

  const updateMemberProfile = useCallback<GymContextValue["updateMemberProfile"]>((patch) => {
    setMembers((prev) =>
      prev.map((m, i) => {
        if (i !== 0) return m;
        const next = { ...m, ...patch };
        return { ...next, planStatus: planStatusFor(next.expiresOn) };
      }),
    );
    toast.success("Profile updated");
  }, []);


  const staffScan = useCallback<GymContextValue["staffScan"]>(
    (memberId) => runScan(memberId, "front-desk"),
    [runScan],
  );

  const updatePlan = useCallback<GymContextValue["updatePlan"]>((id, patch) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    toast.success("Membership plan updated");
  }, []);

  const broadcast = useCallback<GymContextValue["broadcast"]>(
    ({ audience, title, body, kind }) => {
      pushNotification(audience, title, body, kind);
      toast.success("Notification sent", { description: title });
    },
    [pushNotification],
  );

  const value = useMemo<GymContextValue>(
    () => ({
      session,
      signIn,
      signOut,
      currentMember,
      members,
      bookings,
      attendance,
      notifications,
      messages,
      plans,
      availability,
      activeTrainerId: ACTIVE_TRAINER_ID,
      createBooking,
      rescheduleBooking,
      cancelBooking,
      setBookingStatus,
      toggleSlot,
      markAllRead,
      markRead,
      sendMessage,
      checkIn,
      renewPlan,
      updateMemberProfile,
      staffScan,
      lastScanResult,
      updatePlan,
      broadcast,
    }),
    [
      session,
      signIn,
      signOut,
      currentMember,
      members,
      bookings,
      attendance,
      notifications,
      messages,
      availability,
      createBooking,
      rescheduleBooking,
      cancelBooking,
      setBookingStatus,
      toggleSlot,
      markAllRead,
      markRead,
      sendMessage,
      checkIn,
      renewPlan,
      updateMemberProfile,
      staffScan,
      lastScanResult,
      updatePlan,
      broadcast,
      plans,
    ],
  );

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
}

export function slotsForDate(availability: Record<string, string[]>, date: string) {
  return availability[date] ?? TIME_SLOTS;
}
