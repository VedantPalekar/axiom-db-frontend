"use client";

import { useMemo } from "react";

interface DataDiffProps {
  sampleBefore: Record<string, unknown>[];
  sampleAfter: Record<string, unknown>[];
  highlightedColumns?: string[];
}

function processMemoryString(val: unknown) {
  if (typeof val === "string") {
    if (val.startsWith("<memory at 0x")) {
      return (
        <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600 ring-1 ring-inset ring-stone-500/10">
          binary
        </span>
      );
    }
    if (val.length > 50) {
      return (
        <span title={val} className="cursor-help">
          {val.slice(0, 47)}&hellip;
        </span>
      );
    }
    return val;
  }
  if (val === null) {
    return (
      <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-500 ring-1 ring-inset ring-stone-400/20 italic">
        NULL
      </span>
    );
  }
  if (typeof val === "object") {
    return <span className="font-mono text-xs">{JSON.stringify(val)}</span>;
  }
  return String(val);
}

export function DataDiff({ sampleBefore, sampleAfter, highlightedColumns = [] }: DataDiffProps) {
  const isDeleted = (row: Record<string, unknown>) => Object.keys(row).length === 0;

  const columns = useMemo(() => {
    const cols = new Set<string>();
    [...(sampleBefore || []), ...(sampleAfter || [])].forEach((row) => {
      Object.keys(row).forEach((k) => cols.add(k));
    });
    
    return Array.from(cols).sort((a, b) => {
      // 1. Highlighted columns first
      const aHighlight = highlightedColumns.includes(a);
      const bHighlight = highlightedColumns.includes(b);
      if (aHighlight && !bHighlight) return -1;
      if (!aHighlight && bHighlight) return 1;

      // 2. ID/key columns second (for easy row identification)
      const aIsId = a === "id" || a.endsWith("_id");
      const bIsId = b === "id" || b.endsWith("_id");
      if (aIsId && !bIsId) return -1;
      if (!aIsId && bIsId) return 1;

      // 3. Alphabetical remainder
      return a.localeCompare(b);
    });
  }, [sampleBefore, sampleAfter, highlightedColumns]);

  if (columns.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-center text-sm text-stone-500">
        No sample data available.
      </div>
    );
  }

  const renderTable = (data: Record<string, unknown>[], title: string) => {
    const isAfterTable = title === "After";
    const isBeforeTable = title === "Before";

    return (
      <div className="flex-1 overflow-hidden flex flex-col rounded-xl border border-stone-200 bg-white">
        <div className="bg-stone-50 px-4 py-2 border-b border-stone-200">
          <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-stone-500 border-b border-stone-100">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data && data.length > 0 ? (
                data.map((row, idx) => {
                  const empty = isDeleted(row);
                  return (
                    <tr key={idx} className="hover:bg-stone-50">
                      {columns.map((col, colIdx) => {
                        const isHighlight = highlightedColumns.includes(col);
                        
                        if (empty) {
                          return (
                            <td key={col} className="px-4 py-2">
                              {colIdx === 0 && (
                                isAfterTable ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-rose-200">
                                    Deleted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                    Inserted
                                  </span>
                                )
                              )}
                            </td>
                          );
                        }

                        return (
                          <td
                            key={col}
                            className={`px-4 py-2 ${
                              isHighlight ? "bg-amber-50/60 font-medium" : ""
                            }`}
                          >
                            {processMemoryString(row[col])}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-stone-400">
                    No rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 w-full">
      {renderTable(sampleBefore, "Before")}
      {renderTable(sampleAfter, "After")}
    </div>
  );
}
