import { Badge } from "./badge";
import { Button } from "./button";
import { TablerIcon } from "./tabler-icons";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-section border border-border bg-white/95 p-6 shadow-soft ${className}`}>{children}</section>;
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-serifThai text-3xl font-semibold text-navy-900 md:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-3xl text-lg text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function InfoGrid({ items }: { items: { label: string; value: string; tone?: "success" | "warning" | "info" | "neutral" }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-slate-600">{item.label}</p>
          <p className="mt-2 font-serifThai text-2xl font-semibold text-navy-900">{item.value}</p>
          {item.tone ? <div className="mt-3"><Badge tone={item.tone}>{item.label}</Badge></div> : null}
        </Card>
      ))}
    </div>
  );
}

export function EmptyMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <Card>
      <h2 className="font-serifThai text-2xl font-semibold text-navy-900">{title}</h2>
      <p className="mt-2 text-slate-600">{detail}</p>
      <div className="mt-4">
        <Button href="/patient/dashboard" icon={<TablerIcon name="home" />} variant="secondary">กลับหน้าแดชบอร์ด</Button>
      </div>
    </Card>
  );
}
