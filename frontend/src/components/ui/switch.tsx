"use client";

import { useState } from "react";

export function Switch({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button type="button" onClick={() => setChecked(!checked)} className="flex min-h-11 w-full items-center justify-between gap-4 rounded-card border border-border bg-white px-4 py-3 text-left font-semibold text-slate-800">
      <span>{label}</span>
      <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? "bg-success-600" : "bg-slate-400"}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
