"use client";

import { useStore } from "@/store/useStore";
import { format } from "date-fns";

export function RecentTransactionsPanel() {
  const { systemState } = useStore();

  if (!systemState) return null;

  const fills = [...(systemState.liveFills || [])].slice(0, 6);

  return (
    <div className="border border-border-primary rounded-lg p-4 bg-bg-secondary">
      <h2 className="text-lg font-bold text-text-primary mb-4">📜 RECENT TRANSACTIONS</h2>

      {fills.length === 0 ? (
        <div className="text-text-dim text-center py-8">No recent transactions.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-secondary text-text-dim">
                <th className="text-left py-2 px-2">TIME</th>
                <th className="text-left py-2 px-2">SIDE</th>
                <th className="text-left py-2 px-2">PRICE</th>
                <th className="text-left py-2 px-2">SIZE</th>
                <th className="text-left py-2 px-2">STRATEGY</th>
                <th className="text-left py-2 px-2">REASON</th>
              </tr>
            </thead>
            <tbody>
              {fills.map((fill, i) => (
                <tr key={i} className="border-b border-border-secondary/50">
                  <td className="py-2 px-2 text-text-dim">
                    {format(new Date(fill.t), "HH:mm:ss")}
                  </td>
                  <td className={`py-2 px-2 font-mono ${fill.leg === "UP" ? "text-accent-green" : "text-accent-red"}`}>
                    {fill.leg}
                  </td>
                  <td className="py-2 px-2 font-mono">{fill.price.toFixed(4)}</td>
                  <td className="py-2 px-2">{fill.size}</td>
                  <td className="py-2 px-2 text-text-secondary">{fill.strategy || "—"}</td>
                  <td className="py-2 px-2 text-text-dim text-xs">{fill.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

