export function Toast({ message }: { message: string }) {
  return <div className="rounded-card border border-border bg-success-100 px-4 py-3 font-semibold text-success-600 shadow-soft" role="status">{message}</div>;
}
