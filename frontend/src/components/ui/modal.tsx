import { Card } from "./card";
import { Button } from "./button";
import { TablerIcon } from "./tabler-icons";

export function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-section border border-border bg-blue-100 p-4">
      <Card>
        <div className="flex flex-col gap-4">
          <h2 className="font-serifThai text-2xl font-semibold text-navy-900">{title}</h2>
          {children}
          <Button icon={<TablerIcon name="check" />} variant="secondary">รับทราบ</Button>
        </div>
      </Card>
    </div>
  );
}
