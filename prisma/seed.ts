import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const property = await db.property.create({
    data: {
      name: "Maple Street Fourplex",
      address: "123 Maple Street, Springfield, USA",
      units: {
        create: [
          { label: "Unit A" },
          { label: "Unit B" },
          { label: "Unit C" },
          { label: "Unit D" },
        ],
      },
    },
    include: { units: true },
  });

  const [unitA, unitB] = property.units;

  const tenantAlice = await db.tenant.create({
    data: {
      firstName: "Alice",
      lastName: "Nguyen",
      email: "alice.example@example.com",
      phone: "+15551230001",
    },
  });

  const tenantBob = await db.tenant.create({
    data: {
      firstName: "Bob",
      lastName: "Smith",
      email: "bob.example@example.com",
      phone: "+15551230002",
    },
  });

  await db.lease.create({
    data: {
      unitId: unitA.id,
      tenantId: tenantAlice.id,
      rentAmount: 1450.0,
      dueDay: 1,
      startDate: new Date("2026-01-01"),
      status: "ACTIVE",
    },
  });

  await db.lease.create({
    data: {
      unitId: unitB.id,
      tenantId: tenantBob.id,
      rentAmount: 1400.0,
      dueDay: 1,
      startDate: new Date("2026-01-01"),
      status: "ACTIVE",
    },
  });

  const totalAmount = 200.0;
  const perUnit = Math.round((totalAmount / property.units.length) * 100) / 100;
  const remainder =
    Math.round((totalAmount - perUnit * property.units.length) * 100) / 100;

  await db.utilityBill.create({
    data: {
      propertyId: property.id,
      type: "electric",
      totalAmount,
      billDate: new Date("2026-06-01"),
      dueDate: new Date("2026-06-15"),
      splitMethod: "EQUAL",
      splits: {
        create: property.units.map((unit, i) => ({
          unitId: unit.id,
          amount: i === 0 ? perUnit + remainder : perUnit,
        })),
      },
    },
  });

  console.log("Seeded:", {
    property: property.name,
    units: property.units.length,
    tenants: [tenantAlice.email, tenantBob.email],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
