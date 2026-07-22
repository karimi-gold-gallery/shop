import { Award, Sparkles } from "lucide-react";

import {
  getLevelProgress,
  LEVEL_LABELS,
  LEVEL_THRESHOLDS,
  type UserLevel,
} from "@/lib/user-levels";
import { formatToman, toPersianDigits } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LEVEL_BADGE: Record<UserLevel, "secondary" | "gold" | "navy"> = {
  1: "secondary",
  2: "gold",
  3: "navy",
};

export function UserLevelCard({ totalSpent }: { totalSpent: number }) {
  const progress = getLevelProgress(totalSpent);

  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy text-gold shadow-sm ring-1 ring-gold/25">
            <Award className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">سطح عضویت</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-navy">
                {LEVEL_LABELS[progress.level]}
              </h2>
              <Badge variant={LEVEL_BADGE[progress.level]}>
                سطح {toPersianDigits(progress.level)}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
              مجموع خریدهای تسویه‌شده شما:{" "}
              <span className="font-semibold text-navy">
                {toPersianDigits(formatToman(progress.totalSpent))}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progress.level === 3 ? "bg-emerald-500" : "gold-gradient"
            )}
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        {progress.nextLevel && progress.remainingToNext != null ? (
          <div className="flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm leading-7 text-muted-foreground">
            <Sparkles className="mt-1 size-4 shrink-0 text-gold" />
            <p>
              برای رسیدن به{" "}
              <span className="font-semibold text-navy">
                {LEVEL_LABELS[progress.nextLevel]}
              </span>{" "}
              باید{" "}
              <span className="font-semibold text-navy">
                {toPersianDigits(formatToman(progress.remainingToNext))}
              </span>{" "}
              دیگر خرید کنید
              {progress.nextThreshold != null ? (
                <>
                  {" "}
                  (آستانه:{" "}
                  {toPersianDigits(formatToman(progress.nextThreshold))})
                </>
              ) : null}
              .
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm leading-7 text-emerald-800">
            <Sparkles className="mt-1 size-4 shrink-0 text-emerald-600" />
            <p>شما به بالاترین سطح رسیده‌اید. از همراهی‌تان سپاسگزاریم.</p>
          </div>
        )}

        <ul className="grid gap-2 sm:grid-cols-3">
          {([1, 2, 3] as const).map((lvl) => {
            const unlocked = progress.level >= lvl;
            return (
              <li
                key={lvl}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-center text-xs",
                  unlocked
                    ? "border-gold/40 bg-gold/10 text-navy"
                    : "border-border/70 bg-card text-muted-foreground"
                )}
              >
                <p className="font-bold">{LEVEL_LABELS[lvl]}</p>
                <p className="mt-0.5">
                  از {toPersianDigits(formatToman(LEVEL_THRESHOLDS[lvl]))}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
