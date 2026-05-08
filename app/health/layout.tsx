"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const SUB_TABS = [
  { href: "/health/fitness", label: "Fitness" },
];

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {SUB_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-[36px] flex items-center"
              style={{ color: active ? "var(--foreground)" : "var(--foreground-muted)" }}
            >
              {active && (
                <motion.span
                  layoutId="health-sub-pill"
                  className="absolute inset-0 rounded-md bg-[var(--surface-elevated)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
