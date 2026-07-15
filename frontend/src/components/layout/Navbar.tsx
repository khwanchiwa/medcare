export function Navbar({ title, role }: { title: string; role: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 px-4 py-4 pr-28 shadow-[0_10px_30px_rgba(27,108,158,0.06)] backdrop-blur lg:px-8">
      <p className="text-sm font-semibold text-blue-600">{role}</p>
      <h1 className="font-serifThai text-xl font-semibold text-navy-900 md:text-2xl">{title}</h1>
    </header>
  );
}
