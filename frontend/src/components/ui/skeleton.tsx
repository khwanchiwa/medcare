export function Skeleton({ label = "กำลังโหลดข้อมูล" }: { label?: string }) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-[24px] border border-border bg-white/90 px-6 py-10 shadow-[0_10px_34px_rgba(20,46,86,0.08)]">
      <div className="w-full max-w-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-100">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
        <p className="mt-4 text-center text-base font-semibold text-slate-600">{label}</p>
      </div>
    </div>
  );
}
