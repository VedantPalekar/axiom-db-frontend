"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { useRunProfile } from "../../hooks/use-profiling";

export function ProfilingForm() {
  const [connectionUrl, setConnectionUrl] = useState("");
  const [schemas, setSchemas] = useState("");
  const [tableLimit, setTableLimit] = useState("");
  const runProfileMutation = useRunProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionUrl.trim()) return;

    runProfileMutation.mutate({
      connection_url: connectionUrl.trim(),
      schemas: schemas ? schemas.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      table_limit: tableLimit ? parseInt(tableLimit, 10) : undefined,
    }, {
      onSuccess: () => {
        setConnectionUrl("");
        setSchemas("");
        setTableLimit("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-stone-900 mb-4">Run New Profiling</h3>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto] items-end">
        <div className="space-y-2">
          <label htmlFor="connection_url" className="text-sm font-medium text-stone-700">Connection URL *</label>
          <input
            id="connection_url"
            type="text"
            placeholder="postgresql://user:pass@localhost:5432/db"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            value={connectionUrl}
            onChange={(e) => setConnectionUrl(e.target.value)}
            disabled={runProfileMutation.isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="schemas" className="text-sm font-medium text-stone-700">Schemas</label>
          <input
            id="schemas"
            type="text"
            placeholder="public, auth (optional)"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 sm:w-48"
            value={schemas}
            onChange={(e) => setSchemas(e.target.value)}
            disabled={runProfileMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="table_limit" className="text-sm font-medium text-stone-700">Limit</label>
          <input
            id="table_limit"
            type="number"
            placeholder="No limit"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 sm:w-28"
            value={tableLimit}
            onChange={(e) => setTableLimit(e.target.value)}
            disabled={runProfileMutation.isPending}
            min="1"
          />
        </div>
        <button
          type="submit"
          disabled={!connectionUrl.trim() || runProfileMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50 transition-colors h-9"
        >
          {runProfileMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          Run
        </button>
      </div>
      {runProfileMutation.isError && (
        <p className="mt-3 text-sm text-rose-600">
          Failed to run profiling: {runProfileMutation.error?.message}
        </p>
      )}
    </form>
  );
}
