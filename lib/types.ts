export interface GameSession {
  id: number;
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
  perDay: { date: string; minutes: number }[];
}
