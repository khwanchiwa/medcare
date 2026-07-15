const styles = {
  success: "bg-success-100 text-success-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-navy-900",
  neutral: "bg-white text-slate-600 border border-border",
};

export function Badge({ children, tone = "info" }: { children: React.ReactNode; tone?: keyof typeof styles }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${styles[tone]}`}>{children}</span>;
}
