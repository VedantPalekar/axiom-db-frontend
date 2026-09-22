import { ConnectionSummary } from "../../lib/types";
import { formatDate } from "../../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ConnectionsTableProps {
  connections: ConnectionSummary[];
  onView: (id: string) => void;
}

export function ConnectionsTable({ connections, onView }: ConnectionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-stone-200">
          <TableHead className="text-stone-500">Service</TableHead>
          <TableHead className="text-stone-500">Connection Info</TableHead>
          <TableHead className="text-stone-500">Status</TableHead>
          <TableHead className="text-stone-500">Tables / Anomalies</TableHead>
          <TableHead className="text-stone-500">Registered At</TableHead>
          <TableHead className="text-stone-500 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {connections.map((connection) => (
          <TableRow key={connection.connection_id} className="border-stone-100 hover:bg-stone-50/80">
            <TableCell className="whitespace-normal">
              <p className="font-medium text-stone-900">
                {connection.service_name}
              </p>
            </TableCell>
            <TableCell>
              <div className="max-w-[200px]">
                <p className="text-sm font-mono text-stone-600 truncate" title={connection.connection_hint}>
                  {connection.connection_hint}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">DB: {connection.db_name}</p>
              </div>
            </TableCell>
            <TableCell>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 capitalize ${
               connection.status === "ready" 
                 ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                 : connection.status === "failed"
                 ? "bg-rose-50 text-rose-700 ring-rose-100"
                 : connection.status === "connected"
                 ? "bg-blue-50 text-blue-700 ring-blue-100"
                 : "bg-amber-50 text-amber-700 ring-amber-100" // pending, ingesting, profiling
              }`}>
                {connection.status}
              </span>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <span className="font-medium text-stone-900">{connection.tables_found ?? '--'}</span>
                <span className="text-stone-400 mx-1">/</span>
                <span className="font-medium text-stone-900">{connection.total_anomalies ?? '--'}</span>
               </div>
            </TableCell>
            <TableCell className="text-stone-500">
              {formatDate(connection.registered_at)}
            </TableCell>
            <TableCell className="text-right">
              <button
                onClick={() => onView(connection.connection_id)}
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
