export function Calendar({ dates }: { dates: { date: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {dates.map((item) => (
        <div key={item.date} className="rounded-card border border-border bg-white p-4">
          <div className="font-mono text-lg font-semibold text-navy-900">{item.date}</div>
          <div className="mt-2 text-slate-600">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
