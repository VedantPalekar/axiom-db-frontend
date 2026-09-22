"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { AuditEntry } from "../../lib/types";
import { formatConfidence, formatDate, truncateFqn } from "../../lib/utils";
import { EmptyState } from "../shared/empty-state";
import { AuditEntryDetail, getAssertionSummary } from "./audit-entry-detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditTableProps {
  entries: AuditEntry[];
}

const actionTone: Record<AuditEntry["action"], string> = {
  applied: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  dry_run: "bg-amber-50 text-amber-700 ring-amber-100",
  failed: "bg-rose-50 text-rose-700 ring-rose-100",
  rolled_back: "bg-orange-50 text-orange-700 ring-orange-100",
  skipped: "bg-stone-100 text-stone-700 ring-stone-200",
};

export function AuditTable({ entries }: AuditTableProps) {
  const [openRows, setOpenRows] = useState<number[]>([]);

  const openRowSet = useMemo(() => new Set(openRows), [openRows]);

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No audit entries yet"
        description="Applied fixes, dry-runs, and failures will appear here once the pipeline starts writing audit data."
      />
    );
  }

  const toggleRow = (entryId: number) => {
    setOpenRows((current) =>
      current.includes(entryId)
        ? current.filter((id) => id !== entryId)
        : [...current, entryId],
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-stone-200">
          <TableHead className="w-12 text-stone-500"> </TableHead>
          <TableHead className="text-stone-500">Table</TableHead>
          <TableHead className="text-stone-500">Action</TableHead>
          <TableHead className="text-stone-500">Rows</TableHead>
          <TableHead className="text-stone-500">Confidence</TableHead>
          <TableHead className="text-stone-500">Applied</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const isOpen = openRowSet.has(entry.id);
          const assertions = entry.post_apply_assertions ?? [];
          const assertionSummary = getAssertionSummary(assertions);

          return (
            <Fragment key={entry.id}>
              <TableRow
                className={`cursor-pointer border-stone-100 transition-colors hover:bg-stone-50/80 ${
                  isOpen ? "bg-stone-50/60" : ""
                }`}
                onClick={() => toggleRow(entry.id)}
                aria-expanded={isOpen}
              >
                <TableCell>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleRow(entry.id);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                    aria-label={isOpen ? "Collapse audit entry" : "Expand audit entry"}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div>
                    <p className="font-medium text-stone-900">
                      {truncateFqn(entry.table_fqn)}
                    </p>
                    <Link
                      href={`/audit/${encodeURIComponent(entry.event_id)}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-stone-500 transition-colors hover:text-stone-900"
                    >
                      <span>{entry.event_id}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${actionTone[entry.action]}`}
                  >
                    {entry.action.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="text-stone-700">{entry.rows_affected}</TableCell>
                <TableCell className="text-stone-700">
                  {formatConfidence(entry.confidence)}
                </TableCell>
                <TableCell className="text-stone-500">
                  <div className="space-y-1">
                    <p>{formatDate(entry.applied_at)}</p>
                    {assertions.length > 0 ? (
                      <p className="text-xs text-stone-400">
                        {assertionSummary.passed}/{assertionSummary.total} checks passed
                      </p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>

              {isOpen ? (
                <TableRow className="border-stone-100 bg-white">
                  <TableCell colSpan={6} className="p-0">
                    <div className="border-t border-stone-100 bg-stone-50/40 px-4 py-5 sm:px-6">
                      <div className="mb-4 flex justify-end">
                        <Link
                          href={`/audit/${encodeURIComponent(entry.event_id)}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open detail view
                        </Link>
                      </div>
                      <AuditEntryDetail entry={entry} />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
