"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useReProfileConnection } from "../../hooks/use-connections";
import { ConnectionSummary } from "../../lib/types";

interface ReProfileModalProps {
  connection: ConnectionSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReProfileModal({ connection, onClose, onSuccess }: ReProfileModalProps) {
  const mutation = useReProfileConnection();

  const [hintHost, hintPortDb] = (connection.connection_hint || "").split(":");
  const hintPort = hintPortDb ? hintPortDb.split("/")[0] : "5432";

  const [host, setHost] = useState(hintHost || "localhost");
  const [port, setPort] = useState(hintPort || "5432");
  const [database, setDatabase] = useState(connection.db_name || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schemas, setSchemas] = useState(connection.schema_names?.join(", ") || "public");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    mutation.mutate(
      {
        id: connection.connection_id,
        body: {
          host,
          port: parseInt(port, 10) || 5432,
          database,
          username,
          password,
          schemas: schemas.split(",").map((s) => s.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Re-Profile Database</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 rounded-md bg-amber-50 p-3 border border-amber-200">
            <p className="text-xs text-amber-800">
              Credentials are required because AxiomDB never stores passwords. 
              The re-profile job will run in the background.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Host</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Port</label>
              <input
                type="number"
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-stone-700">Database</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Username</label>
              <input
                type="text"
                required
                autoFocus
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-stone-700">Schemas (comma-separated)</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={schemas}
                onChange={(e) => setSchemas(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          {mutation.isError && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 flex gap-2 items-start text-rose-700">
              <AlertCircle className="shrink-0 h-4 w-4 mt-0.5" />
              <p className="text-sm">
                {mutation.error?.message || "Connection failed. Please check your credentials."}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !username || !password}
              className="inline-flex min-w-[124px] items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Start Re-Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
