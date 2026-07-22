/** Customer loyalty levels based on sum of paid/finished order totals (تومان). */
export const USER_LEVELS = [1, 2, 3] as const;
export type UserLevel = (typeof USER_LEVELS)[number];

/** Minimum total spent (تومان) required to reach each level. */
export const LEVEL_THRESHOLDS: Record<UserLevel, number> = {
  1: 0,
  2: 50_000_000,
  3: 200_000_000,
};

export const LEVEL_LABELS: Record<UserLevel, string> = {
  1: "سطح ۱",
  2: "سطح ۲",
  3: "سطح ۳",
};

/** Order statuses that count toward spending / level-up. */
export const LEVEL_COUNTABLE_STATUSES = ["PAID", "FINISHED"] as const;

export function getLevelFromSpend(totalSpent: number): UserLevel {
  if (totalSpent >= LEVEL_THRESHOLDS[3]) return 3;
  if (totalSpent >= LEVEL_THRESHOLDS[2]) return 2;
  return 1;
}

export function getNextLevel(level: UserLevel): UserLevel | null {
  if (level >= 3) return null;
  return (level + 1) as UserLevel;
}

export type LevelProgress = {
  level: UserLevel;
  totalSpent: number;
  nextLevel: UserLevel | null;
  nextThreshold: number | null;
  remainingToNext: number | null;
  /** 0–100 progress toward the next level; 100 when maxed. */
  progressPercent: number;
};

export function getLevelProgress(totalSpent: number): LevelProgress {
  const level = getLevelFromSpend(totalSpent);
  const nextLevel = getNextLevel(level);

  if (!nextLevel) {
    return {
      level,
      totalSpent,
      nextLevel: null,
      nextThreshold: null,
      remainingToNext: null,
      progressPercent: 100,
    };
  }

  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel];
  const span = nextThreshold - currentThreshold;
  const progressed = Math.max(0, totalSpent - currentThreshold);
  const remainingToNext = Math.max(0, nextThreshold - totalSpent);
  const progressPercent =
    span <= 0 ? 100 : Math.min(100, Math.round((progressed / span) * 100));

  return {
    level,
    totalSpent,
    nextLevel,
    nextThreshold,
    remainingToNext,
    progressPercent,
  };
}
