"use client";

import { useId, useState } from "react";
import { TablerIcon } from "@/components/ui/tabler-icons";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  showRequiredIndicator?: boolean;
};

export function Input({ label, hint, className = "", type = "text", id, required, showRequiredIndicator = true, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isPassword = type === "password";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="grid gap-2 text-base font-semibold text-slate-800">
      <label htmlFor={inputId}>
        {label}
        {required && showRequiredIndicator ? <span className="ml-1 text-red-500" aria-hidden="true">*</span> : null}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && isPasswordVisible ? "text" : type}
          required={required}
          className={`min-h-11 w-full rounded-card border border-border bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 ${isPassword ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="absolute inset-y-0 right-1 grid w-11 place-items-center rounded-lg text-slate-500 transition-colors hover:text-[#0F4C81] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={isPasswordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            aria-pressed={isPasswordVisible}
          >
            <TablerIcon name={isPasswordVisible ? "eye-off" : "eye"} className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {hint ? <span className="text-sm font-normal text-slate-600">{hint}</span> : null}
    </div>
  );
}
