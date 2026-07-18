import { buttonClass, inputClass, labelClass } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-[#f6f7fb] px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200/80 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0073ea] text-base font-black text-white">
            T
          </span>
          <span className="text-lg font-bold text-[#323338]">Tenant Hub</span>
        </div>
        <p className="mb-6 text-sm text-zinc-600">Sign in to manage your properties.</p>

        {error && (
          <p className="mb-4 rounded-md bg-[#e2445c]/10 px-3 py-2 text-sm text-[#e2445c]">
            Invalid email or password.
          </p>
        )}

        <form action="/api/login" method="POST" className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <button type="submit" className={`${buttonClass} mt-2`}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
