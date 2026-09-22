"use client";

import { useState, useEffect } from "react";
import { useConnectionHealth, useLiveTable } from "../../hooks/use-connections";
import { LoadingSkeleton } from "../shared/loading-skeleton";
import { EmptyState } from "../shared/empty-state";
import { Table as TableIcon } from "lucide-react";

interface LiveTableViewerProps {
  connectionId: string;
}

export function LiveTableViewer({ connectionId }: LiveTableViewerProps) {
  const { data: healthData, isLoading: isHealthLoading } = useConnectionHealth(connectionId);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  useEffect(() => {
    if (healthData && healthData.tables.length > 0 && !selectedTable) {
      const firstDirty = healthData.tables.find(t => t.status === "dirty");
      const target = firstDirty || healthData.tables[0];
      setSelectedTable(target.table_name);
      setSelectedSchema(target.schema);
    }
  }, [healthData, selectedTable]);

  const { data: tableData, isLoading: isTableLoading, isError, error } = useLiveTable(
    connectionId,
    selectedTable,
    selectedSchema || "public"
  );

  if (isHealthLoading && !selectedTable) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm flex flex-col">
         <div className="p-4 border-b border-stone-200 bg-stone-50">
            <LoadingSkeleton className="h-6 w-1/4" />
         </div>
         <div className="p-6">
            <LoadingSkeleton className="h-48 w-full" />
         </div>
      </div>
    );
  }

  // If we have health data but it's empty, or no selected table set yet
  if (!selectedTable) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Live Data Viewer</h3>
            {tableData ? (
              <p className="text-xs text-stone-500 mt-0.5 font-medium">
                Showing {tableData.returned_rows} of {tableData.total_rows} rows
              </p>
            ) : (
              <p className="text-xs text-stone-500 mt-0.5">Fetching table data...</p>
            )}
          </div>
        </div>
        
        {healthData && healthData.tables.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Table</label>
            <select
              className="text-sm font-medium border-stone-200 text-stone-700 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8"
              value={`${selectedSchema}.${selectedTable}`}
              onChange={(e) => {
                const [sch, tab] = e.target.value.split(".");
                setSelectedSchema(sch);
                setSelectedTable(tab);
              }}
            >
              {healthData.tables.map(t => (
                <option key={`${t.schema}.${t.table_name}`} value={`${t.schema}.${t.table_name}`}>
                  {t.schema}.{t.table_name} {t.status === "dirty" ? " (Dirty)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-0 overflow-x-auto min-h-[250px]">
        {isTableLoading ? (
           <div className="p-6">
             <LoadingSkeleton className="h-6 w-full mb-3" />
             <LoadingSkeleton className="h-6 w-full mb-3" />
             <LoadingSkeleton className="h-6 w-full mb-3" />
             <LoadingSkeleton className="h-6 w-full mb-3" />
           </div>
        ) : isError ? (
           <div className="p-6">
             <EmptyState
               title="Failed to load table data"
               description={error instanceof Error ? error.message : "An error occurred"}
             />
           </div>
        ) : tableData ? (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                {tableData.columns.map((col) => (
                  <th key={col.name} className="px-5 py-3 font-medium">
                    <div className="flex flex-col">
                      <span className="text-stone-900 font-semibold">{col.name}</span>
                      <div className="flex items-center gap-1.5 mt-1 opacity-80">
                        <span className="text-[10px] uppercase tracking-wider bg-stone-200/80 text-stone-600 rounded px-1.5 py-0.5 font-medium">
                          {col.type}
                        </span>
                        {col.nullable && (
                          <span className="text-[10px] uppercase tracking-wider bg-stone-200/80 text-stone-600 rounded px-1.5 py-0.5 font-medium" title="Nullable">
                            NULL
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white group text-stone-700">
              {tableData.rows.length === 0 ? (
                <tr>
                  <td colSpan={tableData.columns.length} className="px-5 py-12 text-center text-stone-500">
                    No rows found in this table.
                  </td>
                </tr>
              ) : (
                tableData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 transition-colors">
                    {tableData.columns.map((col) => {
                      const isAnomalyCell = tableData.anomaly_columns.includes(col.name);
                      const isBinary = ["bytea", "binary", "memoryview"].some(t => col.type.toLowerCase().includes(t));
                      const val = row[col.name];

                      return (
                        <td 
                          key={col.name} 
                          className={`px-5 py-3 text-sm ${isAnomalyCell ? "bg-amber-50/60 font-medium" : ""}`}
                        >
                          {val === null ? (
                            isBinary ? (
                              <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 ring-1 ring-inset ring-stone-200">
                                binary
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-400 ring-1 ring-inset ring-stone-200 italic">
                                NULL
                              </span>
                            )
                          ) : typeof val === "object" ? (
                             JSON.stringify(val)
                          ) : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
