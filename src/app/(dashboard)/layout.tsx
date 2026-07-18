import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/properties", label: "Properties" },
  { href: "/tenants", label: "Tenants" },
  { href: "/utility-bills/new", label: "Add Utility Bill" },
  { href: "/payments/new", label: "Record Payment" },
  { href: "/reminders", label: "Reminders" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold text-zinc-900">Tenant Hub</span>
            <nav className="flex gap-5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action="/api/logout" method="POST">
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
