"use client";

import { useEffect, useState } from "react";

import {
  getFilters,
  getMatches,
  getNotificationsStatus,
  getSavedListings,
  getSyncStatus,
  withAuthenticatedSession,
} from "@/lib/api";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState([
    { label: "Active filters", value: 0 },
    { label: "New matches", value: 0 },
    { label: "Saved listings", value: 0 },
    { label: "Notifications sent", value: 0 },
  ]);
  const [activity, setActivity] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [filters, matches, saved, notifications, sync] =
          await withAuthenticatedSession(async (token) => {
            return Promise.all([
              getFilters(token),
              getMatches(token),
              getSavedListings(token),
              getNotificationsStatus(token),
              getSyncStatus(token),
            ]);
          });

        setMetrics([
          { label: "Active filters", value: filters.items.length },
          { label: "New matches", value: matches.items.length },
          { label: "Saved listings", value: saved.items.length },
          {
            label: "Notifications sent",
            value: notifications.metrics.sentCount,
          },
        ]);

        const firstLag = sync.states.at(0)?.lagSeconds;
        setActivity([
          `${matches.items.length} matches currently available for review.`,
          `${saved.items.length} listings are currently bookmarked.`,
          firstLag != null
            ? `Latest sync lag: ${firstLag}s.`
            : "No sync state available yet.",
        ]);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Failed to load dashboard",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="stack-lg">
      <section className="hero compact">
        <p className="eyebrow">Dashboard</p>
        <h1>Overview</h1>
        <p>Quick snapshot of matching and alert activity for your account.</p>
      </section>

      <section className="grid four-col">
        {metrics.map((item) => (
          <article key={item.label} className="metric-card">
            <p className="metric-value">{item.value}</p>
            <p className="metric-label">{item.label}</p>
          </article>
        ))}
      </section>

      {isLoading && <p className="notice">Loading dashboard...</p>}
      {error && <p className="notice error">{error}</p>}

      <section className="panel stack-sm">
        <h2>Recent activity</h2>
        <ul className="list">
          {activity.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
