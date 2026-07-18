-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_rentChargeId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_utilityBillSplitId_fkey";

-- DropForeignKey
ALTER TABLE "RentCharge" DROP CONSTRAINT "RentCharge_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "UtilityBill" DROP CONSTRAINT "UtilityBill_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "UtilityBillSplit" DROP CONSTRAINT "UtilityBillSplit_unitId_fkey";

-- DropForeignKey
ALTER TABLE "UtilityBillSplit" DROP CONSTRAINT "UtilityBillSplit_utilityBillId_fkey";

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentCharge" ADD CONSTRAINT "RentCharge_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBill" ADD CONSTRAINT "UtilityBill_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBillSplit" ADD CONSTRAINT "UtilityBillSplit_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES "UtilityBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBillSplit" ADD CONSTRAINT "UtilityBillSplit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentChargeId_fkey" FOREIGN KEY ("rentChargeId") REFERENCES "RentCharge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_utilityBillSplitId_fkey" FOREIGN KEY ("utilityBillSplitId") REFERENCES "UtilityBillSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
