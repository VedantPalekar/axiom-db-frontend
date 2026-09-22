interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
