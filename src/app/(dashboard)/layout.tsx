import { SidebarNav } from "@/components/SidebarNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-60 shrink-0 flex-col bg-[#292f4c] py-5">
        <div className="mb-6 flex items-center gap-2 px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0073ea] text-sm font-black text-white">
            T
          </span>
          <span className="text-base font-bold text-white">Tenant Hub</span>
        </div>
        <SidebarNav />
        <div className="mt-auto px-3 pt-4">
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#c5c7d0] hover:bg-white/5 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
                <path d="M16 17v-3H9v-4h7V7l5 5-5 5zM14 2a2 2 0 012 2v2h-2V4H5v16h9v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h9z" />
              </svg>
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
