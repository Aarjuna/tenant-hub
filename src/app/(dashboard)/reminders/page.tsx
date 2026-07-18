import Link from "next/link";
import { db } from "@/lib/db";

export default async function RemindersPage() {
  const logs = await db.reminderLog.findMany({
    include: { tenant: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Reminders</h1>
        <p className="mt-1 text-sm text-zinc-500">History of every reminder sent, automatic or manual.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Trigger</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  No reminders sent yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-700">{log.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <Link href={`/tenants/${log.tenant.id}`} className="text-zinc-900 hover:underline">
                    {log.tenant.firstName} {log.tenant.lastName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-700">{log.type.replaceAll("_", " ").toLowerCase()}</td>
                <td className="px-4 py-2 text-zinc-700">{log.channel}</td>
                <td className="px-4 py-2 text-zinc-700">{log.triggeredBy}</td>
                <td className={`px-4 py-2 ${log.status === "SENT" ? "text-green-600" : "text-red-600"}`}>
                  {log.status}
                  {log.errorMessage && <span className="ml-1 text-zinc-400">({log.errorMessage})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
