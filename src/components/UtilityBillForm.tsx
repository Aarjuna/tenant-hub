"use client";

import { useMemo, useState } from "react";
import { splitByFixedAmount, splitByPercentage, splitEqual, type UnitSplitAmount } from "@/lib/utilitySplit";
import { buttonClass, inputClass, labelClass, selectClass } from "@/components/ui";

type PropertyWithUnits = {
  id: string;
  name: string;
  units: { id: string; label: string }[];
};

type SplitMethod = "EQUAL" | "PERCENTAGE" | "FIXED_AMOUNT";

export function UtilityBillForm({
  properties,
  action,
  defaultPropertyId,
}: {
  properties: PropertyWithUnits[];
  action: (formData: FormData) => void;
  defaultPropertyId?: string;
}) {
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? properties[0]?.id ?? "");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("EQUAL");
  const [unitValues, setUnitValues] = useState<Record<string, string>>({});

  const property = properties.find((p) => p.id === propertyId);
  const units = property?.units ?? [];
  const total = Number(totalAmount) || 0;

  const preview: UnitSplitAmount[] | string | null = useMemo(() => {
    if (!units.length || total <= 0) return null;
    try {
      if (splitMethod === "EQUAL") {
        return splitEqual(total, units.map((u) => u.id));
      }
      if (splitMethod === "PERCENTAGE") {
        return splitByPercentage(
          total,
          units.map((u) => ({ unitId: u.id, percentage: Number(unitValues[u.id]) || 0 }))
        );
      }
      return splitByFixedAmount(
        total,
        units.map((u) => ({ unitId: u.id, amount: Number(unitValues[u.id]) || 0 }))
      );
    } catch (err) {
      return err instanceof Error ? err.message : "Invalid split";
    }
  }, [units, total, splitMethod, unitValues]);

  const previewError = typeof preview === "string" ? preview : null;
  const previewSplits = Array.isArray(preview) ? preview : null;

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="propertyId" className={labelClass}>
          Property
        </label>
        <select
          id="propertyId"
          name="propertyId"
          required
          value={propertyId}
          onChange={(e) => {
            setPropertyId(e.target.value);
            setUnitValues({});
          }}
          className={selectClass}
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className={labelClass}>
            Type
          </label>
          <input id="type" name="type" required className={inputClass} placeholder="electric" />
        </div>
        <div>
          <label htmlFor="totalAmount" className={labelClass}>
            Total amount ($)
          </label>
          <input
            id="totalAmount"
            name="totalAmount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="billDate" className={labelClass}>
            Bill date
          </label>
          <input id="billDate" name="billDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="dueDate" className={labelClass}>
            Due date
          </label>
          <input id="dueDate" name="dueDate" type="date" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="splitMethod" className={labelClass}>
          Split method
        </label>
        <select
          id="splitMethod"
          name="splitMethod"
          value={splitMethod}
          onChange={(e) => setSplitMethod(e.target.value as SplitMethod)}
          className={selectClass}
        >
          <option value="EQUAL">Equal across units</option>
          <option value="PERCENTAGE">By percentage</option>
          <option value="FIXED_AMOUNT">Fixed amount per unit</option>
        </select>
      </div>

      <div className="rounded-md border border-zinc-200 p-4">
        <p className="mb-3 text-sm font-medium text-zinc-700">Split preview</p>
        <div className="flex flex-col gap-2">
          {units.map((unit) => {
            const splitForUnit = previewSplits?.find((s) => s.unitId === unit.id);
            return (
              <div key={unit.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-600">{unit.label}</span>
                {splitMethod !== "EQUAL" && (
                  <input
                    name={`unit_${unit.id}`}
                    type="number"
                    step="0.01"
                    value={unitValues[unit.id] ?? ""}
                    onChange={(e) => setUnitValues((v) => ({ ...v, [unit.id]: e.target.value }))}
                    placeholder={splitMethod === "PERCENTAGE" ? "%" : "$"}
                    className={`${inputClass} w-28`}
                  />
                )}
                <span className="w-20 text-right text-sm text-[#323338]">
                  {splitForUnit ? `$${splitForUnit.amount.toFixed(2)}` : "—"}
                </span>
              </div>
            );
          })}
        </div>
        {previewError && <p className="mt-3 text-sm text-[#e2445c]">{previewError}</p>}
        {!previewError && !previewSplits && (
          <p className="mt-3 text-sm text-zinc-600">Enter a total amount to see the split.</p>
        )}
      </div>

      <button type="submit" disabled={!previewSplits} className={`${buttonClass} self-start`}>
        Create utility bill
      </button>
    </form>
  );
}
