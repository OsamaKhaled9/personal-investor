"use client";
import { motion } from "framer-motion";
import type { Khatma } from "@/lib/types";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function computeDailyGoal(
  khatma: Khatma | null,
  todayPages: number
): { goal: number; label: string } {
  void todayPages;
  if (!khatma) return { goal: 10, label: "Default goal" };
  const today = new Date();
  const target = new Date(khatma.target_date);
  const daysLeft = Math.max(
    1,
    Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
  );
  const pagesLeft = 604 - khatma.current_page;
  const goal = Math.ceil(pagesLeft / daysLeft);
  const formatted = target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return { goal, label: `Khatma by ${formatted}` };
}

type Props = {
  streak: number;
  pagesRead: number;
  goal: number;
  goalLabel: string;
};

export function HeaderCard({ streak, pagesRead, goal, goalLabel }: Props) {
  const progress = goal > 0 ? Math.min(pagesRead / goal, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);
  const goalMet = pagesRead >= goal && goal > 0;
  const ringColor = goalMet ? "var(--accent-green)" : "var(--hayati-gold-400)";

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "rgba(201,145,61,0.18)",
        background: "var(--surface)",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="shrink-0 min-w-[64px]">
          {streak > 0 ? (
            <>
              <p
                className="font-mono font-bold text-2xl leading-none"
                style={{ color: "var(--hayati-gold-400)" }}
              >
                🔥 {streak}
              </p>
              <p
                className="font-mono text-[9px] uppercase tracking-widest mt-1"
                style={{ color: "var(--foreground-muted)" }}
              >
                day streak
              </p>
            </>
          ) : (
            <p
              className="font-mono text-[10px]"
              style={{ color: "var(--foreground-muted)" }}
            >
              Start your
              <br />
              streak today
            </p>
          )}
        </div>

        {/* Progress ring + goal info */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* SVG ring */}
          <div className="relative shrink-0 w-16 h-16">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx="32"
                cy="32"
                r={RADIUS}
                fill="none"
                stroke="var(--surface-elevated)"
                strokeWidth="5"
              />
              <motion.circle
                cx="32"
                cy="32"
                r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                animate={{ strokeDashoffset: offset }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                style={{ strokeDashoffset: CIRCUMFERENCE }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-mono text-[9px] font-bold tabular-nums text-center leading-tight"
                style={{ color: ringColor }}
              >
                {pagesRead}
                <br />
                <span style={{ color: "var(--foreground-muted)" }}>
                  /{goal}
                </span>
              </span>
            </div>
          </div>

          {/* Text labels */}
          <div className="min-w-0">
            <p
              className="font-mono text-sm font-semibold tabular-nums"
              style={{ color: "var(--foreground)" }}
            >
              {pagesRead} / {goal} pages
            </p>
            <p
              className="font-mono text-[10px]"
              style={{ color: "var(--foreground-muted)" }}
            >
              today&apos;s goal
            </p>
            <p
              className="font-mono text-[10px] mt-0.5"
              style={{ color: "var(--foreground-muted)" }}
            >
              {goalLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
