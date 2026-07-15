import { TablerIcon } from "./tabler-icons";

export function Tabs({ tabs, active }: { tabs: string[]; active: string }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-card border border-border bg-white p-2">
      {tabs.map((tab) => (
        <button key={tab} className={`inline-flex min-h-11 items-center gap-2 rounded-card px-4 py-2 font-semibold ${tab === active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100"}`} type="button">
          <TablerIcon name="chevron-right" className="h-4 w-4" />
          {tab}
        </button>
      ))}
    </div>
  );
}
