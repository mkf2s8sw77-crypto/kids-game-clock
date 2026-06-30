export interface Child {
  id: number;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: string;
}

export interface GameSession {
  id: number;
  childId: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  source: "device" | "manual" | string;
  note: string | null;
  createdAt: string;
}

export interface WeeklyBonus {
  id: number;
  weekStartDate: string;
  minutes: number;
  reason: string;
  createdAt: string;
}

export interface WeekStats {
  weekStartDate: string;
  weekEndDate: string;
  weekStartUTC: string;
  weekEndUTC: string;
  quotaMinutes: number;
  bonusMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  activeSession: GameSession | null;
  perChild: { childId: number; childName: string; color: string; minutes: number }[];
  perDay: { date: string; minutes: number }[];
}
