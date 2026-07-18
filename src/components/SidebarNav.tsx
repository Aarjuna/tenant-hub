"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
    ),
  },
  {
    href: "/properties",
    label: "Properties",
    icon: (
      <path d="M4 21V8l8-5 8 5v13h-5v-6h-6v6H4z" />
    ),
  },
  {
    href: "/tenants",
    label: "Tenants",
    icon: (
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H5z" />
    ),
  },
  {
    href: "/utility-bills/new",
    label: "Add Utility Bill",
    icon: <path d="M13 2 3 14h6l-1 8 10-12h-6l1-8z" />,
  },
  {
    href: "/payments/new",
    label: "Record Payment",
    icon: (
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.75 5v1.1c1.3.24 2.4 1.02 2.47 2.4h-1.6c-.06-.66-.6-1.15-1.62-1.15-1.05 0-1.6.46-1.6 1.06 0 .52.4.83 1.66 1.14 1.86.46 2.99 1.1 2.99 2.65 0 1.35-1.06 2.19-2.5 2.44V16h-1.5v-1.05c-1.36-.23-2.43-1.02-2.53-2.5h1.6c.08.72.6 1.22 1.75 1.22 1.1 0 1.67-.47 1.67-1.1 0-.55-.42-.87-1.7-1.18-1.72-.42-2.94-1.08-2.94-2.62 0-1.28 1-2.14 2.4-2.38V7h1.5z" />
    ),
  },
  {
    href: "/reminders",
    label: "Reminders",
    icon: (
      <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm7-6v-5a7 7 0 10-14 0v5l-2 2v1h18v-1l-2-2z" />
    ),
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.split("?")[0]);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white border-l-[3px] border-[#0073ea] -ml-[3px] pl-[15px]"
                : "text-[#c5c7d0] hover:bg-white/5 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
              {link.icon}
            </svg>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
