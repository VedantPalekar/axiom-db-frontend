import { ProfilingReportSummary } from "../../lib/types";
import { formatDate } from "../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportsTableProps {
  reports: ProfilingReportSummary[];
  onView: (id: string) => void;
}

export function ReportsTable({ reports, onView }: ReportsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-stone-200">
          <TableHead className="text-stone-500">Report ID / Connection</TableHead>
          <TableHead className="text-stone-500">Status</TableHead>
          <TableHead className="text-stone-500">Tables Scanned</TableHead>
          <TableHead className="text-stone-500">Anomalies Detected</TableHead>
          <TableHead className="text-stone-500">Created</TableHead>
          <TableHead className="text-stone-500 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.report_id} className="border-stone-100 hover:bg-stone-50/80">
            <TableCell className="whitespace-normal">
              <div>
                <p className="font-medium text-stone-900 truncate max-w-[200px]" title={report.report_id}>
                  {report.report_id.slice(0, 8)}...{report.report_id.slice(-4)}
                </p>
                <p className="text-xs text-stone-500 truncate max-w-[200px]" title={report.connection_hint}>
                  {report.connection_hint}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                report.status === "completed" 
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                  : report.status === "failed"
                  ? "bg-rose-50 text-rose-700 ring-rose-100"
                  : report.status === "partial"
                  ? "bg-amber-50 text-amber-700 ring-amber-100"
                  : "bg-blue-50 text-blue-700 ring-blue-100"
              }`}>
                {report.status}
              </span>
            </TableCell>
            <TableCell className="text-stone-700">
              {report.tables_scanned}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-900">{report.total_anomalies}</span>
                {(report.critical_count > 0 || report.warning_count > 0) && (
                  <div className="flex gap-1 text-xs">
                    {report.critical_count > 0 && <span className="text-rose-600">({report.critical_count} crit)</span>}
                    {report.warning_count > 0 && <span className="text-amber-600">({report.warning_count} warn)</span>}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-stone-500">
              {formatDate(report.created_at)}
            </TableCell>
            <TableCell className="text-right">
              <button
                onClick={() => onView(report.report_id)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-stone-100 hover:text-stone-900 h-9 px-4 py-2 border border-stone-200 bg-white"
              >
                View
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
