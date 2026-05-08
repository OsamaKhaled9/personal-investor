"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const SUB_TABS = [
  { href: "/wealth/portfolio", label: "Portfolio" },
  { href: "/wealth/market",    label: "Market" },
  { href: "/wealth/watchlist", label: "Watchlist" },
  { href: "/wealth/chat",      label: "AI Analyst" },
  { href: "/wealth/alerts",    label: "Alerts" },
];

export default function WealthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {SUB_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-shrink-0 min-h-[36px] flex items-center"
              style={{ color: active ? "var(--foreground)" : "var(--foreground-muted)" }}
            >
              {active && (
                <motion.span
                  layoutId="wealth-sub-pill"
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
