import Link from "next/link";
import { db } from "@/lib/db";
import { pillClass, reminderStatusTone } from "@/components/ui";

export default async function RemindersPage() {
  const logs = await db.reminderLog.findMany({
    include: { tenant: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#323338]">Reminders</h1>
        <p className="mt-1 text-sm text-zinc-600">History of every reminder sent, automatic or manual.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <table className="w-full text-sm">
          <thead className="bg-[#f6f7fb] text-left text-zinc-600">
            <tr>
              <th className="px-4 py-2 font-semibold">When</th>
              <th className="px-4 py-2 font-semibold">Tenant</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="px-4 py-2 font-semibold">Channel</th>
              <th className="px-4 py-2 font-semibold">Trigger</th>
              <th className="px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-600">
                  No reminders sent yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-700">{log.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <Link href={`/tenants/${log.tenant.id}`} className="text-[#323338] hover:underline">
                    {log.tenant.firstName} {log.tenant.lastName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-700">{log.type.replaceAll("_", " ").toLowerCase()}</td>
                <td className="px-4 py-2 text-zinc-700">{log.channel}</td>
                <td className="px-4 py-2 text-zinc-700">{log.triggeredBy}</td>
                <td className="px-4 py-2">
                  <span className={pillClass(reminderStatusTone(log.status))}>{log.status}</span>
                  {log.errorMessage && <span className="ml-2 text-zinc-600">({log.errorMessage})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
