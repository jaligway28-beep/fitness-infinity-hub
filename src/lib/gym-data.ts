export type Role = "member" | "trainer" | "admin";

export type BookingStatus = "pending" | "confirmed" | "declined" | "completed" | "cancelled";

export type Trainer = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  sessions: number;
  bio: string;
  initials: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: string;
  planStatus: "active" | "expiring" | "expired";
  expiresOn: string;
  goal: string;
  joinedOn: string;
};

export type Booking = {
  id: string;
  memberId: string;
  memberName: string;
  trainerId: string;
  trainerName: string;
  date: string; // yyyy-mm-dd
  slot: string;
  goal: string;
  note?: string | undefined;
  status: BookingStatus;
};

export type Attendance = {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  time: string;
  method: "QR Scan" | "Front Desk";
  kind: "check-in" | "check-out";
};

export type Notification = {
  id: string;
  audience: Role;
  title: string;
  body: string;
  time: string;
  kind: "booking" | "reminder" | "membership" | "announcement";
  read: boolean;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  period: string;
  perks: string[];
  featured?: boolean;
};

export type MessageThread = {
  id: string;
  memberId: string;
  memberName: string;
  from: string;
  body: string;
  time: string;
};

/** Local (not UTC) yyyy-mm-dd so "today" never drifts a day in +08:00. */
export const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const isoDay = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return toIso(d);
};

/** Single source of truth for "today" used by every screen. */
export const todayIso = () => isoDay(0);

/** Whole days between today and an iso date (negative = in the past). */
export const daysUntil = (iso: string) => {
  const start = new Date(`${todayIso()}T00:00:00`).getTime();
  const end = new Date(`${iso}T00:00:00`).getTime();
  return Math.round((end - start) / 86_400_000);
};

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const dayLabel = (iso: string) => {
  if (iso === todayIso()) return "Today";
  if (iso === isoDay(1)) return "Tomorrow";
  if (iso === isoDay(-1)) return "Yesterday";
  return formatDate(iso);
};

export const EXPIRING_WINDOW_DAYS = 7;

/** Membership status is always derived from the expiry date — never stored twice. */
export const planStatusFor = (expiresOn: string): Member["planStatus"] => {
  const days = daysUntil(expiresOn);
  if (days < 0) return "expired";
  if (days <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "active";
};

export const TIME_SLOTS = [
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "10:00 AM",
  "01:00 PM",
  "03:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

export const FITNESS_GOALS = [
  "Weight loss",
  "Muscle gain",
  "Strength & powerlifting",
  "Endurance & cardio",
  "Mobility & rehab",
  "General fitness",
];

export const trainers: Trainer[] = [
  {
    id: "t1",
    name: "Coach Marco Reyes",
    specialty: "Strength & Conditioning",
    rating: 4.9,
    sessions: 812,
    bio: "12 years coaching powerlifting and hypertrophy programs for all levels.",
    initials: "MR",
  },
  {
    id: "t2",
    name: "Coach Bea Santillan",
    specialty: "HIIT & Fat Loss",
    rating: 4.8,
    sessions: 640,
    bio: "Metabolic conditioning specialist focused on sustainable fat loss.",
    initials: "BS",
  },
  {
    id: "t3",
    name: "Coach Dan Villa",
    specialty: "Mobility & Rehab",
    rating: 4.7,
    sessions: 415,
    bio: "Movement screening, corrective work and post-injury return to training.",
    initials: "DV",
  },
  {
    id: "t4",
    name: "Coach Iris Lim",
    specialty: "Endurance & Cycling",
    rating: 4.9,
    sessions: 523,
    bio: "Builds engine work for runners, cyclists and hybrid athletes.",
    initials: "IL",
  },
];

const memberSeeds: Omit<Member, "planStatus">[] = [
  {
    id: "m1",
    name: "Jayson Aligway Jr.",
    email: "jayson@fitnessinfinity.app",
    initials: "JA",
    plan: "Infinity Pro",
    expiresOn: isoDay(23),
    goal: "Muscle gain",
    joinedOn: "2025-11-04",
  },
  {
    id: "m2",
    name: "Cathy Bautista",
    email: "cathy@example.com",
    initials: "CB",
    plan: "Infinity Basic",
    expiresOn: isoDay(4),
    goal: "Weight loss",
    joinedOn: "2026-01-18",
  },
  {
    id: "m3",
    name: "Leo Ramirez",
    email: "leo@example.com",
    initials: "LR",
    plan: "Infinity Pro",
    expiresOn: isoDay(60),
    goal: "Strength & powerlifting",
    joinedOn: "2025-08-02",
  },
  {
    id: "m4",
    name: "Nina Cruz",
    email: "nina@example.com",
    initials: "NC",
    plan: "Infinity Elite",
    expiresOn: isoDay(140),
    goal: "Endurance & cardio",
    joinedOn: "2026-03-11",
  },
  {
    id: "m5",
    name: "Paolo Diaz",
    email: "paolo@example.com",
    initials: "PD",
    plan: "Infinity Basic",
    expiresOn: isoDay(-6),
    goal: "General fitness",
    joinedOn: "2025-05-27",
  },
];

export const members: Member[] = memberSeeds.map((m) => ({
  ...m,
  planStatus: planStatusFor(m.expiresOn),
}));

export const plans: Plan[] = [
  {
    id: "p1",
    name: "Infinity Basic",
    price: 899,
    period: "month",
    perks: ["Gym floor access", "QR entry pass", "1 group class / week"],
  },
  {
    id: "p2",
    name: "Infinity Pro",
    price: 1499,
    period: "month",
    perks: [
      "Unlimited gym access",
      "4 trainer sessions / month",
      "Unlimited group classes",
      "Body composition scan",
    ],
    featured: true,
  },
  {
    id: "p3",
    name: "Infinity Elite",
    price: 2599,
    period: "month",
    perks: [
      "Everything in Pro",
      "10 trainer sessions / month",
      "Nutrition coaching",
      "Recovery lounge & sauna",
    ],
  },
];

export const initialBookings: Booking[] = [
  {
    id: "b1",
    memberId: "m1",
    memberName: "Jayson Aligway Jr.",
    trainerId: "t1",
    trainerName: "Coach Marco Reyes",
    date: isoDay(0),
    slot: "06:00 PM",
    goal: "Muscle gain",
    note: "Focus on upper body push day.",
    status: "confirmed",
  },
  {
    id: "b2",
    memberId: "m1",
    memberName: "Jayson Aligway Jr.",
    trainerId: "t3",
    trainerName: "Coach Dan Villa",
    date: isoDay(3),
    slot: "07:00 AM",
    goal: "Mobility & rehab",
    status: "pending",
  },
  {
    id: "b3",
    memberId: "m2",
    memberName: "Cathy Bautista",
    trainerId: "t1",
    trainerName: "Coach Marco Reyes",
    date: isoDay(0),
    slot: "08:00 AM",
    goal: "Weight loss",
    note: "Prefers low-impact conditioning.",
    status: "confirmed",
  },
  {
    id: "b4",
    memberId: "m3",
    memberName: "Leo Ramirez",
    trainerId: "t1",
    trainerName: "Coach Marco Reyes",
    date: isoDay(0),
    slot: "05:00 PM",
    goal: "Strength & powerlifting",
    status: "pending",
  },
  {
    id: "b5",
    memberId: "m4",
    memberName: "Nina Cruz",
    trainerId: "t1",
    trainerName: "Coach Marco Reyes",
    date: isoDay(1),
    slot: "10:00 AM",
    goal: "Endurance & cardio",
    status: "confirmed",
  },
  {
    id: "b6",
    memberId: "m1",
    memberName: "Jayson Aligway Jr.",
    trainerId: "t2",
    trainerName: "Coach Bea Santillan",
    date: isoDay(-4),
    slot: "07:00 PM",
    goal: "Muscle gain",
    status: "completed",
  },
  {
    id: "b7",
    memberId: "m5",
    memberName: "Paolo Diaz",
    trainerId: "t1",
    trainerName: "Coach Marco Reyes",
    date: isoDay(-2),
    slot: "03:00 PM",
    goal: "General fitness",
    status: "completed",
  },
];

export const initialAttendance: Attendance[] = [
  {
    id: "a1",
    memberId: "m1",
    memberName: "Jayson Aligway Jr.",
    date: isoDay(0),
    time: "05:42 PM",
    method: "QR Scan",
    kind: "check-in",
  },
  {
    id: "a2",
    memberId: "m1",
    memberName: "Jayson Aligway Jr.",
    date: isoDay(-1),
    time: "06:12 PM",
    method: "QR Scan",
    kind: "check-in",
  },
  {
    id: "a3",
    memberId: "m2",
    memberName: "Cathy Bautista",
    date: isoDay(0),
    time: "07:50 AM",
    method: "QR Scan",
    kind: "check-in",
  },
  {
    id: "a4",
    memberId: "m1",
    memberName: "Jayson Aligway Jr.",
    date: isoDay(-3),
    time: "07:03 AM",
    method: "Front Desk",
    kind: "check-in",
  },
  {
    id: "a5",
    memberId: "m3",
    memberName: "Leo Ramirez",
    date: isoDay(-1),
    time: "04:37 PM",
    method: "QR Scan",
    kind: "check-out",
  },
];

const seedBooking = (id: string) => initialBookings.find((b) => b.id === id)!;
const slotOrder = (slot: string) => TIME_SLOTS.indexOf(slot);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const jayson = members[0]!;
const jaysonDaysLeft = daysUntil(jayson.expiresOn);

const confirmedToday = seedBooking("b1");
const mobilitySession = seedBooking("b2");
const pendingRequest = seedBooking("b4");

const trainerTodaySlots = initialBookings
  .filter(
    (b) => b.trainerId === "t1" && b.date === todayIso() && b.status !== "cancelled",
  )
  .sort((a, b) => slotOrder(a.slot) - slotOrder(b.slot));

const expiringSoon = members.filter((m) => m.planStatus !== "active");

export const initialNotifications: Notification[] = [
  {
    id: "n1",
    audience: "member",
    title: "Appointment confirmed",
    body: `${confirmedToday.trainerName} confirmed your session today at ${confirmedToday.slot}.`,
    time: "2 hours ago",
    kind: "booking",
    read: false,
  },
  {
    id: "n2",
    audience: "member",
    title: "Session reminder",
    body: `Your ${mobilitySession.goal.toLowerCase()} session with ${mobilitySession.trainerName} is in ${plural(
      daysUntil(mobilitySession.date),
      "day",
    )} at ${mobilitySession.slot} (${formatDate(mobilitySession.date)}).`,
    time: "5 hours ago",
    kind: "reminder",
    read: false,
  },
  {
    id: "n3",
    audience: "member",
    title: "Membership renewal reminder",
    body: `Your ${jayson.plan} plan renews in ${plural(jaysonDaysLeft, "day")} on ${formatDate(
      jayson.expiresOn,
    )}. Auto-renew is on.`,
    time: "Yesterday",
    kind: "membership",
    read: true,
  },
  {
    id: "n4",
    audience: "member",
    title: "Gym announcement",
    body: "New squat racks arrive Monday. Zone B closed 9-11 AM for setup.",
    time: "2 days ago",
    kind: "announcement",
    read: true,
  },
  {
    id: "n5",
    audience: "trainer",
    title: "New booking request",
    body: `${pendingRequest.memberName} requested ${dayLabel(pendingRequest.date).toLowerCase()} at ${
      pendingRequest.slot
    } — ${pendingRequest.goal}.`,
    time: "1 hour ago",
    kind: "booking",
    read: false,
  },
  {
    id: "n6",
    audience: "trainer",
    title: "Schedule reminder",
    body: `You have ${plural(trainerTodaySlots.length, "session")} today.${
      trainerTodaySlots[0] ? ` First one starts at ${trainerTodaySlots[0].slot}.` : ""
    }`,
    time: "Today, 6:00 AM",
    kind: "reminder",
    read: true,
  },
  {
    id: "n7",
    audience: "admin",
    title: `${plural(expiringSoon.length, "membership")} expiring or expired`,
    body: "Automated renewal reminders were sent to affected members.",
    time: "Today, 7:00 AM",
    kind: "membership",
    read: false,
  },
];

export const initialMessages: MessageThread[] = [
  {
    id: "msg1",
    memberId: "m1",
    memberName: "Jayson Aligway Jr.",
    from: "Coach Marco Reyes",
    body: "Great pressing session. Add 2 sets of face pulls before we meet next.",
    time: "Yesterday",
  },
];

/**
 * Weekly QR attendance derived from the live attendance log (last 7 days,
 * oldest first) so charts always agree with the entry lists.
 */
export const attendanceTrendFrom = (rows: Attendance[]) =>
  Array.from({ length: 7 }, (_, i) => {
    const iso = isoDay(i - 6);
    return {
      day: new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
      iso,
      checkins: rows.filter((r) => r.date === iso && r.kind === "check-in").length,
      checkouts: rows.filter((r) => r.date === iso && r.kind === "check-out").length,
    };
  });


export const nextDays = (count: number) =>
  Array.from({ length: count }, (_, i) => isoDay(i));
