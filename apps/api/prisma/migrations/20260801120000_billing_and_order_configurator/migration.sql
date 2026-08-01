-- Store structured client identity and billing data for future invoices.
ALTER TABLE "User"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "companyName" TEXT,
ADD COLUMN "billingAddressLine1" TEXT,
ADD COLUMN "billingAddressLine2" TEXT,
ADD COLUMN "billingCity" TEXT,
ADD COLUMN "billingRegion" TEXT,
ADD COLUMN "billingPostalCode" TEXT,
ADD COLUMN "billingCountry" TEXT,
ADD COLUMN "taxId" TEXT;

-- Snapshot the complete brief and server-calculated estimate on every order.
ALTER TABLE "Order"
ADD COLUMN "buildApproach" TEXT NOT NULL DEFAULT 'NEW_WEBSITE',
ADD COLUMN "selectedFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "estimatedPriceCents" INTEGER,
ADD COLUMN "contactFirstName" TEXT,
ADD COLUMN "contactLastName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "billingCompanyName" TEXT,
ADD COLUMN "billingAddressLine1" TEXT,
ADD COLUMN "billingAddressLine2" TEXT,
ADD COLUMN "billingCity" TEXT,
ADD COLUMN "billingRegion" TEXT,
ADD COLUMN "billingPostalCode" TEXT,
ADD COLUMN "taxId" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "billingDetails" JSONB;
