import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  full?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variants = {
  primary: "bg-blue-600 text-white shadow-[0_8px_20px_rgba(21,95,143,0.18)] hover:bg-navy-800 hover:shadow-[0_12px_26px_rgba(21,95,143,0.26)]",
  secondary: "border border-blue-100 bg-white text-navy-800 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:shadow-md",
  ghost: "border border-border bg-white text-navy-800 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-navy-900 hover:shadow-md",
  danger: "border border-red-200 bg-red-50 text-red-700 shadow-sm hover:border-red-300 hover:bg-red-600 hover:text-white hover:shadow-md",
  success: "border border-emerald-600 bg-emerald-600 text-white shadow-[0_8px_20px_rgba(5,150,105,0.24)] hover:border-emerald-700 hover:bg-emerald-700 hover:shadow-[0_12px_26px_rgba(5,150,105,0.30)]",
};

export function Button({ children, icon, href, target, rel, variant = "primary", full, type = "button", onClick, disabled }: ButtonProps) {
  const className = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-center text-base font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${disabled ? "cursor-not-allowed opacity-60" : ""} ${variants[variant]} ${full ? "w-full" : ""}`;
  if (href) {
    if (href.startsWith("http")) {
      return <a className={className} href={href} rel={rel ?? "noreferrer"} target={target ?? "_blank"}>{icon}<span>{children}</span></a>;
    }
    return <Link className={className} href={href}>{icon}<span>{children}</span></Link>;
  }
  return <button className={className} disabled={disabled} onClick={onClick} type={type}>{icon}<span>{children}</span></button>;
}
