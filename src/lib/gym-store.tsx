import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  initialAttendance,
  initialBookings,
  initialMessages,
  initialNotifications,
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
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [messages, setMessages] = useState<MessageThread[]>(initialMessages);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [plans, setPlans] = useState<Plan[]>(seedPlans);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const lastScanAtRef = useRef<Record<string, number>>({});

  const currentMember = members[0]!;

  const pushNotification = useCallback(
    (audience: Role, title: string, body: string, kind: Notification["kind"]) => {
      setNotifications((prev) => [
        { id: uid(), audience, title, body, time: `Today, ${nowTime()}`, kind, read: false },
        ...prev,
      ]);
    },
    [],
  );

  const signIn = useCallback((role: Role, name?: string) => {
    const fallback =
      role === "member" ? seedMembers[0]!.name : role === "trainer" ? trainers[0]!.name : "Gym Admin";
    setSession({ role, name: name?.trim() || fallback, id: role });
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

  const markAllRead = useCallback<GymContextValue["markAllRead"]>((audience) => {
    setNotifications((prev) =>
      prev.map((n) => (n.audience === audience ? { ...n, read: true } : n)),
    );
  }, []);

  const markRead = useCallback<GymContextValue["markRead"]>((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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

      const today = new Date().toISOString().slice(0, 10);
      if (member.planStatus === "expired" || member.expiresOn < today) {
        return reject(
          "Membership expired",
          `${member.name}'s plan expired on ${member.expiresOn}. Renew at the front desk before entry.`,
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
      expires.setDate(expires.getDate() + 30);
      setMembers((prev) =>
        prev.map((m, i) =>
          i === 0
            ? {
                ...m,
                plan: planName,
                planStatus: "active",
                expiresOn: expires.toISOString().slice(0, 10),
              }
            : m,
        ),
      );
      pushNotification(
        "member",
        "Membership renewed",
        `${planName} is active for another 30 days. Receipt sent to your email.`,
        "membership",
      );
      toast.success(`${planName} renewed`);
    },
    [pushNotification],
  );

  const updateMemberProfile = useCallback<GymContextValue["updateMemberProfile"]>((patch) => {
    setMembers((prev) => prev.map((m, i) => (i === 0 ? { ...m, ...patch } : m)));
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
