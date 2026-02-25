"use client";

import { useQuery } from "@tanstack/react-query";
import { Bug, ClipboardCheck, Gauge, History, LayoutDashboard, Layers3 } from "lucide-react";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useUiStore } from "@/lib/ui-store";

const cards = [
  {
    key: "openBugs",
    label: "Open Bugs",
    icon: Bug
  },
  {
    key: "sprintProgress",
    label: "Sprint Progress %",
    icon: Gauge
  },
  {
    key: "testCoverage",
    label: "Test Coverage %",
    icon: ClipboardCheck
  },
  {
    key: "recentActivity",
    label: "Recent Activity",
    icon: History
  }
] as const;

export function DashboardPage() {
  const collapsed = useUiStore((state) => state.collapsedSidebar);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("theme-dark");
    } else {
      html.classList.remove("theme-dark");
    }
  }, [
    theme
  ]);

  const healthQuery = useQuery({
    queryKey: [
      "health"
    ],
    queryFn: api.health
  });

  const summaryQuery = useQuery({
    queryKey: [
      "dashboard-summary"
    ],
    queryFn: api.dashboardSummary
  });

  const summary = summaryQuery.data;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[260px_1fr]">
        <aside
          className={`rounded-2xl bg-slate p-4 text-slate-100 shadow-soft transition-all ${
            collapsed ? "md:w-20" : "md:w-[260px]"
          }`}
        >
          <div className="mb-6 grid grid-cols-2 gap-2">
            <button
              onClick={toggleSidebar}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-white/10"
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-white/10"
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <LayoutDashboard size={16} /> {!collapsed && "Dashboard"}
            </p>
            <p className="flex items-center gap-2">
              <Layers3 size={16} /> {!collapsed && "Projects"}
            </p>
            <p className="flex items-center gap-2">
              <ClipboardCheck size={16} /> {!collapsed && "Tests"}
            </p>
            <p className="flex items-center gap-2">
              <Bug size={16} /> {!collapsed && "Bugs"}
            </p>
          </div>
        </aside>

        <main className="space-y-4">
          <header
            className={`rounded-2xl p-6 shadow-soft backdrop-blur ${
              theme === "light" ? "bg-white/80" : "bg-slate/70 text-slate-100"
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-pine">Krud Platform</p>
            <h1 className={`mt-2 text-3xl font-semibold ${theme === "light" ? "text-slate" : "text-slate-100"}`}>
              QA Test & Bug Management
            </h1>
            <p className={`mt-2 text-sm ${theme === "light" ? "text-slate/70" : "text-slate-200/80"}`}>
              API health:{" "}
              <span className="font-medium">
                {healthQuery.data?.status ?? (healthQuery.isLoading ? "checking..." : "offline")}
              </span>
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.key}
                  className={`rounded-2xl p-4 shadow-soft ${theme === "light" ? "bg-white" : "bg-slate/70 text-slate-100"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === "light" ? "text-slate/70" : "text-slate-200/75"}`}>
                      {card.label}
                    </span>
                    <Icon size={16} className="text-pine" />
                  </div>
                  <p className={`mt-4 text-3xl font-semibold ${theme === "light" ? "text-slate" : "text-slate-100"}`}>
                    {summary ? summary[card.key] : "--"}
                  </p>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
