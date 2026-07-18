export const inputClass =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-[#323338] focus:border-[#0073ea] focus:outline-none focus:ring-2 focus:ring-[#0073ea]/20";
export const selectClass = inputClass;
export const labelClass = "mb-1 block text-sm font-medium text-[#323338]";
export const buttonClass =
  "rounded-lg bg-[#0073ea] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0060b9] disabled:opacity-50";
export const secondaryButtonClass =
  "rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-[#323338] hover:bg-zinc-50";
export const dangerButtonClass =
  "rounded-lg border border-[#e2445c]/30 px-4 py-2 text-sm font-semibold text-[#e2445c] hover:bg-[#e2445c]/5";
export const cardClass =
  "rounded-xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]";
export const sectionTitleClass = "text-lg font-bold text-[#323338]";

export type PillTone = "green" | "orange" | "red" | "blue" | "purple" | "grey";

const pillToneClasses: Record<PillTone, string> = {
  green: "bg-[#00c875] text-white",
  orange: "bg-[#fdab3d] text-white",
  red: "bg-[#e2445c] text-white",
  blue: "bg-[#0073ea] text-white",
  purple: "bg-[#a25ddc] text-white",
  grey: "bg-zinc-200 text-[#676879]",
};

export function pillClass(tone: PillTone): string {
  return `inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${pillToneClasses[tone]}`;
}

export function leaseStatusTone(status: string): PillTone {
  if (status === "ACTIVE") return "green";
  if (status === "UPCOMING") return "blue";
  return "grey";
}

export function reminderStatusTone(status: string): PillTone {
  return status === "SENT" ? "green" : "red";
}
