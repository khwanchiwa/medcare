export type IconName =
  | "activity-heart"
  | "arrow-left"
  | "arrow-right"
  | "bell"
  | "calendar-time"
  | "check"
  | "chevron-right"
  | "clipboard-list"
  | "edit"
  | "eye"
  | "eye-off"
  | "heart"
  | "home"
  | "link"
  | "lock"
  | "logout"
  | "mail"
  | "menu-2"
  | "pill"
  | "plus"
  | "refresh"
  | "scan"
  | "trash"
  | "users"
  | "user"
  | "x";

const paths: Record<IconName, React.ReactNode> = {
  "activity-heart": (
    <>
      <path d="M3 12h4l3 8l4 -16l3 8h4" />
      <path d="M5 12a7 7 0 0 1 14 0c0 5 -7 9 -7 9s-7 -4 -7 -9" />
    </>
  ),
  "arrow-left": <path d="M5 12h14M5 12l6 6M5 12l6 -6" />,
  "arrow-right": <path d="M5 12h14M13 18l6 -6M13 6l6 6" />,
  bell: (
    <>
      <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3l2 3h-16l2 -3v-3a7 7 0 0 1 4 -6" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </>
  ),
  "calendar-time": (
    <>
      <path d="M11 21h-5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3" />
      <path d="M16 3v4M8 3v4M4 11h8" />
      <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M18 16.5v1.5l1 1" />
    </>
  ),
  check: <path d="M5 12l5 5l10 -10" />,
  "chevron-right": <path d="M9 6l6 6l-6 6" />,
  "clipboard-list": (
    <>
      <path d="M9 5h6a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h2" />
      <path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  edit: (
    <>
      <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
      <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
      <path d="M16 5l3 3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5 -7 10 -7s10 7 10 7s-3.5 7 -10 7s-10 -7 -10 -7" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2a9.8 9.8 0 0 1 2.1 -.2c6.5 0 10 8 10 8s-.7 1.6 -2.1 3.2" />
      <path d="M6.6 6.6c-3 2 -4.6 5.4 -4.6 5.4s3.5 8 10 8a9.7 9.7 0 0 0 5.4 -1.6" />
    </>
  ),
  heart: <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />,
  home: (
    <>
      <path d="M3 11l9 -8l9 8" />
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-9" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  link: (
    <>
      <path d="M9 15l6 -6" />
      <path d="M11 6l.5 -.5a4 4 0 0 1 5.657 5.657l-.657 .657" />
      <path d="M13 18l-.5 .5a4 4 0 0 1 -5.657 -5.657l.657 -.657" />
    </>
  ),
  lock: (
    <>
      <path d="M5 11a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-8z" />
      <path d="M8 11v-4a4 4 0 0 1 8 0v4" />
    </>
  ),
  logout: (
    <>
      <path d="M14 8v-2a2 2 0 0 0 -2 -2h-5a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h5a2 2 0 0 0 2 -2v-2" />
      <path d="M9 12h12l-3 -3M18 15l3 -3" />
    </>
  ),
  mail: (
    <>
      <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
      <path d="M3 7l9 6l9 -6" />
    </>
  ),
  "menu-2": <path d="M4 6h16M4 12h16M4 18h16" />,
  pill: (
    <>
      <path d="M10.5 20.5l10 -10a4.95 4.95 0 1 0 -7 -7l-10 10a4.95 4.95 0 1 0 7 7z" />
      <path d="M8.5 8.5l7 7" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    </>
  ),
  scan: (
    <>
      <path d="M4 7v-1a2 2 0 0 1 2 -2h2M16 4h2a2 2 0 0 1 2 2v1M20 17v1a2 2 0 0 1 -2 2h-2M8 20h-2a2 2 0 0 1 -2 -2v-1" />
      <path d="M7 12h10" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <path d="M9 7v-3h6v3" />
    </>
  ),
  user: (
    <>
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    </>
  ),
  users: (
    <>
      <path d="M9 7a4 4 0 1 0 0 8a4 4 0 0 0 0 -8" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
    </>
  ),
  x: <path d="M18 6l-12 12M6 6l12 12" />,
};

export function TablerIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
