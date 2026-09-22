import { ProposalSummary } from "../../lib/types";
import { formatConfidence, formatDate, truncateFqn } from "../../lib/utils";
import { ConfidenceBadge } from "../shared/confidence-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProposalTableProps {
  proposals: ProposalSummary[];
  onView: (id: string) => void;
}

export function ProposalTable({ proposals, onView }: ProposalTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-stone-200">
          <TableHead className="text-stone-500">Table</TableHead>
          <TableHead className="text-stone-500">Operation</TableHead>
          <TableHead className="text-stone-500">Failure</TableHead>
          <TableHead className="text-stone-500">Status</TableHead>
          <TableHead className="text-stone-500">Confidence</TableHead>
          <TableHead className="text-stone-500">Created</TableHead>
          <TableHead className="text-stone-500 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.map((proposal) => (
          <TableRow key={proposal.proposal_id} className="border-stone-100 hover:bg-stone-50/80">
            <TableCell className="whitespace-normal">
              <div>
                <p className="font-medium text-stone-900">
                  {truncateFqn(proposal.table_fqn)}
                </p>
                <p className="text-xs text-stone-500">{proposal.table_name}</p>
              </div>
            </TableCell>
            <TableCell>
              {proposal.fix_type ? (
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  proposal.fix_type === "DELETE" ? "bg-rose-50 text-rose-700 ring-rose-200" :
                  proposal.fix_type === "UPDATE" ? "bg-amber-50 text-amber-700 ring-amber-200" :
                  proposal.fix_type === "INSERT" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
                  "bg-stone-50 text-stone-700 ring-stone-200"
                }`}>
                  {proposal.fix_type}
                </span>
              ) : (
                <span className="text-stone-400 text-xs">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {proposal.anomaly_type_label ? (
                  <span className="inline-block font-medium text-stone-900 text-sm">
                    {proposal.anomaly_type_label}
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {proposal.failure_categories.map((cat, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                {proposal.status.replace("_", " ")}
              </span>
            </TableCell>
            <TableCell>
              <ConfidenceBadge confidence={proposal.confidence} />
            </TableCell>
            <TableCell className="text-stone-500">
              {formatDate(proposal.created_at)}
            </TableCell>
            <TableCell className="text-right">
              <button
                onClick={() => onView(proposal.proposal_id)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-stone-100 hover:text-stone-900 h-9 px-4 py-2 border border-stone-200 bg-white"
              >
                Review
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
