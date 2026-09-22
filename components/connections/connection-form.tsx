"use client";

import { useState } from "react";
import { Loader2, Database } from "lucide-react";
import { useCreateConnection } from "../../hooks/use-connections";

export function ConnectionForm() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schemas, setSchemas] = useState("");
  const [serviceName, setServiceName] = useState("");
  
  const createConnectionMutation = useCreateConnection();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim() || !database.trim() || !username.trim() || !password.trim()) return;

    createConnectionMutation.mutate({
      host: host.trim(),
      port: parseInt(port, 10) || 5432,
      database: database.trim(),
      username: username.trim(),
      password: password.trim(),
      schemas: schemas ? schemas.split(",").map(s => s.trim()).filter(Boolean) : [],
      service_name: serviceName.trim() || undefined,
    }, {
      onSuccess: () => {
        setHost("");
        setPort("5432");
        setDatabase("");
        setUsername("");
        setPassword("");
        setSchemas("");
        setServiceName("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-stone-900 mb-4">Connect New Database</h3>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-[1fr_100px_1fr_1fr_1fr_1fr] items-end">
        <div className="space-y-2">
          <label htmlFor="host" className="text-xs font-medium text-stone-700">Host *</label>
          <input
            id="host"
            type="text"
            placeholder="db.example.com"
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            disabled={createConnectionMutation.isPending}
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="port" className="text-xs font-medium text-stone-700">Port *</label>
          <input
            id="port"
            type="number"
            placeholder="5432"
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            disabled={createConnectionMutation.isPending}
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="database" className="text-xs font-medium text-stone-700">Database *</label>
          <input
            id="database"
            type="text"
            placeholder="postgres"
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            disabled={createConnectionMutation.isPending}
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="username" className="text-xs font-medium text-stone-700">Username *</label>
          <input
            id="username"
            type="text"
            placeholder="admin"
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={createConnectionMutation.isPending}
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-medium text-stone-700">Password *</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={createConnectionMutation.isPending}
            required
            suppressHydrationWarning
          />
        </div>
        
        <div className="col-span-full xl:col-span-1 grid grid-cols-2 xl:grid-cols-1 gap-4 xl:gap-2">
           <div className="space-y-2 col-span-1">
             <label htmlFor="schemas" className="text-xs font-medium text-stone-700">Schemas</label>
             <input
               id="schemas"
               type="text"
               placeholder="public, auth"
               className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
               value={schemas}
               onChange={(e) => setSchemas(e.target.value)}
               disabled={createConnectionMutation.isPending}
               suppressHydrationWarning
             />
           </div>
           
           <div className="space-y-2 col-span-1">
             <label htmlFor="serviceName" className="text-xs font-medium text-stone-700">Service Name</label>
             <input
               id="serviceName"
               type="text"
               placeholder="prod-db"
               className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
               value={serviceName}
               onChange={(e) => setServiceName(e.target.value)}
               disabled={createConnectionMutation.isPending}
               suppressHydrationWarning
             />
           </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-stone-500">Provide credentials to securely connect and profile your database schema.</p>
        <button
          type="submit"
          disabled={!host.trim() || !database.trim() || !username.trim() || !password.trim() || createConnectionMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:opacity-50 transition-colors h-9"
        >
          {createConnectionMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Connect Database
        </button>
      </div>

      {createConnectionMutation.isError && (
        <div className="mt-4 rounded-md bg-rose-50 p-3 outline outline-1 outline-rose-200">
          <p className="text-sm text-rose-600">
            Connection failed: {createConnectionMutation.error?.message}
          </p>
        </div>
      )}
    </form>
  );
}
