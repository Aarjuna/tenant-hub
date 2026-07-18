import Link from "next/link";
import { db } from "@/lib/db";
import { buttonClass, cardClass, inputClass, labelClass, sectionTitleClass } from "@/components/ui";
import { createProperty } from "./actions";

export default async function PropertiesPage() {
  const properties = await db.property.findMany({
    include: { units: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[#323338]">Properties</h1>
        <p className="mt-1 text-sm text-zinc-600">Your rental properties and their units.</p>
      </div>

      <div className="flex flex-col gap-3">
        {properties.length === 0 && (
          <p className="text-sm text-zinc-600">No properties yet — add one below.</p>
        )}
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className={`${cardClass} block hover:border-zinc-400`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#323338]">{property.name}</p>
                <p className="text-sm text-zinc-600">{property.address}</p>
              </div>
              <p className="text-sm text-zinc-600">
                {property.units.length} unit{property.units.length === 1 ? "" : "s"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Add a property</h2>
        <form action={createProperty} className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input id="name" name="name" required className={inputClass} placeholder="Maple Street Fourplex" />
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Address
            </label>
            <input
              id="address"
              name="address"
              required
              className={inputClass}
              placeholder="123 Maple Street, Springfield, USA"
            />
          </div>
          <button type="submit" className={`${buttonClass} self-start`}>
            Add property
          </button>
        </form>
      </div>
    </div>
  );
}
