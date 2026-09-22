import { StreamInfo } from "../../lib/types";

interface StreamStatsProps {
  streams: Record<string, StreamInfo>;
}

export function StreamStats({ streams }: StreamStatsProps) {
  const items = Object.entries(streams);

  if (items.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No stream metrics available from the backend.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([name, stream]) => (
        <div
          key={name}
          className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm"
        >
          <p className="text-sm font-medium text-stone-900">{name}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-stone-900">
                {stream.length}
              </p>
              <p className="text-xs text-stone-500">Queued messages</p>
            </div>
            <p className="max-w-[10rem] truncate text-right text-xs text-stone-500">
              {stream.last_message_id ?? "No messages yet"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
